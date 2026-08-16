import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
  busRoute,
  elbowTicks,
  orthogonalPath,
  relaxLegs,
  spaceFittings,
  type Fitting,
  type Point,
  type RouteOptions,
  type RouteSpec,
  type Snap,
} from '../src/lib/circuit/geometry';

/** Identity snapping, so tests assert routing rather than pixel alignment. */
const identity: Snap = {
  x: (value) => value,
  y: (value) => value,
  tickX: (value) => value,
  tickY: (value) => value,
};

const options: RouteOptions = {
  width: 1000,
  railX: -28,
  railTop: 20,
  railBottom: 900,
  drop: 40,
  textRun: 32,
  pinGap: 12,
  radius: 12,
  minLeg: 32,
  minBranch: 16,
  labelInset: 24,
  tickClearance: 15,
  obstacles: [],
  snap: identity,
};

function node(overrides: Partial<RouteSpec> = {}): RouteSpec {
  return {
    id: 'node',
    attach: 'box',
    lane: 'auto',
    box: { left: 0, top: 400, width: 600, height: 80 },
    bounds: { left: 0, top: 400, width: 600, height: 80 },
    ...overrides,
  };
}

const origin: Point = { x: 500, y: 100 };

/** Every radius appearing in an arc command, deduplicated. */
function radii(path: string): string[] {
  const found = [...path.matchAll(/A (-?[\d.]+) /g)].map((match) => match[1]!);
  return [...new Set(found)];
}

function kinds(fittings: readonly Fitting[], kind: Fitting['kind']): Fitting[] {
  return fittings.filter((fitting) => fitting.kind === kind);
}

// ---------------------------------------------------------------- path maths

test('orthogonalPath returns an empty string for no points', () => {
  assert.equal(orthogonalPath([], 12), '');
});

test('orthogonalPath moves without drawing for a single point', () => {
  assert.equal(orthogonalPath([{ x: 4, y: 6 }], 12), 'M 4 6');
});

test('orthogonalPath draws a straight line between two points', () => {
  assert.equal(orthogonalPath([{ x: 0, y: 0 }, { x: 40, y: 0 }], 12), 'M 0 0 L 40 0');
});

test('orthogonalPath sweeps a corner as a true circular arc, never a quadratic', () => {
  const path = orthogonalPath([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }], 12);
  assert.equal(path, 'M 0 0 L 88 0 A 12 12 0 0 1 100 12 L 100 100');
  assert.ok(!path.includes('Q'), 'quadratics drift in apparent radius with leg length');
});

test('orthogonalPath picks the sweep flag from the turn direction', () => {
  const clockwise = orthogonalPath([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }], 12);
  const anticlockwise = orthogonalPath([{ x: 100, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 100 }], 12);
  assert.ok(clockwise.includes('A 12 12 0 0 1'), 'right then down turns clockwise on screen');
  assert.ok(anticlockwise.includes('A 12 12 0 0 0'), 'left then down turns the other way');
});

test('orthogonalPath uses one radius for every corner in a run', () => {
  const path = orthogonalPath(
    [
      { x: 0, y: 0 },
      { x: 200, y: 0 },
      { x: 200, y: 60 },
      { x: 400, y: 60 },
      { x: 400, y: 300 },
    ],
    12,
  );
  assert.deepEqual(radii(path), ['12']);
});

test('orthogonalPath drops duplicate consecutive points', () => {
  const path = orthogonalPath(
    [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 40, y: 0 }],
    12,
  );
  assert.equal(path, 'M 0 0 L 40 0');
});

// ------------------------------------------------------------------ relaxing

test('relaxLegs leaves a polyline whose legs are already long enough alone', () => {
  const points = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }];
  assert.deepEqual(relaxLegs(points, 32), points);
});

test('relaxLegs drops a short first leg and squares the run onto the source', () => {
  // A 10px stub off the source cannot carry a 12px corner, so it goes.
  const relaxed = relaxLegs(
    [{ x: 100, y: 0 }, { x: 90, y: 0 }, { x: 90, y: 200 }, { x: -28, y: 200 }],
    32,
  );
  assert.deepEqual(relaxed, [{ x: 100, y: 0 }, { x: 100, y: 200 }, { x: -28, y: 200 }]);
});

