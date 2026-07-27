/**
 * CIRCUIT GEOMETRY
 *
 * Pure routing maths for the data-bus overlay. Everything works in region-local
 * pixels (an element's box measured against its region's box), so results stay
 * correct under any ancestor transform, including Bend's canvas scroller.
 *
 * Topology is a bus, not a set of independent lines: one trunk leaves the
 * source, turns onto a shared spine, and every node branches off that spine at
 * its own junction. Alongside the path data, routes report their fittings —
 * unions at the bends, a tee at each split, a joint at each end — so the run
 * reads as assembled pipework rather than a drawn line.
 *
 * Both ends of a run land on the thing they serve rather than short of it, and
 * what a run meets decides how it is finished. See `Attach`.
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

/**
 * What a run meets at the node end, and so how it is finished.
 * - `box`  a face to butt into. The run lands on the edge and takes a flange.
 * - `rule` a divider that is already a run in its own right. The branch taps
 *          into it and takes a tee laid across the rule, not a cap against it.
 * - `text` no edge at all. The run turns onto the node's baseline, travels it
 *          for `textRun`, and stops — becoming the rule the text has not got.
 */
export type Attach = 'box' | 'rule' | 'text';

/** Where the pipework is joined, sized and drawn by the engine per kind. */
export type FittingKind = 'origin' | 'collar' | 'tee' | 'terminal';

export interface Fitting {
  kind: FittingKind;
  at: Point;
  /** Degrees. The direction the pipe runs through the fitting; 0 is +x, 90 is +y. */
  angle: number;
}

export interface RouteSpec {
  id: string;
  /**
   * Node box in region-local pixels. For `text` this is the node's first line,
   * squared off at the baseline: `top + height` is the line the run rests on.
   */
  box: Box;
  edge: NodeEdge;
  attach: Attach;
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
  /** How far a run travels along a baseline where it meets text, at either end. */
  textRun: number;
  /**
   * Standoff along a node's own edge: how far past its leading corner a branch
   * lands on it, and how far clear of the first glyph a text drop passes.
   */
  pinGap: number;
  /** Corner rounding on right-angle turns. Capped per bend by the runs it joins. */
  bendRadius: number;
  /** Shortest run a branch may take off the spine, so junctions stay legible. */
  minBranch: number;
  /** Closest two fittings may sit before the lesser of them is dropped. */
  fittingClearance: number;
}

export interface Branch {
  id: string;
  /** Full source-to-node route. This is the track a packet travels. */
  d: string;
  /** Spine-to-node segment only, so the shared trunk is never stroked twice. */
  spur: string;
  junction: Point;
  terminal: Point;
  /** Axis the branch arrives along. Terminal flanges are drawn across it. */
  axis: 'x' | 'y';
}

export interface BusLayout {
  origin: Point;
  spineX: number;
  /** One entry per stroked trunk arm: downward always, upward only when needed. */
  trunks: string[];
  branches: Branch[];
  fittings: Fitting[];
  /** Anchor for the bus label, at the far end of the downward arm. */
  label: Point;
}

const EPSILON = 0.01;

/**
 * A bend tighter than this fraction of the requested radius gets no unions. On a
 * hard corner a collar reads as a mistake rather than a fitting.
 */
const COLLAR_RADIUS_RATIO = 0.35;

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

