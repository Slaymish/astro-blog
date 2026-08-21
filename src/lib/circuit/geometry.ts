/**
 * CIRCUIT GEOMETRY
 *
 * Pure routing maths for the pipework overlay. Everything works in region-local
 * pixels (an element's box measured against its region's overlay), so results
 * stay correct under any ancestor transform.
 *
 * The grammar this implements is docs/design-docs/circuit-design-language.md.
 * Three rules matter more than the rest:
 *
 * 1. One radius, guaranteed. A corner is exactly `radius` or it does not exist.
 *    Legs shorter than `minLeg` are relaxed away rather than drawn with a
 *    smaller sweep, so a run can never contain two radii.
 * 2. Every vertex is snapped, by a snapper the caller supplies, onto the device
 *    pixel grid. Even-weight strokes centre on whole pixels and one-pixel ticks
 *    centre on half pixels, which is the whole reason hairlines read crisp.
 * 3. A branch taps the nearest run that already exists — the lane if it sits
 *    under it, the rail otherwise — rather than always routing via the rail.
 *
 * Topology is three parts. A `trunk` leaves the source and runs to the rail. A
 * `rail` runs the full height of the region in the page gutter. Branches tap
 * one or the other. Every open end carries a terminator.
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
 * What a run meets at the node end, and so how it is finished.
 * - `box`  a face to butt into. The run lands on the edge and takes a cap.
 * - `rule` a divider that is already a line in the layout. The run meets its
 *          leading end and takes a port, so the rule reads as reaching the bus.
 * - `text` no edge at all. The run lands on the node's baseline at its leading
 *          edge — where an underline would begin — from either direction.
 */
export type Attach = 'box' | 'rule' | 'text';

/** `rail` forces a rail tap for a node that would otherwise tap the lane. */
export type Lane = 'auto' | 'rail';

/** The closed set of connector parts. Everything is assembled from these. */
export type FittingKind = 'elbow' | 'tap' | 'cap' | 'port' | 'node' | 'bracket';

/** Which run a fitting belongs to, so density rules can thin one and not another. */
export type FittingOn = 'trunk' | 'rail' | 'branch';

export interface Fitting {
  kind: FittingKind;
  at: Point;
  /** Degrees. The bearing the pipe runs through the fitting; 0 is +x, 90 is +y. */
  angle: number;
  on: FittingOn;
}

export interface RouteSpec {
  id: string;
  /**
   * Node box in region-local pixels. For `text` this is the node's first line,
   * squared off at the baseline: `top + height` is the line the run rests on.
   */
  box: Box;
  /**
   * The node's full box, as the same object the caller put in
   * `RouteOptions.obstacles`. Identity is what lets a stub ignore the node it is
   * on its way to: a run meeting text ends on a baseline, which is inside the
   * node's own box, so without this every text node blocks its own approach.
   */
  bounds: Box;
  attach: Attach;
  lane: Lane;
}

/**
 * Snapping onto the device pixel grid. The caller owns this because only it
 * knows the overlay's own fractional offset. Even-weight geometry uses `x`/`y`;
 * one-pixel ticks use `tickX`/`tickY`, which land on half pixels.
 */
export interface Snap {
  x(value: number): number;
  y(value: number): number;
  tickX(value: number): number;
  tickY(value: number): number;
}

export interface RouteOptions {
  /** Region width in region-local pixels. Terminals never route past it. */
  width: number;
  /** x of the rail. Normally negative: the rail sits in the page gutter. */
  railX: number;
  /** y the rail starts at, inset from the region's top. */
  railTop: number;
  /** y the rail ends at, inset from the region's bottom. */
  railBottom: number;
  /** Vertical drop below the source baseline to the lane. */
  drop: number;
  /**
   * How far the trunk travels along the source's own baseline before turning.
   * Only the source end runs along a baseline: a branch meeting text stops at
   * the leading edge rather than carrying on underneath the glyphs.
   */
  textRun: number;
  /** Standoff past a node's leading corner where a run lands on it. */
  pinGap: number;
  /** The one corner radius. Never reduced. */
  radius: number;
  /** Shortest leg the router may emit between two turns. Must exceed 2*radius. */
  minLeg: number;
  /** Shortest spur worth drawing, so a tap never reads as a nick on the rail. */
  minBranch: number;
  /** How far up the rail from its cap the label and its bracket sit. */
  labelInset: number;
  /** Closest two fittings may sit before the lesser of them is dropped. */
  tickClearance: number;
  /**
   * Boxes a stub off the lane must not run through: every node's full box plus
   * the source's. A stub ends on the face of the node it serves, so it never
   * enters that node — but without this it will happily cross a paragraph
   * sitting between the lane and whatever it is reaching for.
   */
  obstacles: readonly Box[];
  snap: Snap;
}