test('relaxLegs collapses an interior jog onto the far run', () => {
  // The 10px vertical between two horizontals is a wobble, not a step.
  const relaxed = relaxLegs(
    [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 10 }, { x: 200, y: 10 }],
    32,
  );
  assert.deepEqual(relaxed, [{ x: 0, y: 10 }, { x: 200, y: 10 }]);
});

test('relaxLegs keeps the terminal fixed when the last leg is short', () => {
  const relaxed = relaxLegs(
    [{ x: 0, y: 0 }, { x: 0, y: 200 }, { x: 10, y: 200 }],
    32,
  );
  assert.deepEqual(relaxed, [{ x: 10, y: 0 }, { x: 10, y: 200 }]);
});

test('relaxLegs guarantees the radius rather than shrinking it', () => {
  const relaxed = relaxLegs(
    [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 6 }, { x: 400, y: 6 }, { x: 400, y: 300 }],
    32,
  );
  const path = orthogonalPath(relaxed, 12);
  assert.deepEqual(radii(path), ['12']);
  assert.ok(!path.includes('L 200 0 A'), 'the 6px jog should not survive as a sweep');
});

// -------------------------------------------------------------------- trunks

test('busRoute runs the trunk from the source down to the lane and out to the rail', () => {
  const layout = busRoute(origin, [node()], options);
  assert.equal(
    layout.trunk,
    'M 500 100 L 480 100 A 12 12 0 0 0 468 112 L 468 128 A 12 12 0 0 1 456 140 L -28 140',
  );
  assert.deepEqual(radii(layout.trunk), ['12']);
});

test('busRoute leaves a straight between the two sweeps of the source step', () => {
  const layout = busRoute(origin, [node()], options);
  // Entry tangent of the second sweep must sit below the exit tangent of the
  // first, or the step renders as an S-curve rather than two corners.
  assert.ok(layout.trunk.includes('A 12 12 0 0 0 468 112 L 468 128 A'));
});

test('busRoute lifts the lane clear of the first node below the source', () => {
  // A node 30px under the source leaves no room for a 40px drop, and a lane run
  // through its box strikes through the type it is meant to serve.
  const layout = busRoute(origin, [node({ box: { left: 0, top: 130, width: 600, height: 80 } })], options);
  assert.ok(layout.trunk.endsWith('L -28 118'), `lane sat at the wrong height: ${layout.trunk}`);
});

test('busRoute keeps the lane a half leg below the source even with no room', () => {
  const layout = busRoute(origin, [node({ box: { left: 0, top: 104, width: 600, height: 80 } })], options);
  assert.ok(layout.trunk.endsWith('L -28 116'), `lane sat at the wrong height: ${layout.trunk}`);
});

test('busRoute drops the source stub when the rail is already within reach', () => {
  const layout = busRoute({ x: -4, y: 100 }, [node()], options);
  assert.equal(layout.trunk, 'M -4 100 L -4 128 A 12 12 0 0 1 -16 140 L -28 140');
});

test('busRoute never splits the trunk into arms', () => {
  const layout = busRoute(origin, [node({ box: { left: 0, top: 40, width: 600, height: 80 } })], options);
  assert.equal((layout.trunk.match(/M /g) ?? []).length, 1);
});

// ---------------------------------------------------------------------- rail

test('busRoute runs the rail the full height of the region regardless of nodes', () => {
  const layout = busRoute(origin, [node()], options);
  assert.equal(layout.rail, 'M -28 20 L -28 900');
});

test('busRoute caps both ends of the rail', () => {
  const layout = busRoute(origin, [node()], options);
  const caps = kinds(layout.fittings, 'cap');
  assert.ok(caps.some((cap) => cap.at.x === -28 && cap.at.y === 20));
  assert.ok(caps.some((cap) => cap.at.x === -28 && cap.at.y === 900));
});

test('busRoute anchors the label near the rail cap and brackets it', () => {
  const layout = busRoute(origin, [node()], options);
  assert.deepEqual(layout.label, { x: -28, y: 876 });
  assert.deepEqual(kinds(layout.fittings, 'bracket'), [
    { kind: 'bracket', at: { x: -28, y: 876 }, angle: 90, on: 'rail' },
  ]);
});

// ------------------------------------------------------------------ branches

test('busRoute drops a box node onto the lane above it rather than routing via the rail', () => {
  // This is the defect the rebuild exists to fix: a node beside its own source
  // used to travel to the gutter and back.
  const layout = busRoute(origin, [node({ box: { left: 400, top: 400, width: 200, height: 60 } })], options);
  const branch = layout.branches[0]!;
  assert.deepEqual(branch.tap, { x: 412, y: 140 });
  assert.deepEqual(branch.terminal, { x: 412, y: 400 });
  assert.equal(branch.spur, 'M 412 140 L 412 400');
  assert.equal(branch.axis, 'y');
});

