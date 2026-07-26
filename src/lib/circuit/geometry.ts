/**
 * CIRCUIT GEOMETRY
 *
 * Pure routing maths for the data-bus overlay. Everything works in region-local
 * pixels (an element's box measured against its region's box), so results stay
 * correct under any ancestor transform, including Bend's canvas scroller.
 *
 * Topology is a bus, not a set of independent lines: one trunk leaves the
 * source, turns onto a shared spine, and every node branches off that spine at
 * its own junction.
 */

export interface Point {
  x: number;
  y: number;
}

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * How a branch approaches its node.
 * - `left`  stub into the node's left edge at its vertical centre. Full-width nodes.
 * - `top`   run just above the node, then drop onto its top edge.
 * - `rail`  run along the region's rail lane, then drop onto the node's top edge.
 *           For nodes in a right-hand column, where a lane at the node's own top
 *           would cross the content beside it.
 */
export type NodeEdge = 'left' | 'top' | 'rail';

export interface RouteSpec {
  id: string;
  box: Box;
  edge: NodeEdge;
}

export interface RouteOptions {
  /** Region width in region-local pixels. Terminals never route past it. */
  width: number;
  /** x of the shared spine. Normally negative: the spine sits in the page gutter. */
  spineX: number;
  /** y of the rail lane used by `rail` branches. */
  railY: number;
  /** Clearance above a node for the lane a `top` branch travels along. */
  topLane: number;
  /** Ideal vertical drop below the source before the trunk turns onto the spine. */
  drop: number;
  /** Space kept between a terminal pin and the node edge it serves. */
  pinGap: number;
  /** Corner rounding on right-angle turns. */
  bendRadius: number;
  /** Shortest run a branch may take off the spine, so junctions stay legible. */
  minBranch: number;
}

export interface Branch {
  id: string;
  /** Full source-to-node route. This is the track a packet travels. */
  d: string;
  /** Spine-to-node segment only, so the shared trunk is never stroked twice. */
  spur: string;
  junction: Point;
  terminal: Point;
  /** Axis the branch arrives along. Terminal pins are drawn across it. */
  axis: 'x' | 'y';
}

export interface BusLayout {
  origin: Point;
  spineX: number;
  /** One entry per stroked trunk arm: downward always, upward only when needed. */
  trunks: string[];
  branches: Branch[];
  /** Anchor for the bus label, at the far end of the downward arm. */
  label: Point;
}

const EPSILON = 0.01;

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(max, Math.max(min, value));
}

function isSamePoint(a: Point, b: Point): boolean {
  return Math.abs(a.x - b.x) < EPSILON && Math.abs(a.y - b.y) < EPSILON;
}

function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** The point `travel` px from `from` along the line towards `to`. */
function towards(from: Point, to: Point, travel: number): Point {
  const span = distance(from, to);
  if (span < EPSILON) return { x: from.x, y: from.y };
  const ratio = travel / span;
  return { x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio };
}

/**
 * Path data through `points` with each interior vertex rounded off. Rounding is
 * capped at half the shorter adjacent run so tight turns degrade to a hard
 * corner rather than overshooting.
 */
export function manhattanPath(points: readonly Point[], bendRadius: number): string {
  const vertices = points.filter(
    (point, index) => index === 0 || !isSamePoint(point, points[index - 1]),
  );
  const start = vertices[0];
  if (!start) return '';

  const move = `M ${round(start.x)} ${round(start.y)}`;
  if (vertices.length === 1) return move;

  const parts = [move];
  for (let index = 1; index < vertices.length - 1; index += 1) {
    const previous = vertices[index - 1]!;
    const corner = vertices[index]!;
    const next = vertices[index + 1]!;
    const radius = Math.max(
      0,
      Math.min(bendRadius, distance(previous, corner) / 2, distance(corner, next) / 2),
    );
    const entry = towards(corner, previous, radius);
    parts.push(`L ${round(entry.x)} ${round(entry.y)}`);
    if (radius > EPSILON) {
      const exit = towards(corner, next, radius);
      parts.push(`Q ${round(corner.x)} ${round(corner.y)} ${round(exit.x)} ${round(exit.y)}`);
    }
  }

  const end = vertices[vertices.length - 1]!;
  parts.push(`L ${round(end.x)} ${round(end.y)}`);
  return parts.join(' ');
}

