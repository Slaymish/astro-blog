import { LOGO_PATHS } from '../site/logo';
import { NAME_FONT, NAME_PATHS } from '../site/namePaths';
import { LETTER_CUES, NAME_STROKES } from '../site/nameMotion';

const NS = 'http://www.w3.org/2000/svg';
type Point = { x: number; y: number };
const SAMPLES = 180;

function sample(d: string): Point[] {
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', d);
  const length = path.getTotalLength();
  return Array.from({ length: SAMPLES }, (_, i) => {
    const p = path.getPointAtLength(length * i / SAMPLES);
    return { x: p.x, y: p.y };
  });
}

/** Rotate and reverse correspondence to keep the contour from twisting. */
function align(source: Point[], target: Point[]): Point[] {
  let best = Infinity;
  let result = source;
  for (const direction of [1, -1]) {
    for (let offset = 0; offset < SAMPLES; offset++) {
      const candidate = target.map((_, i) => source[(offset + direction * i + SAMPLES) % SAMPLES]);
      const score = candidate.reduce((sum, p, i) => sum + (p.x - target[i].x) ** 2 + (p.y - target[i].y) ** 2, 0);
      if (score < best) { best = score; result = candidate; }
    }
  }
  return result;
}

function draw(from: Point[], to: Point[], progress: number): string {
  return from.map((p, i) => {
    const x = p.x + (to[i].x - p.x) * progress;
    const y = p.y + (to[i].y - p.y) * progress;
    return `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join('') + 'Z';
}

/** Split, straighten, write: three distinct beats with authored poses and pen routes. */
export async function initNameMorph(): Promise<void> {
  const heading = document.querySelector<HTMLElement>('[data-name-morph]');
  const svg = heading?.querySelector<SVGSVGElement>('svg');
  if (!heading || !svg || heading.dataset.morph !== 'pending') return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let finished = false;
  let timeout: number | undefined;
  const controller = new AbortController();
  const finish = (): void => {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(frame);
    window.clearTimeout(timeout);
    controller.abort();
    heading.dataset.morph = 'complete';
    window.removeEventListener('resize', finish);
    motion.removeEventListener('change', finish);
  };
  // Listen before awaiting fonts: input during loading must win too.
  window.addEventListener('resize', finish, { once: true, signal: controller.signal });
  motion.addEventListener('change', finish, { once: true, signal: controller.signal });
  for (const event of ['wheel', 'scroll', 'touchstart', 'pointerdown', 'keydown', 'pagehide']) {
    window.addEventListener(event, finish, { passive: true, signal: controller.signal });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) finish();
  }, { signal: controller.signal });
  if (motion.matches || document.hidden || window.scrollY > 0 || location.hash ||
      heading.closest<HTMLElement>('[data-hero-reveal]')?.dataset.reveal === 'revealed') {
    finish();
    return;
  }
  // A failed or delayed font load must never leave the name hidden.
  timeout = window.setTimeout(finish, 5000);
  try {
    await document.fonts.ready;
    if (finished) return;
    const letters = [...heading.querySelectorAll<HTMLElement>('.name-glyph')];
    if (letters.some((el) => !NAME_PATHS[el.textContent ?? ''])) { finish(); return; }
    const box = heading.getBoundingClientRect();
    const size = parseFloat(getComputedStyle(heading).fontSize);
    const scale = size / NAME_FONT.units;
    const logoSize = Math.min(size * 1.35, box.height * 1.5);
    const logoX = (box.width - logoSize) / 2;
    const logoY = (box.height - logoSize) / 2;
    const originals = LOGO_PATHS.map((d) => sample(d).map((p) => ({
      x: logoX + p.x * logoSize / 453.54,
      y: logoY + p.y * logoSize / 453.54,
    })));
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    svg.replaceChildren();
    const clamp = (t: number): number => Math.max(0, Math.min(1, t));
    const out = (t: number): number => 1 - Math.pow(1 - clamp(t), 3);
    const centroid = (points: Point[]): Point => ({
      x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
      y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
    });
    const defs = document.createElementNS(NS, 'defs');
    svg.append(defs);
    const tracks = letters.map((el, index) => {
      const rect = el.getBoundingClientRect();
      const x = rect.left - box.left;
      const baseline = rect.top - box.top + (rect.height - (NAME_FONT.ascent - NAME_FONT.descent) * scale) / 2 + NAME_FONT.ascent * scale;
      const letter = el.textContent ?? '';
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', NAME_PATHS[letter]);
      const group = document.createElementNS(NS, 'g');
      group.setAttribute('transform', `translate(${x} ${baseline}) scale(${scale} ${-scale})`);
      group.append(path);
      svg.append(group);
      if (letter === 'H' || letter === 'B') {
        // The two original pieces travel intact before changing shape.
        group.removeAttribute('transform');
        const word = letter === 'H' ? 0 : 1;
        const targets = (NAME_PATHS[letter].match(/M[^M]+/g) ?? []).map((d) =>
          sample(d).map((p) => ({ x: x + p.x * scale, y: baseline - p.y * scale })));
        const areas = targets.map((points) => Math.abs(points.reduce((a, p, i) => {
          const q = points[(i + 1) % points.length];
          return a + p.x * q.y - q.x * p.y;
        }, 0)));
        const outer = areas.indexOf(Math.max(...areas));
        const targetCenter = centroid(targets[outer]);
        const sourceCenter = centroid(originals[word]);
        const delta = { x: targetCenter.x - sourceCenter.x, y: targetCenter.y - sourceCenter.y };
        const upright = originals[word].map((p) => ({
          x: p.x + delta.x + (p.y - sourceCenter.y) * 0.165,
          y: p.y + delta.y,
        }));
        const contours = targets.map((to, i) => ({
          from: i === outer ? align(upright, to) : to.map(() => targetCenter), to,
        }));
        return { paint(elapsed: number): void {
          const split = out((elapsed - 430 - word * 65) / (word ? 510 : 430));
          const straighten = out((elapsed - 990 - word * 90) / 300);
          const anticipation = elapsed < 430 ? Math.sin(clamp((elapsed - 290) / 140) * Math.PI) : 0;
          if (straighten === 0) {
            // A small compression precedes a quick outward release.
            const points = originals[word].map((p) => ({
              x: p.x + delta.x * split + (p.y - sourceCenter.y) * 0.165 * split,
              y: sourceCenter.y + (p.y - sourceCenter.y) * (1 - anticipation * 0.035) + delta.y * split,
            }));
            path.setAttribute('d', draw(points, points, 0));
          } else if (straighten < 1) {
            path.setAttribute('d', contours.map((c) => draw(c.from, c.to, straighten)).join(''));
          } else {
            path.setAttribute('d', NAME_PATHS[letter]);
            const settle = Math.sin(clamp((elapsed - 1290 - word * 90) / 220) * Math.PI) * size * 0.025;
            group.setAttribute('transform', `translate(${x} ${baseline - settle}) scale(${scale} ${-scale})`);
          }
        } };
      }
      const mask = document.createElementNS(NS, 'mask');
      const id = `name-pen-${index}`;
      mask.setAttribute('id', id);
      mask.setAttribute('maskUnits', 'userSpaceOnUse');
      mask.setAttribute('x', '-200');
      mask.setAttribute('y', '-200');
      mask.setAttribute('width', '1400');
      mask.setAttribute('height', '1200');
      mask.setAttribute('mask-type', 'alpha');
      defs.append(mask);
      path.setAttribute('mask', `url(#${id})`);
      const strokes = NAME_STROKES[letter].map((cue) => {
        const pen = document.createElementNS(NS, 'path');
        pen.setAttribute('d', cue.d);
        pen.setAttribute('fill', 'none');
        pen.setAttribute('stroke', 'currentColor');
        pen.setAttribute('stroke-width', '170');
        pen.setAttribute('stroke-linecap', 'round');
        pen.setAttribute('stroke-linejoin', 'round');
        mask.append(pen);
        const length = pen.getTotalLength();
        pen.setAttribute('stroke-dasharray', `${length} ${length + 1}`);
        pen.setAttribute('stroke-dashoffset', String(length + 1));
        return { pen, length, cue };
      });
      return { paint(elapsed: number): void {
        const local = elapsed - LETTER_CUES[index];
        for (const { pen, length, cue } of strokes) {
          const progress = out((local - cue.start) / cue.duration);
          pen.setAttribute('visibility', progress > 0 ? 'visible' : 'hidden');
          pen.setAttribute('stroke-dashoffset', String((length + 1) * (1 - progress)));
        }
        // Once the last stroke lands, use the exact outline without a mask.
        if (strokes.every(({ cue }) => local >= cue.start + cue.duration)) path.removeAttribute('mask');
      } };
    });
    const paint = (elapsed: number): void => tracks.forEach((track) => track.paint(elapsed));
    paint(0);
    const start = performance.now();
    const tick = (now: number): void => {
      if (finished) return;
      const elapsed = now - start;
      paint(elapsed);
      if (elapsed >= 2650) finish();
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  } catch {
    finish();
  }
}