test('busRoute rises from the lane to a box node sitting above it', () => {
  // A bottom-aligned column beside a tall heading is served by rising from the
  // lane rather than by dragging a run across the heading from the rail.
  const layout = busRoute(origin, [node({ box: { left: 400, top: 20, width: 200, height: 60 } })], options);
  const branch = layout.branches[0]!;
  assert.deepEqual(branch.tap, { x: 412, y: 140 });
  assert.deepEqual(branch.terminal, { x: 412, y: 80 }, 'lands on the node bottom edge');
  assert.equal(branch.axis, 'y');
});

test('busRoute taps the rail rather than running a stub through another node', () => {
  // The paragraph sits between the lane and the links below it, so a drop would
  // pass straight through it.
  const paragraph = { left: 0, top: 200, width: 600, height: 90 };
  const layout = busRoute(
    origin,
    [node({ box: { left: 0, top: 400, width: 600, height: 40 } })],
    { ...options, obstacles: [paragraph] },
  );
  assert.equal(layout.branches[0]!.tap.x, -28);
  assert.equal(layout.branches[0]!.axis, 'x');
});

test('busRoute keeps a stub a standoff clear of an obstacle, not merely outside it', () => {
  // Flush against a paragraph's leading edge is a collision on screen: the run
  // travels down the face of the first character of every line.
  const paragraph = { left: 0, top: 200, width: 600, height: 90 };
  const layout = busRoute(
    origin,
    [node({ box: { left: -6, top: 400, width: 600, height: 40 } })],
    { ...options, obstacles: [paragraph] },
  );
  assert.equal(layout.branches[0]!.axis, 'x', 'falls back to the rail');
});

test('busRoute lets a stub ignore the node it is on its way to', () => {
  // A run meeting text ends on a baseline, which is inside the node's own box.
  // Without identity on `bounds` every text node would block its own approach.
  const bounds = { left: 400, top: 400, width: 200, height: 40 };
  const layout = busRoute(
    origin,
    [node({ attach: 'text', bounds, box: { left: 400, top: 400, width: 200, height: 24 } })],
    { ...options, obstacles: [bounds] },
  );
  assert.equal(layout.branches[0]!.axis, 'y', 'still drops onto it');
  assert.deepEqual(layout.branches[0]!.terminal, { x: 400, y: 424 });
});

test('busRoute taps the rail when a node is too close to the lane to stub', () => {
  const layout = busRoute(origin, [node({ box: { left: 400, top: 150, width: 200, height: 60 } })], options);
  assert.equal(layout.branches[0]!.tap.x, -28);
  assert.equal(layout.branches[0]!.axis, 'x');
});

test('busRoute runs the lane past its own feed to reach a node right of the source', () => {
  // The source is at x=500 and the node starts at x=700, so the lane has to
  // travel further right than the trunk that feeds it, and be capped there.
  const layout = busRoute(origin, [node({ box: { left: 700, top: 400, width: 200, height: 60 } })], options);
  assert.equal(layout.lane, 'M 739 140 L -28 140', 'a separate run, capped at its far end');
  assert.equal(layout.trunk, 'M 500 100 L 480 100 A 12 12 0 0 0 468 112 L 468 140', 'the trunk tees in');
  assert.deepEqual(layout.branches[0]!.tap, { x: 712, y: 140 });
  assert.ok(
    kinds(layout.fittings, 'cap').some((cap) => cap.at.x === 739 && cap.at.y === 140),
    'the lane is capped where it stops',
  );
  assert.ok(
    kinds(layout.fittings, 'tap').some((tap) => tap.at.x === 468 && tap.angle === 0),
    'the trunk tees into the lane rather than elbowing onto its end',
  );
});

test('busRoute keeps the lane as one run with the trunk when nothing extends it', () => {
  const layout = busRoute(origin, [node()], options);
  assert.equal(layout.lane, '');
  assert.ok(layout.trunk.endsWith('L -28 140'));
});

test('busRoute taps the rail when a node asks for it explicitly', () => {
  const layout = busRoute(
    origin,
    [node({ lane: 'rail', box: { left: 400, top: 400, width: 200, height: 60 } })],
    options,
  );
  assert.equal(layout.branches[0]!.tap.x, -28);
});

