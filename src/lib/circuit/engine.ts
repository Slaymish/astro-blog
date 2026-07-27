/**
 * CIRCUIT ENGINE
 *
 * Wires DOM elements together with a data bus: pipework routed from a source to
 * a set of nodes, packets that travel those runs, and an acknowledgement on the
 * node each packet reaches.
 *
 * Markup contract:
 *
 *   <section data-circuit="BUS_01">
 *     <p data-circuit-source>…</p>
 *     <div data-circuit-rail>…</div>
 *     <a data-circuit-node="book" data-circuit-edge="rail" data-circuit-flash="ring">…</a>
 *   </section>
 *
 * data-circuit-edge   left | top | rail   (see geometry.ts, default left)
 * data-circuit-flash  ring | edge | underline  (see circuit.css, default ring)
 * data-circuit-attach box | rule | text   (see geometry.ts; defaults off flash,
 *                     which already says what the node presents: an edge is a
 *                     rule, an underline is text, anything else is a box)
 * data-circuit-rail   marks the element whose top defines the rail lane.
 *
 * Every node dispatches a bubbling `circuit:arrive` event when a packet lands.
 */

import {
  busRoute,
  type Attach,
  type Box,
  type Fitting,
  type NodeEdge,
  type Point,
  type RouteSpec,
} from './geometry';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Ceiling on packets in flight document-wide. The bus stays legible, not busy. */
const MAX_LIVE_PACKETS = 3;
/** Minimum spacing between two packets triggered on the same node. */
const NODE_COOLDOWN = 1800;
/** A source hover emits at most one packet in this window. */
const SOURCE_COOLDOWN = 2800;
/** A region goes live once its top reaches this fraction of the viewport. */
const ENTER_RATIO = 0.86;
/** Viewport pixels of a region that must be showing for its heartbeat to run. */
const VISIBLE_SLACK = 40;
/** Space needed left of the spine before a bus label is worth drawing. */
const LABEL_MIN_GUTTER = 16;
const PACKET_MIN_DURATION = 200;
const PACKET_MAX_DURATION = 1500;
const TOUCH_PULSE_HOLD = 900;
const TOUCH_PULSE_FADE = 420;
/**
 * Fraction of a glyph box that sits below the baseline. Lifting a client rect's
 * bottom by this lands on the baseline itself, which is the line every run that
 * meets text rests on — at the source and at a text node alike.
 */
const BASELINE_LIFT = 0.22;

type Direction = 'out' | 'back';

interface Metrics {
  lane: number;
  pinGap: number;
  bendRadius: number;
  minBranch: number;
  fittingClearance: number;
  drop: number;
  railGap: number;
  topLane: number;
  textRun: number;
  originGap: number;
  collarLength: number;
  collarWeight: number;
  teeLength: number;
  teeSpread: number;
  flangeLength: number;
  flangeWeight: number;
  pulseLength: number;
  speed: number;
  drawDuration: number;
  hold: number;
  heartbeat: number;
}

/**
 * A run of pipe: an outer wall and an inner bore on identical path data. The two
 * edges the wall shows either side of the bore are what give the run its
 * section, and a packet travelling the bore reads as light inside the pipe.
 */
interface Pipe {
  wall: SVGPathElement;
  bore: SVGPathElement;
}

interface CircuitNode {
  el: HTMLElement;
  id: string;
  /** `auto` resolves per layout, so one markup contract works at every width. */
  edge: NodeEdge | 'auto';
  spur: Pipe;
  junction: SVGCircleElement;
  lamp: SVGCircleElement;
  /** Full route path data: the track a packet travels. */
  track: string;
  length: number;
  cooldownUntil: number;
  holdTimer: number;
}

