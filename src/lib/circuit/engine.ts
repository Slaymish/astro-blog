/**
 * CIRCUIT ENGINE
 *
 * Wires DOM elements together with a data bus: a trace overlay that routes from
 * a source to a set of nodes, packets that travel those routes, and an
 * acknowledgement on the node each packet reaches.
 *
 * Markup contract:
 *
 *   <section data-circuit="BUS_01">
 *     <p data-circuit-source>…</p>
 *     <div data-circuit-rail>…</div>
 *     <a data-circuit-node="book" data-circuit-edge="rail" data-circuit-flash="ring">…</a>
 *   </section>
 *
 * data-circuit-edge  left | top | rail   (see geometry.ts, default left)
 * data-circuit-flash ring | edge | underline  (see circuit.css, default ring)
 * data-circuit-rail  marks the element whose top defines the rail lane.
 *
 * Every node dispatches a bubbling `circuit:arrive` event when a packet lands.
 */

import { busRoute, type Box, type NodeEdge, type Point, type RouteSpec } from './geometry';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Ceiling on packets in flight document-wide. The bus stays legible, not busy. */
const MAX_LIVE_PACKETS = 6;
/** Minimum spacing between two packets triggered on the same node. */
const NODE_COOLDOWN = 420;
/** Gap between packets in a sequence, so arrivals read in order. */
const SEQUENCE_STAGGER = 150;
/** A region goes live once its top reaches this fraction of the viewport. */
const ENTER_RATIO = 0.86;
/** Viewport pixels of a region that must be showing for its heartbeat to run. */
const VISIBLE_SLACK = 40;
/** Space needed left of the spine before a bus label is worth drawing. */
const LABEL_MIN_GUTTER = 16;
const PACKET_MIN_DURATION = 200;
const PACKET_MAX_DURATION = 1500;

type Direction = 'out' | 'back';

interface Metrics {
  lane: number;
  edgeGap: number;
  pinGap: number;
  bendRadius: number;
  minBranch: number;
  drop: number;
  railGap: number;
  topLane: number;
  pulseLength: number;
  speed: number;
  drawDuration: number;
  hold: number;
  heartbeat: number;
}

interface CircuitNode {
  el: HTMLElement;
  id: string;
  /** `auto` resolves per layout, so one markup contract works at every width. */
  edge: NodeEdge | 'auto';
  spur: SVGPathElement;
  junction: SVGCircleElement;
  tick: SVGRectElement;
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
  traceLayer: SVGGElement;
  packetLayer: SVGGElement;
  trunks: SVGPathElement[];
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
    lane: value('--circuit-lane', 28),
    edgeGap: value('--circuit-edge-gap', 4),
    pinGap: value('--circuit-pin-gap', 10),
    bendRadius: value('--circuit-bend-radius', 8),
    minBranch: value('--circuit-min-branch', 14),
    drop: value('--circuit-drop', 34),
    railGap: value('--circuit-rail-gap', 16),
    topLane: value('--circuit-top-lane', 16),
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
 * Where the trace leaves the source. Anchored to the final glyph rather than the
 * element box, so a trace leaving a word starts under its last character even
 * when the text wraps.
 */
function sourceOrigin(source: HTMLElement, regionBox: DOMRect): Point {
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
    // The glyph box bottom sits below the baseline; lift back onto it.
    y: box.bottom - regionBox.top - box.height * 0.22,
  };
}