test('busRoute keeps a lane drop clear of the lane corner it hangs from', () => {
  // The lane starts at x=468. A node beginning at 430 would otherwise tap at
  // 442, inside the trunk's own sweep.
  const layout = busRoute(origin, [node({ box: { left: 430, top: 400, width: 200, height: 60 } })], options);
  assert.equal(layout.branches[0]!.tap.x, 441, 'clamped clear of the lane corner');
});

test('busRoute falls back to the rail when a node starts past the lane corner', () => {
  // Dropping here would land left of the node's own leading edge.
  const layout = busRoute(origin, [node({ box: { left: 460, top: 400, width: 200, height: 60 } })], options);
  assert.equal(layout.branches[0]!.tap.x, -28);
});

test('busRoute meets a rule at its leading end so the divider reaches the bus', () => {
  const layout = busRoute(
    origin,
    [node({ attach: 'rule', box: { left: 0, top: 400, width: 600, height: 200 } })],
    options,
  );
  const branch = layout.branches[0]!;
  assert.deepEqual(branch.tap, { x: -28, y: 400 });
  assert.deepEqual(branch.terminal, { x: 0, y: 400 });
  assert.equal(branch.spur, 'M -28 400 L 0 400');
});

test('busRoute meets text at its baseline and stops at the leading edge', () => {
  // Running on past the leading edge left a stray dash under the first glyphs.
  const layout = busRoute(
    origin,
    [node({ attach: 'text', lane: 'rail', box: { left: 0, top: 400, width: 600, height: 24 } })],
    options,
  );
  const branch = layout.branches[0]!;
  assert.deepEqual(branch.tap, { x: -28, y: 424 }, 'taps the rail at the baseline');
  assert.deepEqual(branch.terminal, { x: 0, y: 424 }, 'stops where the type begins');
  assert.equal(branch.spur, 'M -28 424 L 0 424');
});

test('busRoute drops onto text at its baseline, not the top of its line box', () => {
  // Landing on box.top left the run hanging in the gap above the type.
  const layout = busRoute(
    origin,
    [node({ attach: 'text', box: { left: 400, top: 400, width: 200, height: 24 } })],
    options,
  );
  const branch = layout.branches[0]!;
  assert.deepEqual(branch.tap, { x: 400, y: 140 });
  assert.deepEqual(branch.terminal, { x: 400, y: 424 });
  assert.equal(branch.axis, 'y');
});

test('busRoute keeps a terminal inboard of the rail', () => {
  const layout = busRoute(
    origin,
    [node({ attach: 'rule', box: { left: -400, top: 400, width: 600, height: 80 } })],
    options,
  );
  assert.equal(layout.branches[0]!.terminal.x, -12, 'railX + minBranch');
});

test('busRoute gives a capsule the whole run to travel, not just the spur', () => {
  const layout = busRoute(origin, [node({ box: { left: 400, top: 400, width: 200, height: 60 } })], options);
  const branch = layout.branches[0]!;
  assert.ok(branch.route.startsWith('M 500 100'), 'the route starts at the source');
  assert.ok(branch.route.endsWith('L 412 400'), 'and ends on the node');
  assert.deepEqual(radii(branch.route), ['12']);
});

test('busRoute shares one trunk head across every branch', () => {
  const layout = busRoute(
    origin,
    [
      node({ id: 'a', attach: 'rule', box: { left: 0, top: 300, width: 600, height: 80 } }),
      node({ id: 'b', attach: 'rule', box: { left: 0, top: 600, width: 600, height: 80 } }),
    ],
    options,
  );
  const [first, second] = layout.branches;
  assert.ok(first!.route.startsWith('M 500 100 L 480 100'));
  assert.ok(second!.route.startsWith('M 500 100 L 480 100'));
  assert.notEqual(first!.spur, second!.spur);
});

// ---------------------------------------------------------------- terminators

test('busRoute terminates every open end', () => {
  const specs = [
    node({ id: 'a', box: { left: 400, top: 400, width: 200, height: 60 } }),
    node({ id: 'b', attach: 'rule', box: { left: 0, top: 600, width: 600, height: 80 } }),
    node({ id: 'c', attach: 'text', box: { left: 0, top: 700, width: 300, height: 24 } }),
  ];
  const layout = busRoute(origin, specs, options);
  const closed = kinds(layout.fittings, 'cap').length + kinds(layout.fittings, 'port').length;
  // Open ends: the source, both rail caps, and one per node.
  assert.equal(closed, 3 + specs.length);
});

