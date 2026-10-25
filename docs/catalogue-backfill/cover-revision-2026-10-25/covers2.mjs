/**
 * Cover marks, revision 2026-10-25.
 *
 * Supersedes the 2026-10-10 backfill diagrams for the seventeen projects that have no
 * usable artefact to photograph. That template read as an explainer: a "PROJECT
 * DIAGRAM" label, three numbered boxes, arrows, and a footer disclaimer. This one
 * draws a single mark per project, derived from what the project actually does, with
 * no text, no numbering and no arrows, in the site's own palette.
 *
 * Each mark is an SVG at 1600x900, rasterised with sharp next to this file.
 *
 *   node covers2.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const W = 1600;
const H = 900;
const PAPER = '#fdfdfb';
const INK = '#10130f';
const MUTED = '#545c52';
const LINE = '#b0b6ab';
const ACCENT = '#b4442a';

const r = (n) => Math.round(n * 100) / 100;
const el = (tag, attrs, children = '') =>
  `<${tag} ${Object.entries(attrs)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}="${typeof v === 'number' ? r(v) : v}"`)
    .join(' ')}${children ? `>${children}</${tag}>` : ' />'}`;
const line = (x1, y1, x2, y2, stroke = INK, w = 3) =>
  el('line', { x1, y1, x2, y2, stroke, 'stroke-width': w, 'stroke-linecap': 'square' });
const rect = (x, y, w, h, fill = 'none', stroke = INK, sw = 3, radius = 0) =>
  el('rect', { x, y, width: w, height: h, rx: radius, fill, stroke, 'stroke-width': sw });
const circle = (cx, cy, rr, fill = 'none', stroke = 'none', sw = 0) =>
  el('circle', { cx, cy, r: rr, fill, stroke, 'stroke-width': sw });
const path2 = (d, fill = 'none', stroke = INK, sw = 3) =>
  el('path', { d, fill, stroke, 'stroke-width': sw, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });

const marks = {
  // A stats table read through an API: rows of cells, one player's row picked out.
  'echo-stats-finder': () => {
    let out = '';
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 4; col++) {
        const picked = row === 2;
        out += rect(340 + col * 200, 290 + row * 74, 168, 50, picked ? ACCENT : 'none', picked ? ACCENT : LINE, 4, 4);
      }
    }
    return out;
  },

  // Watzon speaks VRML: a wireframe solid with one facet filled.
  watzon: () => {
    const cx = 800;
    const cy = 450;
    const R = 260;
    const verts = [];
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI / 4) * i + Math.PI / 8;
      verts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R * 0.42]);
    }
    const top = [cx, cy - 230];
    const bottom = [cx, cy + 230];
    let out = path2(`M ${top.map((v) => r(v)).join(' ')} L ${r(verts[6][0])} ${r(verts[6][1])} L ${r(verts[7][0])} ${r(verts[7][1])} Z`, ACCENT, ACCENT, 0);
    for (const v of verts) {
      out += line(top[0], top[1], v[0], v[1], LINE, 3);
      out += line(bottom[0], bottom[1], v[0], v[1], LINE, 3);
    }
    for (let i = 0; i < verts.length; i++) {
      const a = verts[i];
      const b = verts[(i + 1) % verts.length];
      out += line(a[0], a[1], b[0], b[1], INK, 4.5);
    }
    return out;
  },

  // A photo slider: three frames fanned out, the front one printed.
  'finlay-lani-wedding': () => {
    let out = '';
    const frames = [
      [500, 350, 380, 250],
      [590, 310, 380, 250],
      [680, 270, 380, 250],
    ];
    frames.forEach(([x, y, w, h], i) => {
      const front = i === 2;
      out += rect(x, y, w, h, front ? ACCENT : PAPER, front ? ACCENT : INK, front ? 0 : 4);
    });
    return out;
  },

  // A calendar with a transit plan drawn across it.
  'transit-sync': () => {
    let out = '';
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 7; col++) {
        const x = 430 + col * 106;
        const y = 260 + row * 80;
        out += rect(x, y, 86, 60, 'none', LINE, 3, 4);
      }
    }
    const route = [
      [473, 290],
      [579, 370],
      [685, 370],
      [791, 450],
      [1003, 450],
    ];
    out += path2(`M ${route.map((p) => p.join(' ')).join(' L ')}`, 'none', INK, 6);
    out += circle(473, 290, 18, ACCENT);
    out += circle(1003, 450, 18, ACCENT);
    return out;
  },

  // Two revisions side by side: the changed lines sit one step lower.
  'typed-diff-questions': () => {
    let out = '';
    const rowH = 34;
    const gap = 14;
    const top = 260;
    const leftX = 540;
    const rightX = 880;
    const widths = [200, 150, 190, 165, 205, 140, 175];
    widths.forEach((w, i) => {
      const y = top + i * (rowH + gap);
      const changed = i === 3 || i === 4;
      out += rect(leftX, y, changed ? w * 0.55 : w, rowH, 'none', LINE, 2.5, 3);
      out += rect(rightX, y + (changed ? 18 : 0), w, rowH, changed ? ACCENT : 'none', changed ? ACCENT : LINE, changed ? 0 : 2.5, 3);
    });
    return out;
  },

  // A transport graph.
  'wellington-transport-network': () => {
    const nodes = [
      [420, 320], [560, 480], [680, 260], [700, 560], [840, 380],
      [980, 300], [1000, 520], [1130, 420], [1240, 330],
    ];
    const edges = [[0, 1], [0, 2], [1, 3], [2, 4], [3, 4], [2, 5], [4, 5], [4, 6], [5, 7], [6, 7], [7, 8], [5, 8]];
    let out = '';
    for (const [a, b] of edges) out += line(nodes[a][0], nodes[a][1], nodes[b][0], nodes[b][1], LINE, 2.5);
    nodes.forEach(([x, y], i) => {
      out += i === 4 ? circle(x, y, 13, ACCENT) : circle(x, y, 9, INK);
    });
    return out;
  },

  // A floor plan and the volume it becomes.
  'floor-plan-importer': () => {
    const plan = 'M 420 420 L 420 260 L 720 260 L 720 340 L 1040 340 L 1040 560 L 640 560 L 640 420 Z';
    const shift = (d, dx, dy) =>
      d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_m, x, y) => `${r(Number(x) + dx)} ${r(Number(y) + dy)}`);
    let out = path2(shift(plan, 110, -90), PAPER, LINE, 3);
    out += path2(plan, PAPER, INK, 5);
    out += path2('M 720 260 L 720 420 L 640 420 L 640 260 Z', ACCENT, ACCENT, 0);
    return out;
  },

  // An envelope over a keyboard.
  'piano-waveform-visualiser': () => {
    let d = '';
    for (let x = 330; x <= 1270; x += 2) {
      const t = (x - 330) / 940;
      const env = Math.exp(-3.1 * ((t - 0.28) ** 2)) + 0.55 * Math.exp(-7 * ((t - 0.62) ** 2));
      const y = 400 - env * 210 * Math.sin(t * Math.PI * 22);
      d += `${x === 330 ? 'M' : 'L'} ${x} ${r(y)} `;
    }
    let out = path2(d, 'none', ACCENT, 3.4);
    for (let i = 0; i < 10; i++) {
      out += rect(370 + i * 100, 560, 84, 130, i === 4 ? INK : 'none', i === 4 ? INK : LINE, 3, 4);
    }
    return out;
  },

  // A step sequencer: four tracks, eight steps.
  groovebox: () => {
    let out = '';
    const hits = [[0, 2, 4, 6], [2, 6], [0, 1, 2, 3, 4, 5, 6, 7], [7]];
    hits.forEach((track, row) => {
      for (let step = 0; step < 8; step++) {
        const on = track.includes(step);
        const accent = row === 1 && on;
        out += rect(400 + step * 104, 290 + row * 86, 78, 56, on ? (accent ? ACCENT : INK) : 'none', on ? 'none' : LINE, 3, 3);
      }
    });
    return out;
  },

  // CLIP embeddings, clustered: five groups on an even arc.
  'pinterest-aesthetic-analysis': () => {
    const clusters = [
      [470, 520],
      [610, 360],
      [790, 290],
      [980, 360],
      [1120, 520],
    ];
    let out = '';
    clusters.forEach(([cx, cy], i) => {
      const phase = (Math.PI / 3) * (i % 2) + 0.4 * i;
      for (let k = 0; k < 5; k++) {
        const a = phase + (Math.PI * 2 * k) / 5;
        out += circle(cx + Math.cos(a) * 62, cy + Math.sin(a) * 62, 11, INK);
      }
      out += circle(cx, cy, 24, ACCENT);
    });
    return out;
  },

  // Playlist demographics: a polar spread of one artist's reach.
  'spotify-playlist-demographics': () => {
    let out = '';
    const cx = 800;
    const cy = 460;
    const values = [0.92, 0.55, 0.74, 0.38, 0.66, 0.84, 0.46, 0.6, 0.71, 0.32, 0.58, 0.79];
    values.forEach((v, i) => {
      const a0 = (Math.PI * 2 * i) / values.length + 0.02;
      const a1 = (Math.PI * 2 * (i + 1)) / values.length - 0.02;
      const rOuter = 120 + v * 190;
      const accent = i === 0;
      const x0 = cx + Math.cos(a0) * 120;
      const y0 = cy + Math.sin(a0) * 120;
      const x1 = cx + Math.cos(a0) * rOuter;
      const y1 = cy + Math.sin(a0) * rOuter;
      const x2 = cx + Math.cos(a1) * rOuter;
      const y2 = cy + Math.sin(a1) * rOuter;
      const x3 = cx + Math.cos(a1) * 120;
      const y3 = cy + Math.sin(a1) * 120;
      out += path2(
        `M ${r(x0)} ${r(y0)} L ${r(x1)} ${r(y1)} A ${r(rOuter)} ${r(rOuter)} 0 0 1 ${r(x2)} ${r(y2)} L ${r(x3)} ${r(y3)} A 120 120 0 0 0 ${r(x0)} ${r(y0)} Z`,
        accent ? ACCENT : 'none',
        accent ? ACCENT : INK,
        2.4,
      );
    });
    return out;
  },

  // A bank ledger landing in a spreadsheet: two grids, the second shifted a row.
  'bank-to-sheets-sync': () => {
    let out = '';
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        out += rect(330 + col * 152, 300 + row * 82, 128, 56, 'none', INK, 3.5, 3);
      }
    }
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        const lit = col === 2 && row > 0;
        out += rect(900 + col * 152, 300 + (row - 1) * 82, 128, 56, lit ? ACCENT : 'none', lit ? ACCENT : LINE, 3, 3);
      }
    }
    out += path2('M 800 380 H 872 M 858 368 L 872 380 L 858 392', 'none', INK, 4);
    return out;
  },

  // A departures board, a few services called.
  'metlink-departures-display': () => {
    let out = '';
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 4; col++) {
        const lit = (row === 0 && col === 3) || (row === 2 && col === 1) || (row === 4 && col === 0);
        out += rect(330 + col * 246, 250 + row * 84, 206, 56, lit ? ACCENT : 'none', lit ? ACCENT : LINE, 2, 3);
      }
    }
    return out;
  },

  // One bill, one share carved out of it.
  'flat-power-calculator': () => {
    const total = 760;
    const share = total * 0.34;
    return (
      rect(420, 380, total, 100, 'none', INK, 3, 4) +
      rect(420, 380, share, 100, ACCENT, ACCENT, 0, 4) +
      line(420 + share, 380, 420 + share, 480, INK, 2.5) +
      line(420 + share, 330, 420 + share, 560, LINE, 2)
    );
  },

  // A server asleep until someone joins: a block of world, one cube lit.
  'wake-on-join-minecraft': () => {
    const w = 150;
    const h = 87;
    const centre = 800;
    const cubes = [];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (i === 2 && j === 2) continue; // ragged edge, so it reads as terrain
        cubes.push({ i, j, k: 0, lit: false });
      }
    }
    cubes.push({ i: 1, j: 1, k: 1, lit: true });
    cubes.sort((a, b) => a.i + a.j - (b.i + b.j) || a.k - b.k);

    const poly = (pts, fill, stroke = INK, sw = 7) =>
      path2(`M ${pts.map(([x, y]) => `${r(x)} ${r(y)}`).join(' L ')} Z`, fill, stroke, sw);

    let out = '';
    for (const { i, j, k, lit } of cubes) {
      const px = centre + (i - j) * w;
      const py = 120 + (i + j) * h - k * 2 * h;
      const top = [[px, py], [px + w, py + h], [px, py + 2 * h], [px - w, py + h]];
      const left = [[px - w, py + h], [px, py + 2 * h], [px, py + 4 * h], [px - w, py + 3 * h]];
      const right = [[px + w, py + h], [px, py + 2 * h], [px, py + 4 * h], [px + w, py + 3 * h]];
      out += poly(left, lit ? ACCENT : PAPER);
      out += poly(right, lit ? ACCENT : PAPER);
      out += poly(top, lit ? ACCENT : PAPER);
    }
    return out;
  },

  // A grid world with an agent's path through it.
  'sentient-environment-explorer': () => {
    let out = '';
    const cw = 116;
    const ch = 76;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 7; col++) {
        out += rect(370 + col * cw, 280 + row * ch, cw - 16, ch - 18, 'none', LINE, 3, 3);
      }
    }
    const pathPoints = [
      [408, 308], [524, 308], [524, 384], [640, 384],
      [640, 460], [756, 460], [756, 536], [872, 536],
    ];
    out += path2(`M ${pathPoints.map((p) => p.join(' ')).join(' L ')}`, 'none', ACCENT, 7);
    out += rect(846, 510, 52, 52, ACCENT, ACCENT, 0, 3);
    return out;
  },

  // A box of photographs, seen in perspective.
  'birthday-gallery': () => {
    const front = [[480, 330], [1120, 330], [1120, 640], [480, 640]];
    const back = front.map(([x, y]) => [x + 90, y - 90]);
    let out = path2(`M ${front.map((p) => p.join(' ')).join(' L ')} Z`, 'none', INK, 3);
    out += path2(`M ${back.map((p) => p.join(' ')).join(' L ')} Z`, 'none', LINE, 2.5);
    for (let i = 0; i < 4; i++) out += line(front[i][0], front[i][1], back[i][0], back[i][1], LINE, 2);
    for (let col = 0; col < 3; col++) {
      for (let row = 0; row < 2; row++) {
        const x = 520 + col * 210;
        const y = 380 + row * 130;
        out += rect(x, y, 180, 104, (col === 1 && row === 0) ? ACCENT : 'none', (col === 1 && row === 0) ? ACCENT : LINE, 2, 2);
      }
    }
    return out;
  },
};

const wrapInk = (inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${inner}</svg>`;

/** Trim to the ink, then fit the mark to a box so every cover has a similar weight. */
async function compose(inner) {
  const ink = await sharp(Buffer.from(wrapInk(inner))).png().toBuffer();
  const trimmed = await sharp(ink).trim({ threshold: 4 }).png().toBuffer({ resolveWithObject: true });
  const boxW = 1180;
  const boxH = 620;
  const scale = Math.min(boxW / trimmed.info.width, boxH / trimmed.info.height);
  const w = Math.round(trimmed.info.width * scale);
  const h = Math.round(trimmed.info.height * scale);
  const mark = await sharp(trimmed.data).resize(w, h, { fit: 'fill' }).png().toBuffer();
  return sharp({ create: { width: W, height: H, channels: 4, background: PAPER } })
    .composite([{ input: mark, top: Math.round((H - h) / 2), left: Math.round((W - w) / 2) }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

const outDir = path.join(path.dirname(new URL(import.meta.url).pathname), 'diagrams');
await fs.mkdir(outDir, { recursive: true });

const written = [];
for (const [slug, draw] of Object.entries(marks)) {
  const inner = draw();
  await fs.writeFile(path.join(outDir, `${slug}.svg`), wrapInk(inner));
  const png = await compose(inner);
  const pngPath = path.join(outDir, `${slug}.png`);
  await fs.writeFile(pngPath, png);
  written.push(pngPath);
}
console.log(`wrote ${written.length} covers to ${outDir}`);
