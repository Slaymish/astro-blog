/**
 * CIRCUIT ENGINE
 *
 * Draws the pipework overlay: a bus leaving a source, a rail down the page
 * gutter, branches tapping one or the other, and a capsule travelling each run.
 *
 * The grammar is docs/design-docs/circuit-design-language.md. This file owns the
 * DOM, the measurement, and the lifecycle; src/lib/circuit/geometry.ts owns the
 * routing maths and is pure; src/design-system/circuit.css owns presentation.
 *
 * Markup contract:
 *
 *   <section data-circuit="BUS_01">
 *     <p data-circuit-source>…</p>
 *     <a data-circuit-node="start" data-circuit-attach="rule" data-circuit-flash="edge">…</a>
 *   </section>
 *
 * data-circuit-attach box | rule | text  what physically exists at the node for
 *                     the run to land on. Explicit; never inferred from the
 *                     flash, because a flash is presentational and attachment
 *                     is structural.
 * data-circuit-flash  ring | edge | underline  how the node acknowledges.
 * data-circuit-lane   auto | rail  forces a rail tap for a node that would
 *                     otherwise be dropped onto from the lane.
 *
 * Every node dispatches a bubbling `circuit:arrive` event when a capsule lands.
 *
 * Motion is CSS. There is no requestAnimationFrame loop here: capsules are
 * declarative `offset-path` animations, paused by a class while their region is
 * off screen, and absent entirely where `offset-path` is unsupported or the
 * visitor has asked for reduced motion.
 */

import {
  busRoute,
  type Attach,
  type Box,
  type Fitting,
  type Lane,
  type Point,
  type RouteSpec,
  type Snap,
} from './geometry';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** A region counts as on screen once this much of it is showing. */
const VISIBLE_RATIO = 0.01;
/**
 * Fraction of a glyph box that sits below the baseline. Lifting a client rect's
 * bottom by this lands on the baseline itself, which is the line every run that
 * meets text rests on — at the source and at a text node alike.
 */
const BASELINE_LIFT = 0.22;
/**
 * Longest a capsule may take to cross its run, whatever the speed token says.
 * Without a ceiling a very long route on a tall region reads as motionless.
 */
const MAX_TRAVEL_SECONDS = 14;

interface Metrics {
  lane: number;
  drop: number;
  textRun: number;
  pinGap: number;
  minBranch: number;
  radius: number;
  minLeg: number;
  railInset: number;
  originGap: number;
  tickLength: number;
  tapSpread: number;
  portLength: number;
  capLength: number;
  capWeight: number;
  bracketLength: number;
  nodeRadius: number;
  tickClearance: number;
  labelOffset: number;
  labelInset: number;
  speed: number;
  duty: number;
  hold: number;
}

interface CircuitNode {
  el: HTMLElement;
  id: string;
  spur: SVGPathElement;
  capsule: HTMLElement | null;
  /** The terminal dot, re-created on every layout and re-bound here. */
  dot: SVGCircleElement | null;
  holdTimer: number;
}

interface CircuitRegion {
  el: HTMLElement;
  name: string;
  source: HTMLElement;
  svg: SVGSVGElement;
  flow: HTMLElement;
  trunkPipe: [SVGPathElement, SVGPathElement];
  lanePipe: [SVGPathElement, SVGPathElement];
  railPipe: [SVGPathElement, SVGPathElement];
  fittingLayer: SVGGElement;
  label: SVGTextElement;
  measure: SVGPathElement;
  nodes: CircuitNode[];
  metrics: Metrics;
}

const regions: CircuitRegion[] = [];
let booted = false;
let layoutFrame = 0;

/**
 * Capsules exist only where the platform can move them on the compositor. When
 * it cannot, the structure still renders complete — the drawing is the baseline
 * and the motion is the enhancement.
 */