test('busRoute ports a rule termination and caps every other kind', () => {
  const layout = busRoute(
    origin,
    [
      node({ id: 'rule', attach: 'rule', box: { left: 0, top: 400, width: 600, height: 80 } }),
      node({ id: 'text', attach: 'text', box: { left: 0, top: 600, width: 300, height: 24 } }),
    ],
    options,
  );
  assert.equal(kinds(layout.fittings, 'port').length, 1);
  assert.deepEqual(kinds(layout.fittings, 'port')[0]!.at, { x: 0, y: 400 });
});

test('busRoute puts a node dot on every terminal', () => {
  const layout = busRoute(
    origin,
    [node({ id: 'a' }), node({ id: 'b', box: { left: 0, top: 600, width: 600, height: 80 } })],
    options,
  );
  assert.equal(kinds(layout.fittings, 'node').length, 2);
});

test('busRoute taps the rail where the trunk meets it', () => {
  const layout = busRoute(origin, [node()], options);
  assert.ok(
    kinds(layout.fittings, 'tap').some((tap) => tap.at.x === -28 && tap.at.y === 140),
    'the trunk feeding the rail is a tap, not a cap',
  );
});

test('busRoute lays a tap across the run it branches from', () => {
  const layout = busRoute(origin, [node({ box: { left: 400, top: 400, width: 200, height: 60 } })], options);
  const tap = kinds(layout.fittings, 'tap').find((fitting) => fitting.at.x === 412);
  assert.equal(tap?.angle, 0, 'a lane tap lies across a horizontal run');
});

// --------------------------------------------------------------------- ticks

test('elbowTicks dresses a corner with room on both legs', () => {
  const ticks = elbowTicks(
    [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 200 }],
    12,
    identity,
  );
  assert.equal(ticks.length, 2);
  assert.deepEqual(ticks[0]!.at, { x: 188, y: 0 });
  assert.deepEqual(ticks[1]!.at, { x: 200, y: 12 });
});

test('elbowTicks leaves a corner bare when a leg is too short to read', () => {
  const ticks = elbowTicks(
    [{ x: 0, y: 0 }, { x: 30, y: 0 }, { x: 30, y: 200 }],
    12,
    identity,
  );
  assert.deepEqual(ticks, []);
});

test('spaceFittings keeps every joint even when joints crowd each other', () => {
  const joints: Fitting[] = [
    { kind: 'tap', at: { x: 0, y: 0 }, angle: 90, on: 'rail' },
    { kind: 'cap', at: { x: 1, y: 0 }, angle: 0, on: 'branch' },
  ];
  assert.equal(spaceFittings(joints, [], 20).length, 2);
});

test('spaceFittings drops a tick that would crowd a joint', () => {
  const joints: Fitting[] = [{ kind: 'tap', at: { x: 0, y: 0 }, angle: 90, on: 'rail' }];
  const ticks: Fitting[] = [
    { kind: 'elbow', at: { x: 5, y: 0 }, angle: 0, on: 'trunk' },
    { kind: 'elbow', at: { x: 60, y: 0 }, angle: 0, on: 'trunk' },
  ];
  const kept = spaceFittings(joints, ticks, 20);
  assert.equal(kept.length, 2);
  assert.deepEqual(kept[1]!.at, { x: 60, y: 0 });
});

// -------------------------------------------------------------------- snapping

test('busRoute snaps every emitted coordinate through the supplied snapper', () => {
  const snapped = busRoute(
    { x: 500.4, y: 100.6 },
    [node({ attach: 'text', box: { left: 0.3, top: 400.7, width: 600, height: 24.2 } })],
    {
      ...options,
      snap: {
        x: Math.round,
        y: Math.round,
        tickX: (value) => Math.round(value) + 0.5,
        tickY: (value) => Math.round(value) + 0.5,
      },
    },
  );
  const branch = snapped.branches[0]!;
  assert.equal(branch.terminal.x % 1, 0);
  assert.equal(branch.terminal.y % 1, 0);
  const tick = snapped.fittings.find((fitting) => fitting.kind === 'bracket')!;
  assert.equal(Math.abs(tick.at.y % 1), 0.5, 'one-pixel ticks centre on half pixels');
});