interface CircuitRegion {
  el: HTMLElement;
  name: string;
  source: HTMLElement;
  svg: SVGSVGElement;
  wallLayer: SVGGElement;
  boreLayer: SVGGElement;
  /** Rebuilt on every layout: which fittings a route needs depends on its shape. */
  fittingLayer: SVGGElement;
  packetLayer: SVGGElement;
  trunks: Pipe[];
  measure: SVGPathElement;
  originLamp: SVGCircleElement;
  label: SVGTextElement;
  nodes: CircuitNode[];
  metrics: Metrics;
  energised: boolean;
  visible: boolean;
  heartbeat: number;
  cursor: number;
  sourceHold: number;
  sourceCooldownUntil: number;
  quiet: boolean;
}

const regions: CircuitRegion[] = [];
const reduceMotionQuery =
  typeof window === 'undefined' ? null : window.matchMedia('(prefers-reduced-motion: reduce)');

function reducedMotion(): boolean {
  return reduceMotionQuery?.matches ?? false;
}

let booted = false;
let livePackets = 0;
let syncFrame = 0;
let layoutFrame = 0;

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
    lane: value('--circuit-lane', 30),
    pinGap: value('--circuit-pin-gap', 12),
    bendRadius: value('--circuit-bend-radius', 16),
    minBranch: value('--circuit-min-branch', 16),
    fittingClearance: value('--circuit-fitting-clearance', 14),
    drop: value('--circuit-drop', 38),
    railGap: value('--circuit-rail-gap', 20),
    topLane: value('--circuit-top-lane', 26),
    textRun: value('--circuit-text-run', 30),
    originGap: value('--circuit-origin-gap', 3),
    collarLength: value('--circuit-collar-length', 9),
    collarWeight: value('--circuit-collar-weight', 1),
    teeLength: value('--circuit-tee-length', 11),
    teeSpread: value('--circuit-tee-spread', 5),
    flangeLength: value('--circuit-flange-length', 14),
    flangeWeight: value('--circuit-flange-weight', 2),
    pulseLength: value('--circuit-pulse-length', 26),
    speed: value('--circuit-packet-speed', 1150),
    drawDuration: value('--circuit-draw-duration', 620),
    hold: value('--circuit-node-hold', 520),
    heartbeat: value('--circuit-heartbeat', 5200),
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
function sourceOrigin(source: HTMLElement, regionBox: DOMRect, originGap: number): Point {
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
    x: box.left - regionBox.left + box.width / 2,
    y: textBaseline(box, originGap) - regionBox.top,
  };
}

