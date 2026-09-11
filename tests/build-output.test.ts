/**
 * Assertions against the built HTML rather than the source. Everything here is
 * an invariant whose breakage is otherwise silent: a canonical that drifts from
 * the route, an Open Graph image that 404s, an internal link to a page that was
 * never built, a `style` attribute the CSP will refuse.
 *
 * Skipped when there is no build to read, so `pnpm run test` is useful before
 * one and complete after it.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';
import { markdownTwin } from '../netlify/edge-functions/markdown';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const SITE_URL = 'https://hamishburke.dev';

const built = existsSync(join(dist, 'index.html'));
const skip = built ? false : 'run pnpm run build first';

/** Every built page, excluding the static 410 body which has no layout. */
function htmlFiles(dir: string, found: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      htmlFiles(path, found);
    } else if (name.endsWith('.html') && name !== '410.html') {
      found.push(path);
    }
  }
  return found;
}

/** The public route a built file answers on, under build.format 'file'. */
function publicPath(file: string): string {
  const rel = `/${relative(dist, file).split('\\').join('/')}`;
  return rel.replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/(.)\/$/, '$1') || '/';
}

const pages = built ? htmlFiles(dist).map((file) => ({ file, path: publicPath(file), html: readFileSync(file, 'utf8') })) : [];

/** Redirect sources declared in netlify.toml, which internal links may target. */
function redirectSources(): string[] {
  const toml = readFileSync(join(root, 'netlify.toml'), 'utf8');
  return [...toml.matchAll(/^\s*from\s*=\s*"([^"]+)"/gm)].map((match) => match[1]!);
}

/** Whether a site-relative path resolves to something the build produced. */
function resolves(path: string, sources: string[]): boolean {
  const clean = path.split('#')[0]!.split('?')[0]!;
  if (clean === '' || clean === '/') return true;
  if (sources.includes(clean)) return true;
  const candidates = [clean, `${clean}.html`, join(clean, 'index.html')];
  return candidates.some((candidate) => existsSync(join(dist, candidate)));
}

test('every page has a canonical matching its own route', { skip }, () => {
  for (const page of pages) {
    const href = parse(page.html).querySelector('link[rel="canonical"]')?.getAttribute('href');
    const expected = page.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${page.path}`;
    assert.equal(href, expected, `${page.path} has canonical ${href}`);
  }
});

test('every Open Graph image is absolute and actually resolves', { skip }, () => {
  for (const page of pages) {
    const content = parse(page.html)
      .querySelectorAll('meta[property="og:image"]')
      .map((meta) => meta.getAttribute('content'))
      .filter(Boolean) as string[];
    assert.equal(content.length, 1, `${page.path} has ${content.length} og:image tags`);

    const url = new URL(content[0]!);
    assert.equal(url.protocol, 'https:', `${page.path} og:image is not https`);
    if (url.host === 'cdn.sanity.io') continue;
    assert.equal(url.origin, SITE_URL, `${page.path} og:image points at ${url.origin}`);
    assert(
      existsSync(join(dist, url.pathname)),
      `${page.path} og:image ${url.pathname} is not in the build`,
    );
  }
});

test('every internal link and image resolves to a built file or a redirect rule', { skip }, () => {
  const sources = redirectSources();
  for (const page of pages) {
    const document = parse(page.html);
    const targets = [
      ...document.querySelectorAll('a[href]').map((node) => node.getAttribute('href')!),
      ...document.querySelectorAll('img[src]').map((node) => node.getAttribute('src')!),
      ...document.querySelectorAll('video[poster]').map((node) => node.getAttribute('poster')!),
      ...document.querySelectorAll('source[src]').map((node) => node.getAttribute('src')!),
    ].filter((target) => target.startsWith('/'));

    for (const target of targets) {
      assert(resolves(target, sources), `${page.path} links to ${target}, which is not in the build`);
    }
  }
});

test('no element carries a style attribute, which the policy would refuse', { skip }, () => {
  for (const page of pages) {
    const offenders = parse(page.html)
      .querySelectorAll('[style]')
      .map((node) => node.tagName);
    assert.deepEqual(offenders, [], `${page.path} has inline styles on ${offenders.join(', ')}`);
  }
});

test('every page carries a hash-based policy with no unsafe-inline', { skip }, () => {
  for (const page of pages) {
    const content = parse(page.html)
      .querySelector('meta[http-equiv="content-security-policy"]')
      ?.getAttribute('content');
    assert(content, `${page.path} has no content-security-policy meta element`);
    assert.equal(content!.includes('unsafe-inline'), false, `${page.path} allows unsafe-inline`);
    assert.match(content!, /script-src[^;]*'sha256-/, `${page.path} has no script hash`);
  }
});

test('every page has exactly one JSON-LD graph, and it parses', { skip }, () => {
  for (const page of pages) {
    const scripts = parse(page.html).querySelectorAll('script[type="application/ld+json"]');
    assert.equal(scripts.length, 1, `${page.path} has ${scripts.length} JSON-LD scripts`);

    const parsed = JSON.parse(scripts[0]!.textContent) as { '@graph'?: unknown[] };
    assert(Array.isArray(parsed['@graph']), `${page.path} JSON-LD has no @graph array`);
    assert(parsed['@graph']!.length > 0, `${page.path} JSON-LD graph is empty`);
  }
});

test('every page declares the New Zealand English locale', { skip }, () => {
  for (const page of pages) {
    assert.equal(parse(page.html).querySelector('html')?.getAttribute('lang'), 'en-NZ', page.path);
  }
});

test('the build produced the pages the preserve list promises', { skip }, () => {
  for (const path of [
    '/',
    '/now',
    '/work',
    '/writing',
    '/reading',
    '/about',
    '/cv',
    '/contact',
    '/privacy',
    '/terms',
    '/404',
  ]) {
    assert(
      pages.some((page) => page.path === path),
      `${path} is not in the build`,
    );
  }
});

// Asserting against markdownTwin is what keeps the href Base.astro advertises
// and the path the edge function resolves from drifting apart.
test('every page advertises a markdown twin the build wrote', { skip }, () => {
  for (const page of pages) {
    const href = parse(page.html).querySelector('link[type="text/markdown"]')?.getAttribute('href');
    assert.equal(href, markdownTwin(page.path), `${page.path} advertises ${href}`);
    const twin = join(dist, href!);
    assert(existsSync(twin), `${page.path} advertises ${href}, which is not in the build`);
    assert(readFileSync(twin, 'utf8').trim().length > 0, `${href} is empty`);
  }
});
