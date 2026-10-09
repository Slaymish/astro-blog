/**
 * Serves the static half of a production build for local review, because
 * `astro preview` is not supported by the Netlify adapter.
 *
 *   pnpm run build && pnpm run preview
 *
 * Resolves `/about` to `dist/about.html` the way Netlify's pretty URLs do for
 * `build.format: 'file'`, and answers anything else with the 404 page. The
 * server routes (`prerender = false`), the netlify.toml redirects and the
 * markdown edge function do not run here; check those on a deploy preview.
 */

import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.env.PORT ?? 4321);

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
};

async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

/** The file a request path maps to, or undefined. Never leaves dist/. */
async function resolve(pathname: string): Promise<string | undefined> {
  const clean = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  const base = join(dist, clean);
  if (!base.startsWith(dist)) return undefined;
  const candidates = clean.endsWith('/') ? [join(base, 'index.html')] : [base, `${base}.html`, join(base, 'index.html')];
  for (const candidate of candidates) {
    if (await isFile(candidate)) return candidate;
  }
  return undefined;
}

createServer(async (request, response) => {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost');
  const file = await resolve(pathname);
  const target = file ?? join(dist, '404.html');
  response.writeHead(file ? 200 : 404, { 'content-type': TYPES[extname(target)] ?? 'application/octet-stream' });
  createReadStream(target).pipe(response);
}).listen(port, () => {
  console.log(`Serving dist/ on http://localhost:${port}`);
});
