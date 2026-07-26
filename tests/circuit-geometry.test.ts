import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
  busRoute,
  manhattanPath,
  type Point,
  type RouteOptions,
  type RouteSpec,
} from '../src/lib/circuit/geometry';

const options: RouteOptions = {
  width: 1000,
  spineX: -28,
  railY: 40,
  topLane: 16,
  drop: 34,
  pinGap: 10,
  bendRadius: 8,
  minBranch: 14,
};

function node(overrides: Partial<RouteSpec> = {}): RouteSpec {
  return {
    id: 'node',
    edge: 'left',
    box: { left: 0, top: 400, width: 600, height: 80 },
    ...overrides,
  };
}

test('manhattanPath returns an empty string for no points', () => {
  assert.equal(manhattanPath([], 8), '');
});

test('manhattanPath moves without drawing for a single point', () => {
  assert.equal(manhattanPath([{ x: 4, y: 6 }], 8), 'M 4 6');
});

test('manhattanPath draws a straight line between two points', () => {
  assert.equal(manhattanPath([{ x: 0, y: 0 }, { x: 0, y: 50 }], 8), 'M 0 0 L 0 50');
});

test('manhattanPath rounds an interior corner with a quadratic', () => {
  // Arrange
  const points: Point[] = [
    { x: 0, y: 0 },
    { x: 0, y: 100 },
    { x: 100, y: 100 },
  ];

  // Act
  const path = manhattanPath(points, 10);

  // Assert
  assert.equal(path, 'M 0 0 L 0 90 Q 0 100 10 100 L 100 100');
});

test('manhattanPath caps rounding at half the shorter adjacent run', () => {
  const path = manhattanPath(
    [
      { x: 0, y: 0 },
      { x: 0, y: 6 },
      { x: 100, y: 6 },
    ],
    40,
  );

  assert.equal(path, 'M 0 0 L 0 3 Q 0 6 3 6 L 100 6');
});

test('manhattanPath drops duplicate consecutive points', () => {
  const path = manhattanPath(
    [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 40 },
    ],
    8,
  );

  assert.equal(path, 'M 0 0 L 0 40');
});

test('busRoute turns onto the spine and runs to the furthest junction', () => {
  // Arrange
  const specs = [
    node({ id: 'first', box: { left: 0, top: 200, width: 600, height: 40 } }),
    node({ id: 'second', box: { left: 0, top: 600, width: 600, height: 40 } }),
  ];

  // Act
  const layout = busRoute({ x: 120, y: 100 }, specs, options);

  // Assert
  assert.equal(layout.trunks.length, 1);
  assert.equal(layout.branches.length, 2);
  assert.deepEqual(
    layout.branches.map((branch) => branch.junction),
    [
      { x: -28, y: 220 },
      { x: -28, y: 620 },
    ],
  );
  assert.deepEqual(layout.label, { x: -28, y: 620 });
});

test('busRoute snaps the turn onto a junction it nearly touches', () => {
  // Arrange: the junction lands 2px below where the turn would otherwise sit,
  // which would leave a hairline second arm.
  const specs = [node({ edge: 'rail', box: { left: 700, top: 500, width: 200, height: 60 } })];

  // Act
  const layout = busRoute({ x: 120, y: 100 }, specs, { ...options, railY: 106 });

  // Assert
  assert.equal(layout.trunks.length, 1);
  assert.equal(layout.branches[0]?.junction.y, 106);
});

test('busRoute returns a second upward arm when a junction sits above the turn', () => {
  const specs = [node({ box: { left: 0, top: 40, width: 600, height: 40 } })];

  const layout = busRoute({ x: 120, y: 300 }, specs, options);

  assert.equal(layout.trunks.length, 2);
  assert.ok(layout.trunks[1]?.startsWith('M -28 '));
});

test('busRoute leaves a visible drop when a junction sits at the origin', () => {
  const specs = [node({ box: { left: 0, top: 100, width: 600, height: 0 } })];

  const layout = busRoute({ x: 120, y: 100 }, specs, options);

  // The trunk must not turn onto the spine at the origin's own y.
  assert.ok(layout.trunks[0]?.startsWith('M 120 100 '));
  assert.ok(!layout.trunks[0]?.includes('L 120 100 '));
});

test('busRoute terminates a left branch short of the node edge', () => {
  const specs = [node({ edge: 'left', box: { left: 300, top: 400, width: 200, height: 60 } })];

  const layout = busRoute({ x: 120, y: 100 }, specs, options);
  const [branch] = layout.branches;

  assert.equal(branch?.axis, 'x');
  assert.deepEqual(branch?.terminal, { x: 290, y: 430 });
});

test('busRoute keeps a branch at least minBranch long when a node reaches the spine', () => {
  const specs = [node({ edge: 'left', box: { left: -40, top: 400, width: 200, height: 60 } })];

  const layout = busRoute({ x: 120, y: 100 }, specs, options);

  assert.equal(layout.branches[0]?.terminal.x, options.spineX + options.minBranch);
});

test('busRoute approaches a top branch through the lane above the node', () => {
  const specs = [node({ edge: 'top', box: { left: 0, top: 400, width: 600, height: 60 } })];

  const layout = busRoute({ x: 120, y: 100 }, specs, options);
  const [branch] = layout.branches;

  assert.equal(branch?.axis, 'y');
  assert.deepEqual(branch?.junction, { x: -28, y: 384 });
  assert.deepEqual(branch?.terminal, { x: 20, y: 390 });
});

test('busRoute sends a rail branch along the region rail rather than the node top', () => {
  const specs = [node({ edge: 'rail', box: { left: 700, top: 500, width: 200, height: 60 } })];

  const layout = busRoute({ x: 120, y: 100 }, specs, options);
  const [branch] = layout.branches;

  assert.equal(branch?.junction.y, options.railY);
  assert.deepEqual(branch?.terminal, { x: 720, y: 490 });
});

test('busRoute keeps a terminal inside the region width', () => {
  const specs = [node({ edge: 'rail', box: { left: 1200, top: 500, width: 200, height: 60 } })];

  const layout = busRoute({ x: 120, y: 100 }, specs, options);

  assert.equal(layout.branches[0]?.terminal.x, options.width - options.minBranch);
});

test('busRoute shares one trunk head across every branch', () => {
  const specs = [
    node({ id: 'first', box: { left: 0, top: 300, width: 600, height: 40 } }),
    node({ id: 'second', box: { left: 0, top: 700, width: 600, height: 40 } }),
  ];

  const layout = busRoute({ x: 120, y: 100 }, specs, options);
  const [first, second] = layout.branches;
  const head = 'M 120 100 L 120 126';

  assert.ok(first?.d.startsWith(head));
  assert.ok(second?.d.startsWith(head));
  // The spur carries only the part of the route the trunk does not already draw.
  assert.ok(second?.spur.startsWith('M -28 720'));
});