export interface Branch {
  id: string;
  /** Full source-to-node route. This is the track a capsule travels. */
  route: string;
  /** Tap-to-node segment only, so shared pipe is never stroked twice. */
  spur: string;
  tap: Point;
  terminal: Point;
  /** Axis the branch arrives along. Terminal plates are drawn across it. */
  axis: 'x' | 'y';
}

export interface BusLayout {
  origin: Point;
  railX: number;
  /**
   * Source to the lane. One path: the rail is never split into arms. When the
   * lane is not extended past the source this run continues along it to the
   * rail, and `lane` is empty.
   */
  trunk: string;
  /** The lane, when it runs past its own feed to reach a node. May be empty. */
  lane: string;
  /** The full-height gutter run. Structural, drawn whether or not it is tapped. */
  rail: string;
  branches: Branch[];
  fittings: Fitting[];
  /** Anchor for the bus label, on the rail near its lower cap. */
  label: Point;
}

const EPSILON = 0.01;

/**
 * An elbow is dressed only when both its legs have room to be read. Below this
 * multiple of the radius a tick sits on top of the sweep it is meant to mark.
 */
const ELBOW_DRESS_RATIO = 3;

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

function dedupe(points: readonly Point[]): Point[] {
  return points.filter((point, index) => index === 0 || !isSamePoint(point, points[index - 1]));
}

/** True when the leg leaving `index` runs horizontally. */
function isHorizontalLeg(points: readonly Point[], index: number): boolean {
  return Math.abs(points[index + 1]!.y - points[index]!.y) < EPSILON;
}

/**
 * How long the leg leaving `index` has to be. A leg has to carry `radius` of
 * sweep for each of its ends that is a corner, so a leg with a free end — the
 * source, or a terminal — needs only half what an interior leg needs. Charging
 * every leg the full minimum would relax away perfectly good runs.
 */
function legMinimum(points: readonly Point[], index: number, minLeg: number): number {
  const corners = (index > 0 ? 1 : 0) + (index + 1 < points.length - 1 ? 1 : 0);
  return (minLeg * corners) / 2;
}

/**
 * Guarantee that every leg is at least `minLeg` long, so `orthogonalPath` can
 * always sweep a full-radius corner without capping.
 *
 * This inverts the failure mode of the previous implementation, which capped the
 * radius at half the shorter adjacent leg and so silently produced a different
 * radius at nearly every corner. Here the polyline is changed instead of the
 * radius: a leg too short to carry its corners is removed, and the run is
 * re-squared onto whichever neighbouring axis survives.
 *
 * Only orthogonal polylines are supported, which is all the router emits.
 */