interface BranchShape {
  junction: Point;
  /** Waypoints after the junction, ending at the terminal. */
  tail: Point[];
  terminal: Point;
  axis: 'x' | 'y';
}

function branchShape(spec: RouteSpec, options: RouteOptions): BranchShape {
  const { spineX, pinGap, minBranch, width } = options;
  const maxX = Math.max(spineX + minBranch, width - minBranch);

  if (spec.edge === 'left') {
    const y = spec.box.top + spec.box.height / 2;
    const terminal = { x: clamp(spec.box.left - pinGap, spineX + minBranch, maxX), y };
    return { junction: { x: spineX, y }, tail: [terminal], terminal, axis: 'x' };
  }

  // `top` and `rail` differ only in the lane they travel along before dropping
  // onto the node's top edge.
  const laneY = spec.edge === 'rail' ? options.railY : spec.box.top - options.topLane;
  const dropX = clamp(spec.box.left + pinGap * 2, spineX + minBranch, maxX);
  const terminal = { x: dropX, y: spec.box.top - pinGap };
  return {
    junction: { x: spineX, y: laneY },
    tail: [{ x: dropX, y: laneY }, terminal],
    terminal,
    axis: 'y',
  };
}

/**
 * Route every node onto one bus leaving `origin`.
 *
 * The trunk drops clear of the source text, turns onto the spine, then runs to
 * the furthest junction. When a junction sits above the turn — a source that is
 * not the topmost element in its region — a second upward arm is returned
 * rather than doubling back over the first.
 */
export function busRoute(
  origin: Point,
  specs: readonly RouteSpec[],
  options: RouteOptions,
): BusLayout {
  const { spineX, bendRadius } = options;
  const shapes = specs.map((spec) => ({ spec, shape: branchShape(spec, options) }));
  const junctionYs = shapes.map(({ shape }) => shape.junction.y);

  // Keep the turn above the first junction so the spine has a run to travel,
  // while still dropping clear of the source's own text.
  const firstJunction = junctionYs.length > 0 ? Math.min(...junctionYs) : origin.y + options.drop;
  let turnY = Math.max(
    origin.y + bendRadius,
    Math.min(origin.y + options.drop, firstJunction - bendRadius * 2),
  );

  // Snap the turn onto a junction it all but touches. Without this, a source
  // sitting a few px above its first junction yields a hairline second arm that
  // reads as a doubled line rather than a route.
  const snap = junctionYs.find(
    (junctionY) => junctionY > origin.y && Math.abs(junctionY - turnY) <= bendRadius,
  );
  if (snap !== undefined) turnY = snap;

  const turn = { x: spineX, y: turnY };
  const head = [origin, { x: origin.x, y: turnY }, turn];

  const spineBottom = Math.max(turnY, ...junctionYs);
  const spineTop = Math.min(turnY, ...junctionYs);
  const trunks = [manhattanPath([...head, { x: spineX, y: spineBottom }], bendRadius)];
  if (spineTop < turnY - EPSILON) {
    trunks.push(manhattanPath([turn, { x: spineX, y: spineTop }], bendRadius));
  }

  const branches = shapes.map(({ spec, shape }) => ({
    id: spec.id,
    d: manhattanPath([...head, shape.junction, ...shape.tail], bendRadius),
    spur: manhattanPath([shape.junction, ...shape.tail], bendRadius),
    junction: shape.junction,
    terminal: shape.terminal,
    axis: shape.axis,
  }));

  return { origin, spineX, trunks, branches, label: { x: spineX, y: spineBottom } };
}