function angleOf(from: Point, to: Point): number {
  return round((Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI);
}

function vertexList(points: readonly Point[]): Point[] {
  return points.filter((point, index) => index === 0 || !isSamePoint(point, points[index - 1]));
}

interface Bend {
  corner: Point;
  entry: Point;
  exit: Point;
  radius: number;
}

/**
 * The rounded corners a polyline turns through. Rounding is capped at half the
 * shorter adjacent run, so tight turns degrade to a hard corner rather than
 * overshooting. Shared by the path builder and the fitting placement so the two
 * can never disagree about where a bend begins and ends.
 */
function bendsFor(vertices: readonly Point[], bendRadius: number): Bend[] {
  const bends: Bend[] = [];
  for (let index = 1; index < vertices.length - 1; index += 1) {
    const previous = vertices[index - 1]!;
    const corner = vertices[index]!;
    const next = vertices[index + 1]!;
    const radius = Math.max(
      0,
      Math.min(bendRadius, distance(previous, corner) / 2, distance(corner, next) / 2),
    );
    bends.push({
      corner,
      radius,
      entry: towards(corner, previous, radius),
      exit: towards(corner, next, radius),
    });
  }
  return bends;
}

/** Path data through `points` with every interior vertex swept. */
export function manhattanPath(points: readonly Point[], bendRadius: number): string {
  const vertices = vertexList(points);
  const start = vertices[0];
  if (!start) return '';

  const move = `M ${round(start.x)} ${round(start.y)}`;
  if (vertices.length === 1) return move;

  const parts = [move];
  for (const bend of bendsFor(vertices, bendRadius)) {
    parts.push(`L ${round(bend.entry.x)} ${round(bend.entry.y)}`);
    if (bend.radius > EPSILON) {
      parts.push(
        `Q ${round(bend.corner.x)} ${round(bend.corner.y)} ${round(bend.exit.x)} ${round(bend.exit.y)}`,
      );
    }
  }

  const end = vertices[vertices.length - 1]!;
  parts.push(`L ${round(end.x)} ${round(end.y)}`);
  return parts.join(' ');
}

/** A union either side of every bend worth dressing. */
export function collarsFor(points: readonly Point[], bendRadius: number): Fitting[] {
  const minRadius = bendRadius * COLLAR_RADIUS_RATIO;
  const fittings: Fitting[] = [];
  for (const bend of bendsFor(vertexList(points), bendRadius)) {
    if (bend.radius < minRadius) continue;
    fittings.push({ kind: 'collar', at: bend.entry, angle: angleOf(bend.entry, bend.corner) });
    fittings.push({ kind: 'collar', at: bend.exit, angle: angleOf(bend.corner, bend.exit) });
  }
  return fittings;
}

/**
 * Keep every joint, then admit collars only where there is room for them. Two
 * unions stacked on top of each other read as a mistake, and a sweep that lands
 * right on a tee does not need dressing twice.
 */
export function spaceFittings(
  joints: readonly Fitting[],
  collars: readonly Fitting[],
  clearance: number,
): Fitting[] {
  const kept = [...joints];
  for (const collar of collars) {
    if (kept.some((fitting) => distance(fitting.at, collar.at) < clearance)) continue;
    kept.push(collar);
  }
  return kept;
}

interface BranchShape {
  junction: Point;
  /** Waypoints after the junction, ending at the terminal. */
  tail: Point[];
  terminal: Point;
  axis: 'x' | 'y';
}

/**
 * The lane a branch travels along before it turns down onto its node. `top` and
 * `rail` differ in nothing else.
 */
function laneFor(spec: RouteSpec, options: RouteOptions): number {
  return spec.edge === 'rail' ? options.railY : spec.box.top - options.topLane;
}

function branchShape(spec: RouteSpec, options: RouteOptions): BranchShape {
  const { spineX, pinGap, minBranch, width, textRun } = options;
  const maxX = Math.max(spineX + minBranch, width - minBranch);
  const inRegion = (x: number): number => clamp(x, spineX + minBranch, maxX);

  // Text is finished by running under it rather than stopping against it, so the
  // approach only decides how the run reaches the baseline, not where it ends.
  if (spec.attach === 'text') {
    const baselineY = spec.box.top + spec.box.height;
    const terminal = { x: inRegion(spec.box.left + textRun), y: baselineY };

    if (spec.edge === 'left') {
      return { junction: { x: spineX, y: baselineY }, tail: [terminal], terminal, axis: 'x' };
    }

    const laneY = laneFor(spec, options);
    const dropX = inRegion(spec.box.left - pinGap);
    return {
      junction: { x: spineX, y: laneY },
      tail: [{ x: dropX, y: laneY }, { x: dropX, y: baselineY }, terminal],
      terminal,
      axis: 'x',
    };
  }

  if (spec.edge === 'left') {
    const y = spec.box.top + spec.box.height / 2;
    const terminal = { x: inRegion(spec.box.left), y };
    return { junction: { x: spineX, y }, tail: [terminal], terminal, axis: 'x' };
  }

  const laneY = laneFor(spec, options);
  const dropX = inRegion(spec.box.left + pinGap * 2);
  const terminal = { x: dropX, y: spec.box.top };
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
 * The trunk taps the source's baseline, drops clear of its text, turns onto the
 * spine, then runs to the furthest junction. When a junction sits above the turn
 * — a source that is not the topmost element in its region — a second upward arm
 * is returned rather than doubling back over the first.
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

  // The source is a text end, and text ends run along the baseline. The stub
  // gives out where it would otherwise reach past the spine, and never runs the
  // other way to find room: a source that close to the content edge drops
  // straight down rather than jogging outward first.
  const stubX = Math.min(origin.x, Math.max(origin.x - options.textRun, spineX + options.minBranch));
  const stub = { x: stubX, y: origin.y };
  const turn = { x: spineX, y: turnY };
  const head = [origin, stub, { x: stub.x, y: turnY }, turn];

  const spineBottom = Math.max(turnY, ...junctionYs);
  const spineTop = Math.min(turnY, ...junctionYs);
  const downArm = [...head, { x: spineX, y: spineBottom }];
  const trunks = [manhattanPath(downArm, bendRadius)];
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

  // Collars come from the trunk and each spur rather than from the full routes,
  // which would dress the shared trunk head once per node. Joints that carry
  // meaning are listed first: the clearance pass keeps those and thins the
  // collars around them.
  // When the source is too close to the spine for a baseline stub, its first
  // real segment is vertical. Dress that bearing rather than asking angleOf to
  // infer a direction from two identical points (which incorrectly yields 0°).
  const originBearing = isSamePoint(origin, stub) ? { x: origin.x, y: turnY } : stub;
  const joints: Fitting[] = [{ kind: 'origin', at: origin, angle: angleOf(origin, originBearing) }];
  const collars: Fitting[] = collarsFor(downArm, bendRadius);
  for (const { spec, shape } of shapes) {
    const spur = [shape.junction, ...shape.tail];
    const approach = spur[spur.length - 2] ?? shape.junction;
    const angle = angleOf(approach, shape.terminal);
    // A divider is a run in its own right, so the branch tees into it rather
    // than capping against it: the bands turn a quarter off the approach to lie
    // across the rule itself. Every other end is closed by the run's own joint.
    const end: Fitting =
      spec.attach === 'rule'
        ? { kind: 'tee', at: shape.terminal, angle: angle + 90 }
        : { kind: 'terminal', at: shape.terminal, angle };

    joints.push({ kind: 'tee', at: shape.junction, angle: 90 }, end);
    collars.push(...collarsFor(spur, bendRadius));
  }

  return {
    origin,
    spineX,
    trunks,
    branches,
    fittings: spaceFittings(joints, collars, options.fittingClearance),
    label: { x: spineX, y: spineBottom },
  };
}