export function relaxLegs(points: readonly Point[], minLeg: number): Point[] {
  let working = dedupe(points);

  // Each pass removes at least one vertex, so the loop is bounded by the input.
  for (let guard = 0; guard < points.length + 2; guard += 1) {
    if (working.length < 3) return working;

    const short = working.findIndex(
      (point, index) =>
        index < working.length - 1 &&
        distance(point, working[index + 1]!) < legMinimum(working, index, minLeg),
    );
    if (short === -1) return working;

    const last = working.length - 1;
    const horizontal = isHorizontalLeg(working, short);

    if (short === 0) {
      // A short first leg means the stub off the source is not worth taking.
      // Drop it and re-square the next vertex onto the source itself.
      const next = { ...working[2]! };
      if (horizontal) next.x = working[0]!.x;
      else next.y = working[0]!.y;
      working = dedupe([working[0]!, next, ...working.slice(3)]);
      continue;
    }

    if (short === last - 1) {
      // Same at the far end: keep the terminal where it is and re-square the
      // vertex before it, so the run still arrives on the node's own axis.
      const previous = { ...working[last - 2]! };
      if (horizontal) previous.x = working[last]!.x;
      else previous.y = working[last]!.y;
      working = dedupe([...working.slice(0, last - 2), previous, working[last]!]);
      continue;
    }

    // An interior jog: merge the two parallel runs either side of it onto the
    // second one's axis, which keeps the destination and loses the wobble. The
    // runs either side of a short horizontal are vertical, and vice versa, so
    // the axis to re-square on is the opposite of the short leg's own.
    const before = { ...working[short - 1]! };
    if (horizontal) before.x = working[short + 1]!.x;
    else before.y = working[short + 1]!.y;
    working = dedupe([
      ...working.slice(0, short - 1),
      before,
      ...working.slice(short + 2),
    ]);
  }

  return working;
}

interface Corner {
  corner: Point;
  entry: Point;
  exit: Point;
  /** SVG arc sweep flag. 1 turns clockwise on screen, where y runs downward. */
  sweep: 0 | 1;
  /** Length of the shorter of the two legs the corner joins. */
  room: number;
}

function cornersFor(points: readonly Point[], radius: number): Corner[] {
  const corners: Corner[] = [];
  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1]!;
    const corner = points[index]!;
    const next = points[index + 1]!;
    const incoming = { x: corner.x - previous.x, y: corner.y - previous.y };
    const outgoing = { x: next.x - corner.x, y: next.y - corner.y };
    const cross = incoming.x * outgoing.y - incoming.y * outgoing.x;
    corners.push({
      corner,
      entry: towards(corner, previous, radius),
      exit: towards(corner, next, radius),
      sweep: cross > 0 ? 1 : 0,
      room: Math.min(distance(previous, corner), distance(corner, next)),
    });
  }
  return corners;
}

/**
 * Path data through `points`, every interior corner swept as a true circular
 * quarter-arc. Arcs rather than quadratics: a quadratic through the corner has
 * the right endpoints but the wrong curvature, so its apparent radius drifts
 * with leg length even when the requested radius does not.
 *
 * Callers must pass a polyline already relaxed to `minLeg`; a leg shorter than
 * twice the radius would make adjacent arcs overlap.
 */
export function orthogonalPath(points: readonly Point[], radius: number): string {
  const vertices = dedupe(points);
  const start = vertices[0];
  if (!start) return '';

  const move = `M ${round(start.x)} ${round(start.y)}`;
  if (vertices.length === 1) return move;

  const parts = [move];
  for (const corner of cornersFor(vertices, radius)) {
    parts.push(`L ${round(corner.entry.x)} ${round(corner.entry.y)}`);
    parts.push(
      `A ${round(radius)} ${round(radius)} 0 0 ${corner.sweep} ${round(corner.exit.x)} ${round(corner.exit.y)}`,
    );
  }

  const end = vertices[vertices.length - 1]!;
  parts.push(`L ${round(end.x)} ${round(end.y)}`);
  return parts.join(' ');
}

/** A tick either side of every corner with room to carry them. */
export function elbowTicks(
  points: readonly Point[],
  radius: number,
  snap: Snap,
  on: FittingOn = 'trunk',
): Fitting[] {
  const ticks: Fitting[] = [];
  for (const corner of cornersFor(dedupe(points), radius)) {
    if (corner.room < radius * ELBOW_DRESS_RATIO) continue;
    const entryAngle = angleOf(corner.entry, corner.corner);
    const exitAngle = angleOf(corner.corner, corner.exit);
    ticks.push(
      { kind: 'elbow', at: snapTick(corner.entry, entryAngle, snap), angle: entryAngle, on },
      { kind: 'elbow', at: snapTick(corner.exit, exitAngle, snap), angle: exitAngle, on },
    );
  }
  return ticks;
}

/**
 * A one-pixel tick renders crisp only when its own stroke centres on a half
 * pixel, which means snapping along the axis the pipe runs, not across it.
 */