function buildRegion(el: HTMLElement): CircuitRegion | null {
  const source = el.querySelector<HTMLElement>('[data-circuit-source]');
  const nodeEls = Array.from(el.querySelectorAll<HTMLElement>('[data-circuit-node]'));
  if (!source || nodeEls.length === 0) return null;

  const svg = svgNode('svg', 'circuit');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('preserveAspectRatio', 'none');

  const traceLayer = svgNode('g', 'circuit__trace');
  const detailLayer = svgNode('g', 'circuit__detail');
  const packetLayer = svgNode('g', 'circuit__packets');
  const measure = svgNode('path', 'circuit__measure');

  // Two arms cover every topology busRoute can return: down from the turn, and
  // up when a junction sits above it.
  const trunks = [svgNode('path', 'circuit__trunk'), svgNode('path', 'circuit__trunk')];
  trunks.forEach((trunk) => traceLayer.append(trunk));

  const originLamp = svgNode('circle', 'circuit__lamp circuit__lamp--origin');
  originLamp.setAttribute('r', '2.6');
  detailLayer.append(originLamp);

  const label = svgNode('text', 'circuit__label');
  label.textContent = el.dataset.circuit || '';

  const nodes: CircuitNode[] = nodeEls.map((nodeEl, index) => {
    const spur = svgNode('path', 'circuit__spur');
    const junction = svgNode('circle', 'circuit__junction');
    junction.setAttribute('r', '1.8');

    // The tick is the terminal pin; the lamp over it lights on arrival.
    const tick = svgNode('rect', 'circuit__pin-tick');
    const lamp = svgNode('circle', 'circuit__lamp');
    lamp.setAttribute('r', '2.6');

    traceLayer.append(spur);
    detailLayer.append(junction, tick, lamp);

    const edge = nodeEl.dataset.circuitEdge;
    return {
      el: nodeEl,
      id: nodeEl.dataset.circuitNode || `node-${index + 1}`,
      edge: edge === 'top' || edge === 'rail' || edge === 'left' ? edge : 'auto',
      spur,
      junction,
      tick,
      lamp,
      track: '',
      length: 0,
      cooldownUntil: 0,
      holdTimer: 0,
    };
  });

  svg.append(traceLayer, detailLayer, label, packetLayer, measure);
  el.prepend(svg);

  return {
    el,
    name: el.dataset.circuit || 'BUS',
    source,
    svg,
    traceLayer,
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
  };
}