function buildRegion(el: HTMLElement): CircuitRegion | null {
  const source = el.querySelector<HTMLElement>('[data-circuit-source]');
  const nodeEls = Array.from(el.querySelectorAll<HTMLElement>('[data-circuit-node]'));
  if (!source || nodeEls.length === 0) return null;

  const svg = svgNode('svg', 'circuit');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('preserveAspectRatio', 'none');

  // Walls and bores are grouped rather than paired per run, so a bore is always
  // painted over every wall and crossings keep their section.
  const wallLayer = svgNode('g', 'circuit__walls');
  const boreLayer = svgNode('g', 'circuit__bores');
  const fittingLayer = svgNode('g', 'circuit__fittings');
  const detailLayer = svgNode('g', 'circuit__detail');
  const packetLayer = svgNode('g', 'circuit__packets');
  const measure = svgNode('path', 'circuit__measure');

  const addPipe = (variant: string): Pipe => {
    const wall = svgNode('path', `circuit__wall circuit__wall--${variant}`);
    const bore = svgNode('path', `circuit__bore circuit__bore--${variant}`);
    wallLayer.append(wall);
    boreLayer.append(bore);
    return { wall, bore };
  };

  // Two arms cover every topology busRoute can return: down from the turn, and
  // up when a junction sits above it.
  const trunks = [addPipe('trunk'), addPipe('trunk')];

  const originLamp = svgNode('circle', 'circuit__lamp circuit__lamp--origin');
  originLamp.setAttribute('r', '2.6');
  detailLayer.append(originLamp);

  const label = svgNode('text', 'circuit__label');
  label.textContent = el.dataset.circuit || '';

  const nodes: CircuitNode[] = nodeEls.map((nodeEl, index) => {
    const spur = addPipe('spur');
    const junction = svgNode('circle', 'circuit__junction');
    junction.setAttribute('r', '1.6');
    const lamp = svgNode('circle', 'circuit__lamp');
    lamp.setAttribute('r', '3');
    detailLayer.append(junction, lamp);

    const edge = nodeEl.dataset.circuitEdge;
    return {
      el: nodeEl,
      id: nodeEl.dataset.circuitNode || `node-${index + 1}`,
      edge: edge === 'top' || edge === 'rail' || edge === 'left' ? edge : 'auto',
      spur,
      junction,
      lamp,
      track: '',
      length: 0,
      cooldownUntil: 0,
      holdTimer: 0,
    };
  });

  svg.append(wallLayer, boreLayer, fittingLayer, detailLayer, label, packetLayer, measure);
  el.prepend(svg);

  return {
    el,
    name: el.dataset.circuit || 'BUS',
    source,
    svg,
    wallLayer,
    boreLayer,
    fittingLayer,
    packetLayer,
    trunks,
    measure,
    originLamp,
    label,
    nodes,
    metrics: readMetrics(el),
    energised: false,
    visible: false,
    heartbeat: 0,
    cursor: 0,
    sourceHold: 0,
    sourceCooldownUntil: 0,
    quiet: el.dataset.circuitTone === 'quiet',
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

function localBox(el: Element, regionBox: DOMRect): Box {
  return localRect(el.getBoundingClientRect(), regionBox);
}

/**
 * The box a run attaches to. Text is measured from its first line and squared
 * off at the baseline, so a run meets a label where its underline would sit
 * rather than at the bottom of a block that may have wrapped.
 */
function attachBox(el: HTMLElement, attach: Attach, regionBox: DOMRect, originGap: number): Box {
  if (attach !== 'text') return localBox(el, regionBox);

  const rect = el.getClientRects()[0] ?? el.getBoundingClientRect();
  const box = localRect(rect, regionBox);
  return { ...box, height: textBaseline(rect, originGap) - rect.top };
}

/**
 * What the node presents for a run to land on. `data-circuit-attach` decides it
 * outright; otherwise the flash already says — a node acknowledging on its own
 * top rule is a divider, one acknowledging with an underline is text.
 */
function resolveAttach(el: HTMLElement): Attach {
  const declared = el.dataset.circuitAttach;
  if (declared === 'box' || declared === 'rule' || declared === 'text') return declared;

  const flash = el.dataset.circuitFlash;
  if (flash === 'edge') return 'rule';
  if (flash === 'underline') return 'text';
  return 'box';
}

/**
 * Which way a branch should come in, given where the node actually sits at this
 * width. A node starting at the content edge is approached from just above it,
 * where the lane runs through the page gutter and crosses nothing. A node in a
 * right-hand column has content beside it, so it is fed from the region's rail
 * instead. Responsive by construction: the same node resolves differently once
 * a breakpoint moves it.
 */
function resolveEdge(edge: NodeEdge | 'auto', box: Box, metrics: Metrics): NodeEdge {
  if (edge !== 'auto') return edge;
  return box.left <= metrics.lane * 2 ? 'top' : 'rail';
}

function setPipe(pipe: Pipe, d: string): void {
  pipe.wall.setAttribute('d', d);
  pipe.bore.setAttribute('d', d);
}

/**
 * One fitting bar, drawn across the pipe it dresses. Geometry is authored as if
 * the pipe ran along +x and then rotated onto its real bearing, so a single
 * primitive serves every kind of joint.
 */
function fittingBar(
  fitting: Fitting,
  length: number,
  weight: number,
  along: number,
  variant: string,
): SVGRectElement {
  const bar = svgNode('rect', `circuit__fitting circuit__fitting--${variant}`);
  bar.setAttribute('x', `${round(fitting.at.x + along - weight / 2)}`);
  bar.setAttribute('y', `${round(fitting.at.y - length / 2)}`);
  bar.setAttribute('width', `${round(weight)}`);
  bar.setAttribute('height', `${round(length)}`);
  bar.setAttribute(
    'transform',
    `rotate(${fitting.angle} ${round(fitting.at.x)} ${round(fitting.at.y)})`,
  );
  return bar;
}

/**
 * Dress every joint the route reported. A tee gets a band either side of the
 * split, so a branch reads as tapped into the spine rather than crossing it. A
 * flange is set back by its own thickness: the route ends on the face it serves,
 * so the plate has to sit outside that face rather than sink into it.
 */
function paintFittings(region: CircuitRegion, fittings: readonly Fitting[]): void {
  const { collarLength, collarWeight, teeLength, teeSpread, flangeLength, flangeWeight } =
    region.metrics;

  region.fittingLayer.replaceChildren(
    ...fittings.flatMap((fitting) => {
      if (fitting.kind === 'tee') {
        return [
          fittingBar(fitting, teeLength, collarWeight, -teeSpread, 'tee'),
          fittingBar(fitting, teeLength, collarWeight, teeSpread, 'tee'),
        ];
      }
      if (fitting.kind === 'terminal') {
        return [fittingBar(fitting, flangeLength, flangeWeight, -flangeWeight / 2, 'flange')];
      }
      return [fittingBar(fitting, collarLength, collarWeight, 0, fitting.kind)];
    }),
  );
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

  // The spine runs down the middle of the page gutter, and no further out than
  // one lane. Centring rather than clamping to a minimum edge gap is what keeps
  // the run off the screen edge on tablet and mobile, where the gutter narrows
  // to less than a lane and there is nowhere inboard to put it.
  const spineX = -Math.min(metrics.lane, regionBox.left / 2);
  const railEl = region.el.querySelector<HTMLElement>('[data-circuit-rail]');
  const railY = railEl
    ? localBox(railEl, regionBox).top - metrics.railGap
    : metrics.railGap;

  const specs: RouteSpec[] = region.nodes.map((node) => {
    const attach = resolveAttach(node.el);
    const box = attachBox(node.el, attach, regionBox, metrics.originGap);
    return { id: node.id, edge: resolveEdge(node.edge, box, metrics), box, attach };
  });

  const layout = busRoute(sourceOrigin(region.source, regionBox, metrics.originGap), specs, {
    width: regionBox.width,
    spineX,
    railY,
    topLane: metrics.topLane,
    drop: metrics.drop,
    textRun: metrics.textRun,
    pinGap: metrics.pinGap,
    bendRadius: metrics.bendRadius,
    minBranch: metrics.minBranch,
    fittingClearance: metrics.fittingClearance,
  });

  region.svg.setAttribute('viewBox', `0 0 ${round(regionBox.width)} ${round(regionBox.height)}`);
  region.trunks.forEach((trunk, index) => setPipe(trunk, layout.trunks[index] ?? ''));
  region.originLamp.setAttribute('cx', `${round(layout.origin.x)}`);
  region.originLamp.setAttribute('cy', `${round(layout.origin.y)}`);

  layout.branches.forEach((branch, index) => {
    const node = region.nodes[index];
    if (!node) return;

    setPipe(node.spur, branch.spur);
    node.junction.setAttribute('cx', `${round(branch.junction.x)}`);
    node.junction.setAttribute('cy', `${round(branch.junction.y)}`);
    node.lamp.setAttribute('cx', `${round(branch.terminal.x)}`);
    node.lamp.setAttribute('cy', `${round(branch.terminal.y)}`);

    node.track = branch.d;
    region.measure.setAttribute('d', branch.d);
    node.length = region.measure.getTotalLength();
  });

  paintFittings(region, layout.fittings);

  const labelX = layout.spineX - 8;
  const hasLabelRoom = regionBox.left + labelX >= LABEL_MIN_GUTTER && region.label.textContent !== '';
  region.label.setAttribute('x', `${round(labelX)}`);
  region.label.setAttribute('y', `${round(layout.label.y)}`);
  region.label.setAttribute('transform', `rotate(-90 ${round(labelX)} ${round(layout.label.y)})`);
  region.label.style.display = hasLabelRoom ? '' : 'none';

  paintPipeLengths(region);
}

function pipePaths(region: CircuitRegion): SVGPathElement[] {
  return [region.wallLayer, region.boreLayer]
    .flatMap((layer) => Array.from(layer.querySelectorAll<SVGPathElement>('path')))
    .filter((path) => Boolean(path.getAttribute('d')));
}

/**
 * Pipes are held back by a full dash offset until the bus is energised, then run
 * in once. Re-measured on every layout so a resize cannot leave a stale gap.
 */
function paintPipeLengths(region: CircuitRegion): void {
  for (const path of pipePaths(region)) {
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${round(length)}`;
    path.style.strokeDashoffset = region.energised ? '0' : `${round(length)}`;
  }
}

function drawPipes(region: CircuitRegion): void {
  const paths = pipePaths(region);
  paths.forEach((path, index) => {
    const length = path.getTotalLength();
    path.style.strokeDashoffset = '0';
    if (reducedMotion()) return;
    path.animate(
      { strokeDashoffset: [`${round(length)}`, '0'] },
      {
        duration: region.metrics.drawDuration,
        // Wall then bore, so a run reads as being laid rather than drawn.
        delay: index * 45,
        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        fill: 'backwards',
      },
    );
  });
}

function pulseLamp(lamp: SVGCircleElement, hold: number): void {
  if (reducedMotion()) return;
  lamp.animate(
    [
      { opacity: '0', transform: 'scale(0.4)' },
      { opacity: '1', transform: 'scale(1)', offset: 0.18 },
      { opacity: '0', transform: 'scale(1.9)' },
    ],
    { duration: hold, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
  );
}

function acknowledge(region: CircuitRegion, node: CircuitNode): void {
  node.el.classList.add('is-energised');
  pulseLamp(node.lamp, region.metrics.hold);
  window.clearTimeout(node.holdTimer);
  node.holdTimer = window.setTimeout(() => {
    node.el.classList.remove('is-energised');
  }, region.metrics.hold);

  node.el.dispatchEvent(
    new CustomEvent('circuit:arrive', {
      bubbles: true,
      detail: { bus: region.name, node: node.id },
    }),
  );
}

function acknowledgeSource(region: CircuitRegion): void {
  region.source.classList.add('is-energised');
  pulseLamp(region.originLamp, region.metrics.hold);
  window.clearTimeout(region.sourceHold);
  region.sourceHold = window.setTimeout(() => {
    region.source.classList.remove('is-energised');
  }, region.metrics.hold);
}

function createPacket(track: string, pulse: number, length: number, variant: string): SVGPathElement {
  const packet = svgNode('path', `circuit__packet circuit__packet--${variant}`);
  packet.setAttribute('d', track);
  packet.style.strokeDasharray = `${round(pulse)} ${round(length + pulse * 2)}`;
  return packet;
}

/**
 * Send one packet along a node's route. `out` runs source to node, `back` runs
 * node to source: the feedback a user interaction pushes into the circuit.
 */
function sendPacket(region: CircuitRegion, node: CircuitNode, direction: Direction): void {
  if (reducedMotion() || !region.energised) return;
  if (livePackets >= MAX_LIVE_PACKETS || node.length < 1 || !node.track) return;

  const { pulseLength, speed } = region.metrics;
  const haloPulse = pulseLength * 2.4;
  // Offsetting the halo by its extra length keeps both dashes on one leading
  // edge, so the wider stroke trails the core rather than running ahead of it.
  const trail = haloPulse - pulseLength;

  const core = createPacket(node.track, pulseLength, node.length, 'core');
  const halo = createPacket(node.track, haloPulse, node.length, 'halo');
  region.packetLayer.append(halo, core);
  livePackets += 1;

  const start = direction === 'out' ? pulseLength : -node.length;
  const end = direction === 'out' ? -node.length : pulseLength;
  const duration = Math.min(
    PACKET_MAX_DURATION,
    Math.max(PACKET_MIN_DURATION, ((node.length + pulseLength) / speed) * 1000),
  );
  const timing: KeyframeAnimationOptions = { duration, easing: 'linear', fill: 'forwards' };

  halo.animate({ strokeDashoffset: [`${round(start + trail)}`, `${round(end + trail)}`] }, timing);
  const travel = core.animate(
    { strokeDashoffset: [`${round(start)}`, `${round(end)}`] },
    timing,
  );

  const settle = () => {
    halo.remove();
    core.remove();
    livePackets = Math.max(0, livePackets - 1);
    if (direction === 'out') acknowledge(region, node);
    else acknowledgeSource(region);
  };
  travel.finished.then(settle, settle);
}

function triggerNode(region: CircuitRegion, node: CircuitNode, direction: Direction): void {
  const now = performance.now();
  if (now < node.cooldownUntil) return;
  node.cooldownUntil = now + NODE_COOLDOWN;
  sendPacket(region, node, direction);
}

function triggerSource(region: CircuitRegion): void {
  const now = performance.now();
  if (now < region.sourceCooldownUntil || region.nodes.length === 0) return;
  region.sourceCooldownUntil = now + SOURCE_COOLDOWN;
  const node = region.nodes[region.cursor % region.nodes.length];
  region.cursor += 1;
  if (node) sendPacket(region, node, 'out');
}

function startHeartbeat(region: CircuitRegion): void {
  if (reducedMotion() || region.heartbeat) return;
  const { heartbeat } = region.metrics;
  // Jitter the first beat so buses on one page never fall into lockstep.
  const offset = heartbeat * (0.35 + Math.random() * 0.5);
  region.heartbeat = window.setTimeout(() => {
    region.heartbeat = window.setInterval(() => {
      if (document.hidden || !region.visible || region.nodes.length === 0) return;
      const node = region.nodes[region.cursor % region.nodes.length];
      region.cursor += 1;
      if (node) sendPacket(region, node, 'out');
    }, heartbeat);
  }, offset);
}

function energise(region: CircuitRegion): void {
  if (region.energised) return;
  region.energised = true;
  region.el.classList.add('is-circuit-live');
  drawPipes(region);

  if (reducedMotion()) return;
  if (!region.quiet) window.setTimeout(() => triggerSource(region), region.metrics.drawDuration * 0.55);
  startHeartbeat(region);
}

function wireRegion(region: CircuitRegion): void {
  // A source hover advances one packet around the bus. Sending every branch on
  // each entry made large headings feel like continuous emitters.
  region.source.addEventListener('pointerenter', (event) => {
    if (event.pointerType !== 'touch') triggerSource(region);
  });

  for (const node of region.nodes) {
    const flash = node.el.dataset.circuitFlash;
    if (!flash) node.el.dataset.circuitFlash = 'ring';

    node.el.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'touch') triggerNode(region, node, 'back');
    });
    node.el.addEventListener('focusin', () => triggerNode(region, node, 'back'));
    node.el.addEventListener('click', () => triggerNode(region, node, 'back'));
  }
}

function touchSpineX(clientY: number): number {
  let nearest: { distance: number; x: number } | undefined;

  for (const region of regions) {
    const box = region.el.getBoundingClientRect();
    const distance = clientY < box.top ? box.top - clientY : clientY > box.bottom ? clientY - box.bottom : 0;
    const x = box.left - Math.min(region.metrics.lane, box.left / 2);
    if (!nearest || distance < nearest.distance) nearest = { distance, x };
  }

  return Math.max(0, Math.min(window.innerWidth, nearest?.x ?? 0));
}

/**
 * Touch has no stable hover target. Use its y coordinate as a launch point on
 * the existing left-gutter spine, then send one packet up and one packet down.
 */
function emitTouchPulse(event: PointerEvent): void {
  if (event.pointerType !== 'touch' || !event.isPrimary || reducedMotion()) return;

  const host = document.querySelector<HTMLElement>('.bend-page') ?? document.body;
  const width = window.innerWidth;
  const height = window.innerHeight;
  if (width < 1 || height < 1) return;
  const x = touchSpineX(event.clientY);
  const y = Math.max(0, Math.min(height, event.clientY));

  const svg = svgNode('svg', 'circuit circuit--touch');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('preserveAspectRatio', 'none');

  const routes = [
    { d: `M ${round(x)} ${round(y)} V 0`, length: y },
    { d: `M ${round(x)} ${round(y)} V ${height}`, length: height - y },
  ];
  const packets: Animation[] = [];
  let longestTravel = 0;

  for (const { d, length } of routes) {
    if (length < 1) continue;
    const core = createPacket(d, 24, length, 'core');
    const halo = createPacket(d, 58, length, 'halo');
    svg.append(halo, core);
    const duration = Math.min(PACKET_MAX_DURATION, Math.max(PACKET_MIN_DURATION, length * 1.4));
    longestTravel = Math.max(longestTravel, duration);
    const timing: KeyframeAnimationOptions = { duration, easing: 'linear', fill: 'forwards' };
    packets.push(
      halo.animate({ strokeDashoffset: ['58', `${round(-length)}`] }, timing),
      core.animate({ strokeDashoffset: ['24', `${round(-length)}`] }, timing),
    );
  }

  host.append(svg);
  window.setTimeout(() => {
    packets.forEach((packet) => packet.cancel());
    const fade = svg.animate({ opacity: ['1', '0'] }, { duration: TOUCH_PULSE_FADE, fill: 'forwards' });
    fade.finished.then(() => svg.remove(), () => svg.remove());
  }, Math.max(TOUCH_PULSE_HOLD, longestTravel));
}

function sync(): void {
  syncFrame = 0;
  const viewport = window.innerHeight || 0;
  for (const region of regions) {
    const box = region.el.getBoundingClientRect();
    region.visible = box.top < viewport - VISIBLE_SLACK && box.bottom > VISIBLE_SLACK;
    if (!region.energised && box.top < viewport * ENTER_RATIO && box.bottom > 0) {
      energise(region);
    }
  }
}

function scheduleSync(): void {
  if (!syncFrame) syncFrame = requestAnimationFrame(sync);
}

function scheduleLayout(): void {
  if (layoutFrame) return;
  layoutFrame = requestAnimationFrame(() => {
    layoutFrame = 0;
    for (const region of regions) layoutRegion(region);
    sync();
  });
}

export function initCircuit(): void {
  if (booted || typeof window === 'undefined') return;
  booted = true;

  const found = Array.from(document.querySelectorAll<HTMLElement>('[data-circuit]'));
  for (const el of found) {
    const region = buildRegion(el);
    if (!region) continue;
    regions.push(region);
    wireRegion(region);
  }
  if (regions.length === 0) return;

  // Bend hosts the page in its own scroll container and swaps that element when
  // its canvas activates, so listen in the capture phase rather than binding to
  // a node that may be replaced.
  document.addEventListener('scroll', scheduleSync, { passive: true, capture: true });
  document.addEventListener('pointerdown', emitTouchPulse, { passive: true });
  window.addEventListener('resize', scheduleLayout, { passive: true });
  reduceMotionQuery?.addEventListener('change', scheduleLayout);

  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(scheduleLayout);
    for (const region of regions) observer.observe(region.el);
  }

  // Text metrics decide where every trace starts, so wait for the real faces.
  document.fonts.ready.then(scheduleLayout, scheduleLayout);
}