function snapTick(at: Point, angle: number, snap: Snap): Point {
  const horizontal = Math.abs(Math.abs(angle) - 90) > 45;
  return horizontal
    ? { x: snap.tickX(at.x), y: at.y }
    : { x: at.x, y: snap.tickY(at.y) };
}

/**
 * Keep every joint, then admit elbow ticks only where there is room. Two marks
 * stacked on each other read as a mistake, and a sweep landing on a tap does
 * not need dressing twice.
 */
export function spaceFittings(
  joints: readonly Fitting[],
  ticks: readonly Fitting[],
  clearance: number,
): Fitting[] {
  const kept = [...joints];
  for (const tick of ticks) {
    if (kept.some((fitting) => distance(fitting.at, tick.at) < clearance)) continue;
    kept.push(tick);
  }
  return kept;
}

interface Lanes {
  y: number;
  /** x the trunk joins the lane at. The lane runs from here to the rail. */
  from: number;
}

interface BranchShape {
  tap: Point;
  /** Bearing of the run being tapped, so the tap bands lie across it. */
  tapAngle: number;
  tail: Point[];
  terminal: Point;
  axis: 'x' | 'y';
  /**
   * Set when this branch needs the lane to reach further right than the trunk
   * does. The lane is then drawn past its own feed and capped, and the trunk
   * tees into it — which is how a node sitting to the right of the source gets
   * dropped onto instead of being dragged all the way round via the rail.
   */
  extendsLaneTo?: number;
}

/**
 * Where a branch leaves the bus and where it lands.
 *
 * Text and rules are always fed from the rail: text arrives along its own
 * baseline, and a rule is met at its leading end so the divider reads as
 * reaching out to the bus rather than being stabbed from above. A box is fed
 * from the lane when it sits under it with room to drop, which is what stops
 * the bus travelling to the gutter and back to reach something beside its own
 * source.
 */
function branchShape(spec: RouteSpec, options: RouteOptions, lane: Lanes): BranchShape {
  const { railX, pinGap, minLeg, minBranch, snap } = options;
  const { box, attach } = spec;
  const inboard = railX + minBranch;
  /** The leading edge of the node, never inboard of the rail. */
  const lead = snap.x(Math.max(box.left, inboard));

  // A rule is already a line in the layout, so it is met at its leading end and
  // never approached from above: dropping onto a divider would mean crossing
  // whatever sits over it.
  if (attach === 'rule') {
    const y = snap.y(box.top);
    const terminal = { x: lead, y };
    return { tap: { x: railX, y }, tapAngle: 90, tail: [terminal], terminal, axis: 'x' };
  }

  // A box may be stubbed onto from the lane, but only when it sits clear of it
  // by more than one leg. The clearance that matters is the sweep plus room for
  // the tap's own bands, not a whole leg: charging a full leg here pushed nodes
  // onto the rail over a couple of pixels, which is what produced a second
  // full-width horizontal.
  const clearance = options.radius + options.tickClearance;
  // A node below the lane is stubbed onto at its top edge; one above it at its
  // bottom edge. Same stub either way, so a bottom-aligned column beside a tall
  // heading is served without dragging a run across it.
  //
  // Text is the exception at both ends. It has no edge to butt into, so a run
  // meeting it lands on its baseline at its leading edge — where an underline
  // would begin. Stopping on the line box's top left the run hanging in the gap
  // above the type, and running on past the leading edge left a stray dash under
  // the first few glyphs.
  const below = box.top - lane.y >= minLeg;
  const face =
    attach === 'text' ? box.top + box.height : below ? box.top : box.top + box.height;

  const stub = (x: number, extendsLaneTo?: number): BranchShape => {
    const at = snap.x(x);
    const terminal = { x: at, y: snap.y(face) };
    return {
      tap: { x: at, y: lane.y },
      tapAngle: 0,
      tail: [terminal],
      terminal,
      axis: 'y',
      extendsLaneTo: extendsLaneTo === undefined ? undefined : snap.x(extendsLaneTo),
    };
  };

  // A box is landed on a standoff past its leading corner; text is met exactly
  // at its leading edge, so the run plugs into where the type begins.
  const wanted = attach === 'text' ? box.left : box.left + pinGap;
  // The furthest right a stub can go on the lane as the trunk already draws it,
  // leaving the trunk's own joint room to be read.
  const limit = lane.from - clearance;
  const headroom = spec.lane !== 'rail' && (below || lane.y - face >= minLeg);

  const top = Math.min(lane.y, face);
  const bottom = Math.max(lane.y, face);
  // Obstacles are widened by the same standoff a run keeps from a node's leading
  // corner. A stub sitting exactly on a paragraph's left edge does not cross it
  // on paper, but on screen it runs down the face of the first character of
  // every line, which reads as a collision.
  const clears = (x: number): boolean =>
    !options.obstacles.some(
      (o) =>
        o !== spec.bounds &&
        x > o.left - pinGap &&
        x < o.left + o.width + pinGap &&
        top < o.top + o.height - EPSILON &&
        bottom > o.top + EPSILON,
    );

  if (headroom && wanted >= inboard) {
    // Inside the lane as drawn.
    if (wanted <= limit && clears(wanted)) return stub(wanted);
    // Just past it: nudge the stub inboard, as long as it still lands on the
    // node. Testing the node's leading edge instead made the choice knife-edge —
    // a column starting a fraction past the limit fell back to the rail and drew
    // a second full-width horizontal for the sake of half a pixel.
    if (limit + pinGap >= box.left && limit < box.left + box.width && clears(limit)) {
      return stub(limit);
    }
    // Well past it: run the lane out to meet the node and cap it there. Only
    // worth doing once the extension is longer than a leg, or the cap would
    // crowd the tee that feeds it.
    if (wanted >= lane.from + minLeg && clears(wanted)) return stub(wanted, wanted + clearance);
  }

  // Fed from the rail instead: text along its own baseline, a box into the
  // middle of its leading face.
  const y = attach === 'text' ? snap.y(face) : snap.y(box.top + box.height / 2);
  const terminal = { x: lead, y };
  return { tap: { x: railX, y }, tapAngle: 90, tail: [terminal], terminal, axis: 'x' };
}