function localBox(el: Element, regionBox: DOMRect): Box {
  const box = el.getBoundingClientRect();
  return {
    left: box.left - regionBox.left,
    top: box.top - regionBox.top,
    width: box.width,
    height: box.height,
  };
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

function layoutRegion(region: CircuitRegion): void {
  // Measure against the overlay, not the region: as an absolutely positioned
  // child the overlay fills its region's padding box, and every coordinate the
  // routing produces has to share that frame. Regions with generous vertical
  // padding (the contact band) would otherwise be offset by it.
  const regionBox = region.svg.getBoundingClientRect();
  if (regionBox.width < 1 || regionBox.height < 1) return;

  const metrics = readMetrics(region.el);
  region.metrics = metrics;

  // The spine runs in the page gutter, pulled in only far enough to stay on
  // screen on narrow viewports.
  const spineX = Math.max(metrics.edgeGap - regionBox.left, -metrics.lane);
  const railEl = region.el.querySelector<HTMLElement>('[data-circuit-rail]');
  const railY = railEl
    ? localBox(railEl, regionBox).top - metrics.railGap
    : metrics.railGap;

  const specs: RouteSpec[] = region.nodes.map((node) => {
    const box = localBox(node.el, regionBox);
    return { id: node.id, edge: resolveEdge(node.edge, box, metrics), box };
  });

  const layout = busRoute(sourceOrigin(region.source, regionBox), specs, {
    width: regionBox.width,
    spineX,
    railY,
    topLane: metrics.topLane,
    drop: metrics.drop,
    pinGap: metrics.pinGap,
    bendRadius: metrics.bendRadius,
    minBranch: metrics.minBranch,
  });

  region.svg.setAttribute('viewBox', `0 0 ${round(regionBox.width)} ${round(regionBox.height)}`);
  region.trunks.forEach((trunk, index) => trunk.setAttribute('d', layout.trunks[index] ?? ''));
  region.originLamp.setAttribute('cx', `${round(layout.origin.x)}`);
  region.originLamp.setAttribute('cy', `${round(layout.origin.y)}`);

  layout.branches.forEach((branch, index) => {
    const node = region.nodes[index];
    if (!node) return;

    node.spur.setAttribute('d', branch.spur);
    node.junction.setAttribute('cx', `${round(branch.junction.x)}`);
    node.junction.setAttribute('cy', `${round(branch.junction.y)}`);

    // The pin tick is drawn across the axis the branch arrives along.
    const across = branch.axis === 'x';
    node.tick.setAttribute('x', `${round(branch.terminal.x - (across ? 0.5 : 4))}`);
    node.tick.setAttribute('y', `${round(branch.terminal.y - (across ? 4 : 0.5))}`);
    node.tick.setAttribute('width', across ? '1' : '8');
    node.tick.setAttribute('height', across ? '8' : '1');
    node.lamp.setAttribute('cx', `${round(branch.terminal.x)}`);
    node.lamp.setAttribute('cy', `${round(branch.terminal.y)}`);

    node.track = branch.d;
    region.measure.setAttribute('d', branch.d);
    node.length = region.measure.getTotalLength();
  });

  const labelX = layout.spineX - 4;
  const hasLabelRoom = regionBox.left + labelX >= LABEL_MIN_GUTTER && region.label.textContent !== '';
  region.label.setAttribute('x', `${round(labelX)}`);
  region.label.setAttribute('y', `${round(layout.label.y)}`);
  region.label.setAttribute('transform', `rotate(-90 ${round(labelX)} ${round(layout.label.y)})`);
  region.label.style.display = hasLabelRoom ? '' : 'none';

  paintTraceLengths(region);
}

function tracePaths(region: CircuitRegion): SVGPathElement[] {
  return Array.from(region.traceLayer.querySelectorAll<SVGPathElement>('path')).filter((path) =>
    Boolean(path.getAttribute('d')),
  );
}

/**
 * Traces are hidden by a full dash offset until the bus is energised, then drawn
 * in once. Re-measured on every layout so a resize cannot leave a stale gap.
 */
function paintTraceLengths(region: CircuitRegion): void {
  for (const path of tracePaths(region)) {
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${round(length)}`;
    path.style.strokeDashoffset = region.energised ? '0' : `${round(length)}`;
  }
}

function drawTraces(region: CircuitRegion): void {
  const paths = tracePaths(region);
  paths.forEach((path, index) => {
    const length = path.getTotalLength();
    path.style.strokeDashoffset = '0';
    if (reducedMotion()) return;
    path.animate(
      { strokeDashoffset: [`${round(length)}`, '0'] },
      {
        duration: region.metrics.drawDuration,
        delay: index * 60,
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

function sequence(region: CircuitRegion, nodes: CircuitNode[], direction: Direction): void {
  nodes.forEach((node, index) => {
    if (index === 0) {
      sendPacket(region, node, direction);
      return;
    }
    window.setTimeout(() => sendPacket(region, node, direction), index * SEQUENCE_STAGGER);
  });
}

function triggerNode(region: CircuitRegion, node: CircuitNode, direction: Direction): void {
  const now = performance.now();
  if (now < node.cooldownUntil) return;
  node.cooldownUntil = now + NODE_COOLDOWN;
  sendPacket(region, node, direction);
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
  drawTraces(region);

  if (reducedMotion()) return;
  window.setTimeout(
    () => sequence(region, region.nodes, 'out'),
    region.metrics.drawDuration * 0.55,
  );
  startHeartbeat(region);
}

function wireRegion(region: CircuitRegion): void {
  // Interacting with the source pushes work outward to everything it feeds.
  region.source.addEventListener('pointerenter', () => sequence(region, region.nodes, 'out'));

  for (const node of region.nodes) {
    const flash = node.el.dataset.circuitFlash;
    if (!flash) node.el.dataset.circuitFlash = 'ring';

    node.el.addEventListener('pointerenter', () => triggerNode(region, node, 'back'));
    node.el.addEventListener('focusin', () => triggerNode(region, node, 'back'));
    node.el.addEventListener('click', () => {
      triggerNode(region, node, 'back');
      sequence(
        region,
        region.nodes.filter((sibling) => sibling !== node),
        'out',
      );
    });
  }
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
  window.addEventListener('resize', scheduleLayout, { passive: true });
  reduceMotionQuery?.addEventListener('change', scheduleLayout);

  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(scheduleLayout);
    for (const region of regions) observer.observe(region.el);
  }

  // Text metrics decide where every trace starts, so wait for the real faces.
  document.fonts.ready.then(scheduleLayout, scheduleLayout);
}
