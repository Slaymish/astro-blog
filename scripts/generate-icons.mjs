/**
 * Generates every icon the markup promises, from the one copy of the logo
 * geometry in src/site/logo.ts. Run with `pnpm run icons` after changing the
 * mark; the output is committed.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { LOGO_PATHS, LOGO_VIEWBOX } from '../src/site/logo.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');

/** --color-ink-950 and --color-paper-100 from src/styles/tokens.css. */
const INK = '#0b0d0c';
const PAPER = '#f6f7f3';

const paths = (fill) => LOGO_PATHS.map((d) => `<path fill="${fill}" d="${d}"/>`).join('');

/** The favicon inverts itself in a dark UI; everything else is baked. */
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LOGO_VIEWBOX}">\
<style>@media (prefers-color-scheme: dark){path{fill:#f2f5ef}}</style>\
${paths(INK)}</svg>`;

/** A square mark on a paper ground, the logo inset to `scale` of the box. */
function markOn(size, scale, fill) {
  const inset = Math.round((size * (1 - scale)) / 2);
  const box = size - inset * 2;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
      `<rect width="${size}" height="${size}" fill="${PAPER}"/>` +
      `<svg x="${inset}" y="${inset}" width="${box}" height="${box}" viewBox="${LOGO_VIEWBOX}">${paths(fill)}</svg>` +
      `</svg>`,
  );
}

/** The Open Graph card: the mark centred on a 1200x630 paper ground. */
function ogCard(width, height, mark) {
  const x = Math.round((width - mark) / 2);
  const y = Math.round((height - mark) / 2);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
      `<rect width="${width}" height="${height}" fill="${PAPER}"/>` +
      `<svg x="${x}" y="${y}" width="${mark}" height="${mark}" viewBox="${LOGO_VIEWBOX}">${paths(INK)}</svg>` +
      `</svg>`,
  );
}

await mkdir(publicDir, { recursive: true });
await writeFile(join(publicDir, 'favicon.svg'), faviconSvg);

const png = (buffer, name, width, height = width) =>
  sharp(buffer).resize(width, height).png({ compressionLevel: 9 }).toFile(join(publicDir, name));

await png(markOn(180, 0.7, INK), 'apple-touch-icon.png', 180);
await png(markOn(192, 0.7, INK), 'icon-192.png', 192);
await png(markOn(512, 0.7, INK), 'icon-512.png', 512);
await png(ogCard(1200, 630, 360), 'og-default.png', 1200, 630);

console.log('Wrote favicon.svg, apple-touch-icon.png, icon-192.png, icon-512.png, og-default.png');