/**
 * Route every node onto one bus leaving `origin`.
 *
 * The trunk taps the source's baseline, runs clear of its text, drops to the
 * lane and runs to the rail. The rail runs the region's full height regardless,
 * because it is structure rather than a connector: it is what makes the gutter
 * read as an edge condition, and it is what the label hangs from. Branches then
 * tap whichever of the two runs is nearest.
 */
export function busRoute(
  origin: Point,
  specs: readonly RouteSpec[],
  options: RouteOptions,
): BusLayout {
  const { railX, railTop, railBottom, radius, minLeg, textRun, drop, pinGap, labelInset, snap } =
    options;

  // The lane sits `drop` below the source, but never lower than clear of the
  // first node underneath it: a lane that crosses a node's own box strikes
  // through the type it is meant to serve. On a narrow screen the hero's
  // headline and lede leave nothing but a gap between them, and this is what
  // puts the lane in that gap rather than through the paragraph.
  const ceiling = specs.reduce(
    (highest, spec) => (spec.box.top > origin.y ? Math.min(highest, spec.box.top - pinGap) : highest),
    Number.POSITIVE_INFINITY,
  );
  const floor = origin.y + minLeg / 2;
  const laneY = snap.y(clamp(origin.y + drop, floor, Math.max(floor, ceiling)));

  // The stub always runs towards the rail. A source already closer to the rail
  // than a stub allows drops straight down rather than jogging outward first.
  const stubX = snap.x(Math.min(origin.x, Math.max(origin.x - textRun, railX + minLeg)));
  const lane: Lanes = { y: laneY, from: stubX };

  const shapes = specs.map((spec) => ({ spec, shape: branchShape(spec, options, lane) }));

  // A node to the right of the source runs the lane out past its own feed. The
  // trunk then tees into the lane rather than elbowing onto its end, and the
  // lane is capped where it stops.
  const laneEnd = shapes.reduce(
    (furthest, { shape }) => Math.max(furthest, shape.extendsLaneTo ?? furthest),
    stubX,
  );
  const extended = laneEnd > stubX + EPSILON;

  const feed = [origin, { x: stubX, y: origin.y }, { x: stubX, y: laneY }];
  const trunkPoints = relaxLegs(extended ? feed : [...feed, { x: railX, y: laneY }], minLeg);
  const trunk = orthogonalPath(trunkPoints, radius);
  const lanePoints = [
    { x: laneEnd, y: laneY },
    { x: railX, y: laneY },
  ];
  const laneRun = extended ? orthogonalPath(lanePoints, radius) : '';

  const railPoints = [
    { x: railX, y: railTop },
    { x: railX, y: railBottom },
  ];
  const rail = orthogonalPath(railPoints, radius);

  /** Everything a capsule crosses to reach the lane at `x`. */
  const alongLane = (x: number): Point[] =>
    extended
      ? [...trunkPoints, { x, y: laneY }]
      : [...trunkPoints.slice(0, -1), { x, y: laneY }];

  const branches: Branch[] = shapes.map(({ spec, shape }) => {
    // A capsule travels the whole run, so the route re-treads the trunk and, for
    // a rail tap, the stretch of rail between the lane and the tap.
    const lead =
      shape.tapAngle === 90
        ? [...alongLane(railX), { x: railX, y: shape.tap.y }]
        : alongLane(shape.tap.x);
    return {
      id: spec.id,
      route: orthogonalPath(relaxLegs([...lead, ...shape.tail], minLeg), radius),
      spur: orthogonalPath([shape.tap, ...shape.tail], radius),
      tap: shape.tap,
      terminal: shape.terminal,
      axis: shape.axis,
    };
  });

  const labelAt = { x: railX, y: snap.y(railBottom - labelInset) };

  // Read the trunk's start back off the relaxed points rather than reusing
  // `origin`. A source sitting close to the rail has its stub relaxed away, and
  // the run then begins on the lane instead of the source's own baseline;
  // measuring the bearing from `origin` to a relaxed vertex put the cap off the
  // pipe and at an angle, which drew a diagonal bar struck through the heading.
  const trunkStart = trunkPoints[0] ?? origin;
  const trunkBearing = angleOf(trunkStart, trunkPoints[1] ?? { x: origin.x, y: laneY });

  // Joints carry meaning and are kept unconditionally. Elbow ticks are
  // decoration on top of them and get thinned wherever they would crowd one.
  const joints: Fitting[] = [
    { kind: 'cap', at: trunkStart, angle: trunkBearing, on: 'trunk' },
    { kind: 'tap', at: snapTick({ x: railX, y: laneY }, 90, snap), angle: 90, on: 'rail' },
    { kind: 'cap', at: { x: railX, y: railTop }, angle: 90, on: 'rail' },
    { kind: 'cap', at: { x: railX, y: railBottom }, angle: 90, on: 'rail' },
    { kind: 'bracket', at: snapTick(labelAt, 90, snap), angle: 90, on: 'rail' },
  ];

  if (extended) {
    joints.push(
      { kind: 'cap', at: { x: laneEnd, y: laneY }, angle: 180, on: 'trunk' },
      { kind: 'tap', at: snapTick({ x: stubX, y: laneY }, 0, snap), angle: 0, on: 'trunk' },
    );
  }

  const ticks: Fitting[] = elbowTicks(trunkPoints, radius, snap, 'trunk');

  for (const { spec, shape } of shapes) {
    const approach = shape.tail[shape.tail.length - 2] ?? shape.tap;
    const angle = angleOf(approach, shape.terminal);
    joints.push(
      { kind: 'tap', at: snapTick(shape.tap, shape.tapAngle, snap), angle: shape.tapAngle, on: 'branch' },
      { kind: spec.attach === 'rule' ? 'port' : 'cap', at: shape.terminal, angle, on: 'branch' },
      { kind: 'node', at: shape.terminal, angle, on: 'branch' },
    );
    ticks.push(...elbowTicks([shape.tap, ...shape.tail], radius, snap, 'branch'));
  }

  return {
    origin,
    railX,
    trunk,
    lane: laneRun,
    rail,
    branches,
    fittings: spaceFittings(joints, ticks, options.tickClearance),
    label: labelAt,
  };
}