const canFlow =
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  CSS.supports('offset-path', 'path("M 0 0 L 1 1")');

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function readMetrics(el: Element): Metrics {
  const styles = getComputedStyle(el);
  const value = (name: string, fallback: number): number => {
    const parsed = Number.parseFloat(styles.getPropertyValue(name));
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  return {
    lane: value('--circuit-lane', 28),
    drop: value('--circuit-drop', 40),
    textRun: value('--circuit-text-run', 32),
    pinGap: value('--circuit-pin-gap', 12),
    minBranch: value('--circuit-min-branch', 16),
    radius: value('--circuit-radius', 12),
    minLeg: value('--circuit-min-leg', 32),
    railInset: value('--circuit-rail-inset', 24),
    originGap: value('--circuit-origin-gap', 3),
    tickLength: value('--circuit-tick-length', 10),
    tapSpread: value('--circuit-tap-spread', 6),
    portLength: value('--circuit-port-length', 14),
    capLength: value('--circuit-cap-length', 14),
    capWeight: value('--circuit-cap-weight', 2),
    bracketLength: value('--circuit-bracket-length', 8),
    nodeRadius: value('--circuit-node-radius', 2),
    tickClearance: value('--circuit-tick-clearance', 15),
    labelOffset: value('--circuit-label-offset', 12),
    labelInset: value('--circuit-label-inset', 24),
    speed: value('--circuit-packet-speed', 120),
    duty: value('--circuit-packet-duty', 0.4),
    hold: value('--circuit-node-hold', 520),
  };
}

function svgNode<K extends keyof SVGElementTagNameMap>(
  tag: K,
  className?: string,
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  if (className) el.setAttribute('class', className);
  return el;
}

/**
 * Snapping onto the device pixel grid.
 *
 * Rounding region-local coordinates alone would not do it: the overlay's own
 * left edge is fractional (57.59px at 1440px on this site), so a whole
 * region-local number still lands mid-pixel. The overlay's offset has to be part
 * of the sum. Even-weight strokes centre on whole pixels; the 1px tick centres on
 * a half pixel, which covers exactly one pixel at 1x and two at 2x.
 */
function snapFor(box: DOMRect): Snap {
  const offsetX = box.left;
  const offsetY = box.top;
  return {
    x: (value) => Math.round(value + offsetX) - offsetX,
    y: (value) => Math.round(value + offsetY) - offsetY,
    tickX: (value) => Math.round(value + offsetX) + 0.5 - offsetX,
    tickY: (value) => Math.round(value + offsetY) + 0.5 - offsetY,
  };
}

/**
 * The line a run rests on where it meets text: the baseline of `rect`, cleared
 * by the pipe's own wall so the section never crowds the type.
 */
function textBaseline(rect: DOMRect, originGap: number): number {
  return rect.bottom - rect.height * BASELINE_LIFT + originGap;
}

/**
 * Where the pipe leaves the source. Anchored to the final glyph rather than the
 * element box, so a run leaving a word starts under its last character even when
 * the text wraps.
 */
function sourceOrigin(source: HTMLElement, regionBox: DOMRect, snap: Snap, originGap: number): Point {
  const fragments = source.getClientRects();
  let box: DOMRect | undefined = fragments[fragments.length - 1];
  const text = source.firstChild;
  const content = text?.nodeType === Node.TEXT_NODE ? text.textContent : null;

  if (text && content && content.length > 0) {
    const range = document.createRange();
    range.setStart(text, content.length - 1);
    range.setEnd(text, content.length);
    box = range.getBoundingClientRect();
  }
  if (!box || box.width + box.height === 0) box = source.getBoundingClientRect();

  return {
    x: snap.x(box.left - regionBox.left + box.width / 2),
    y: snap.y(textBaseline(box, originGap) - regionBox.top),
  };
}

function buildRegion(el: HTMLElement): CircuitRegion | null {
  const source = el.querySelector<HTMLElement>('[data-circuit-source]');
  const nodeEls = Array.from(el.querySelectorAll<HTMLElement>('[data-circuit-node]'));
  if (!source || nodeEls.length === 0) return null;

  const svg = svgNode('svg', 'circuit');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('preserveAspectRatio', 'none');

  // Walls first, then bores, so a bore is always painted over every wall and a
  // crossing keeps its section. Branches sit above both: a spur leaves from the
  // bus's centreline and should read as joining it.
  const wallLayer = svgNode('g', 'circuit__walls');
  const boreLayer = svgNode('g', 'circuit__bores');
  const branchLayer = svgNode('g', 'circuit__branches');
  const fittingLayer = svgNode('g', 'circuit__fittings');
  const measure = svgNode('path', 'circuit__measure');

  // One wall plus one bore per run. Grouped by layer rather than paired, so a
  // bore is always painted over every wall and a crossing keeps its section.
  const addPipe = (variant: string): [SVGPathElement, SVGPathElement] => {
    const wall = svgNode('path', `circuit__pipe circuit__wall circuit__${variant}`);
    const bore = svgNode('path', `circuit__pipe circuit__bore circuit__${variant}`);
    wallLayer.append(wall);
    boreLayer.append(bore);
    return [wall, bore];
  };
  const trunkPipe = addPipe('trunk');
  const lanePipe = addPipe('trunk');
  const railPipe = addPipe('rail');

  const label = svgNode('text', 'circuit__label');
  label.textContent = el.dataset.circuit || '';

  const flow = document.createElement('div');
  flow.className = 'circuit__flow';
  flow.setAttribute('aria-hidden', 'true');

  const nodes: CircuitNode[] = nodeEls.map((nodeEl, index) => {
    const spur = svgNode('path', 'circuit__pipe circuit__spur');
    branchLayer.append(spur);

    let capsule: HTMLElement | null = null;
    if (canFlow) {
      capsule = document.createElement('span');
      capsule.className = 'circuit__capsule';
      flow.append(capsule);
    }

    return {
      el: nodeEl,
      id: nodeEl.dataset.circuitNode || `node-${index + 1}`,
      spur,
      capsule,
      dot: null,
      holdTimer: 0,
    };
  });

  svg.append(wallLayer, boreLayer, branchLayer, fittingLayer, label, measure);
  el.prepend(svg, flow);

  return {
    el,
    name: el.dataset.circuit || 'BUS',
    source,
    svg,
    flow,
    trunkPipe,
    lanePipe,
    railPipe,
    fittingLayer,
    label,
    measure,
    nodes,
    metrics: readMetrics(el),
  };
}

function localRect(rect: DOMRect, regionBox: DOMRect): Box {
  return {
    left: rect.left - regionBox.left,
    top: rect.top - regionBox.top,
    width: rect.width,
    height: rect.height,
  };
}

/**
 * The first line box of an element's text.
 *
 * `getClientRects()` returns line boxes for an inline element but a single
 * border box for a block, so it cannot find the first line of a paragraph. A
 * Range over the element's contents does return line boxes either way.
 */
function firstLineRect(el: HTMLElement): DOMRect {
  const range = document.createRange();
  range.selectNodeContents(el);
  const rect = range.getClientRects()[0];
  return rect && rect.width + rect.height > 0 ? rect : el.getBoundingClientRect();
}

/**
 * The box a run attaches to. Text is measured from its first line and squared
 * off at the baseline, so a run meets a label where its underline would sit
 * rather than at the bottom of a block that may have wrapped.
 */
function attachBox(el: HTMLElement, attach: Attach, regionBox: DOMRect, originGap: number): Box {
  if (attach !== 'text') return localRect(el.getBoundingClientRect(), regionBox);

  const rect = firstLineRect(el);
  const box = localRect(rect, regionBox);
  return { ...box, height: textBaseline(rect, originGap) - rect.top };
}

function resolveAttach(el: HTMLElement): Attach {
  const declared = el.dataset.circuitAttach;
  return declared === 'rule' || declared === 'text' ? declared : 'box';
}

function resolveLane(el: HTMLElement): Lane {
  return el.dataset.circuitLane === 'rail' ? 'rail' : 'auto';
}

/**
 * One fitting bar, drawn across the pipe it dresses. Geometry is authored as if
 * the pipe ran along +x and then rotated onto its real bearing, so a single
 * primitive serves every kind of joint. Strokes rather than filled rects: pipes
 * and fittings then share one rendering model and cannot disagree about weight.
 */
function fittingBar(
  fitting: Fitting,
  length: number,
  along: number,
  variant: string,
): SVGLineElement {
  const bar = svgNode(
    'line',
    `circuit__fitting circuit__fitting--${variant} circuit__fitting--on-${fitting.on}`,
  );
  const x = round(fitting.at.x + along);
  bar.setAttribute('x1', `${x}`);
  bar.setAttribute('x2', `${x}`);
  bar.setAttribute('y1', `${round(fitting.at.y - length / 2)}`);
  bar.setAttribute('y2', `${round(fitting.at.y + length / 2)}`);
  bar.setAttribute(
    'transform',
    `rotate(${fitting.angle} ${round(fitting.at.x)} ${round(fitting.at.y)})`,
  );
  return bar;
}

/**
 * Dress every joint the route reported. A tap gets a band either side of the
 * split, so a branch reads as tapped into the bus rather than crossing it. A cap
 * is set back by its own thickness: the route ends on the face it serves, so the
 * plate has to sit outside that face rather than sink into it. A port is a single
 * longer mark where the pipe hands over to a rule the layout already draws.
 *
 * Returns the terminal dots in the order they were emitted, which is node order,
 * so the caller can rebind them after a repaint.
 */
function paintFittings(region: CircuitRegion, fittings: readonly Fitting[]): SVGCircleElement[] {
  const { tickLength, tapSpread, portLength, capLength, capWeight, bracketLength, nodeRadius } =
    region.metrics;
  const dots: SVGCircleElement[] = [];

  region.fittingLayer.replaceChildren(
    ...fittings.flatMap((fitting): SVGElement[] => {
      switch (fitting.kind) {
        case 'tap':
          return [
            fittingBar(fitting, tickLength, -tapSpread, 'tap'),
            fittingBar(fitting, tickLength, tapSpread, 'tap'),
          ];
        case 'cap':
          return [fittingBar(fitting, capLength, -capWeight / 2, 'cap')];
        case 'port':
          return [fittingBar(fitting, portLength, 0, 'port')];
        case 'bracket':
          return [fittingBar(fitting, bracketLength, 0, 'bracket')];
        case 'node': {
          const dot = svgNode('circle', 'circuit__node');
          dot.setAttribute('cx', `${round(fitting.at.x)}`);
          dot.setAttribute('cy', `${round(fitting.at.y)}`);
          dot.setAttribute('r', `${round(nodeRadius)}`);
          dots.push(dot);
          return [dot];
        }
        default:
          return [fittingBar(fitting, tickLength, 0, 'elbow')];
      }
    }),
  );

  return dots;
}

/**
 * Point a capsule at its route and set the cycle it travels on. Speed is
 * constant in pixels per second whatever the route's length, so a short spur and
 * a long trunk read as the same fluid moving at one rate. The travel phase is
 * `duty` of the cycle and the rest is dark, which is what keeps a live region
 * quiet most of the time.
 */
function setCapsule(node: CircuitNode, track: string, length: number, metrics: Metrics, index: number): void {
  const capsule = node.capsule;
  if (!capsule) return;

  const travel = Math.min(length / Math.max(metrics.speed, 1), MAX_TRAVEL_SECONDS);
  const cycle = travel / Math.max(metrics.duty, 0.05);
  capsule.style.setProperty('offset-path', `path("${track}")`);
  capsule.style.setProperty('--circuit-cycle', `${round(cycle)}s`);
  // Stagger so two capsules on one bus never set off together, and start each
  // partway through its own dark phase so nothing fires the instant a region
  // scrolls into view.
  capsule.style.setProperty('animation-delay', `${round(-cycle * (0.55 + index * 0.17))}s`);
}

function layoutRegion(region: CircuitRegion): void {
  // Measure against the overlay, not the region: as an absolutely positioned
  // child the overlay fills its region's padding box, and every coordinate the
  // routing produces has to share that frame. Regions with generous vertical
  // padding (the contact band) would otherwise be offset by it.
  const regionBox = region.svg.getBoundingClientRect();
  if (regionBox.width < 1 || regionBox.height < 1) return;

  const metrics = readMetrics(region.el);
  region.metrics = metrics;
  const snap = snapFor(regionBox);

  // The rail runs down the middle of the page gutter, and no further out than
  // one lane. Centring rather than clamping to a minimum edge gap is what keeps
  // the run off the screen edge on tablet and mobile, where the gutter narrows
  // to less than a lane and there is nowhere inboard to put it.
  const railX = snap.x(-Math.min(metrics.lane, regionBox.left / 2));

  // Full boxes, not the squared text boxes the routing lands on: a stub has to
  // clear the whole of a wrapped paragraph, not just its first line. The node
  // boxes are handed to the specs by reference so a stub can tell its own
  // destination apart from something in the way.
  const sourceBounds = localRect(region.source.getBoundingClientRect(), regionBox);
  const nodeBounds = region.nodes.map((node) => localRect(node.el.getBoundingClientRect(), regionBox));
  const obstacles = [sourceBounds, ...nodeBounds];

  const specs: RouteSpec[] = region.nodes.map((node, index) => {
    const attach = resolveAttach(node.el);
    return {
      id: node.id,
      attach,
      lane: resolveLane(node.el),
      box: attachBox(node.el, attach, regionBox, metrics.originGap),
      bounds: nodeBounds[index]!,
    };
  });

  const layout = busRoute(sourceOrigin(region.source, regionBox, snap, metrics.originGap), specs, {
    width: regionBox.width,
    railX,
    railTop: snap.y(metrics.railInset),
    railBottom: snap.y(regionBox.height - metrics.railInset),
    drop: metrics.drop,
    textRun: metrics.textRun,
    pinGap: metrics.pinGap,
    radius: metrics.radius,
    minLeg: metrics.minLeg,
    minBranch: metrics.minBranch,
    labelInset: metrics.labelInset,
    tickClearance: metrics.tickClearance,
    obstacles,
    snap,
  });

  region.svg.setAttribute('viewBox', `0 0 ${round(regionBox.width)} ${round(regionBox.height)}`);
  const setPipe = (pipe: readonly SVGPathElement[], d: string): void => {
    for (const path of pipe) path.setAttribute('d', d);
  };
  setPipe(region.trunkPipe, layout.trunk);
  setPipe(region.lanePipe, layout.lane);
  setPipe(region.railPipe, layout.rail);

  layout.branches.forEach((branch, index) => {
    const node = region.nodes[index];
    if (!node) return;
    node.spur.setAttribute('d', branch.spur);
    region.measure.setAttribute('d', branch.route);
    setCapsule(node, branch.route, region.measure.getTotalLength(), metrics, index);
  });

  const dots = paintFittings(region, layout.fittings);
  region.nodes.forEach((node, index) => {
    node.dot = dots[index] ?? null;
  });

  const labelX = round(layout.railX - metrics.labelOffset);
  const labelY = round(layout.label.y);
  region.label.setAttribute('x', `${labelX}`);
  region.label.setAttribute('y', `${labelY}`);
  region.label.setAttribute('transform', `rotate(-90 ${labelX} ${labelY})`);
}

/**
 * Acknowledge a capsule reaching its node. `animationiteration` fires as the
 * cycle wraps, which is exactly the moment the capsule has finished its run.
 */
function acknowledge(region: CircuitRegion, node: CircuitNode): void {
  node.el.classList.add('is-energised');
  node.dot?.classList.add('is-live');
  window.clearTimeout(node.holdTimer);
  node.holdTimer = window.setTimeout(() => {
    node.el.classList.remove('is-energised');
    node.dot?.classList.remove('is-live');
  }, region.metrics.hold);

  node.el.dispatchEvent(
    new CustomEvent('circuit:arrive', {
      bubbles: true,
      detail: { bus: region.name, node: node.id },
    }),
  );
}

function scheduleLayout(): void {
  if (layoutFrame) return;
  layoutFrame = requestAnimationFrame(() => {
    layoutFrame = 0;
    for (const region of regions) layoutRegion(region);
  });
}

export function initCircuit(): void {
  if (booted || typeof window === 'undefined') return;
  booted = true;

  for (const el of document.querySelectorAll<HTMLElement>('[data-circuit]')) {
    const region = buildRegion(el);
    if (!region) continue;
    regions.push(region);
    for (const node of region.nodes) {
      node.capsule?.addEventListener('animationiteration', () => acknowledge(region, node));
    }
  }
  if (regions.length === 0) return;

  window.addEventListener('resize', scheduleLayout, { passive: true });

  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(scheduleLayout);
    for (const region of regions) {
      observer.observe(region.el);
      observer.observe(region.source);
      for (const node of region.nodes) observer.observe(node.el);
    }
  }

  // Motion runs only while a region is on screen, and the toggle is a class
  // rather than a timer: an off-screen bus costs nothing at all.
  if (typeof IntersectionObserver !== 'undefined') {
    const watcher = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.classList.toggle('is-circuit-live', entry.isIntersecting);
        }
      },
      { threshold: VISIBLE_RATIO },
    );
    for (const region of regions) watcher.observe(region.el);
  } else {
    for (const region of regions) region.el.classList.add('is-circuit-live');
  }

  // Paint immediately with fallback metrics, then refine once the real faces
  // are ready. Waiting for fonts here made the complete drawing pop in late.
  scheduleLayout();
  document.fonts.ready.then(scheduleLayout, scheduleLayout);
}
