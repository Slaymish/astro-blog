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

test('the animated homepage name remains a heading in its markdown twin', { skip }, () => {
  const home = pages.find((page) => page.path === '/')!;
  const name = parse(home.html).querySelector('h1 .sr-only')?.textContent ?? '';
  assert(name.trim(), 'homepage name must have an accessible text equivalent');
  const markdown = readFileSync(join(dist, 'index.md'), 'utf8');
  assert(markdown.startsWith(`# ${name.trim()}\n`), 'markdown must retain the homepage heading');
});

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

test('every page has a canonical matching its route or its declared index alias', { skip }, () => {
  for (const page of pages) {
    const href = parse(page.html).querySelector('link[rel="canonical"]')?.getAttribute('href');
    const canonicalPath = page.path === '/writing' ? '/work' : page.path;
    const expected = canonicalPath === '/' ? `${SITE_URL}/` : `${SITE_URL}${canonicalPath}`;
    assert.equal(href, expected, `${page.path} has canonical ${href}`);
  }
});

test('the combined index preserves distinct cards, chronological order and unique years', { skip }, () => {
  const document = parse(readFileSync(join(dist, 'work.html'), 'utf8'));
  const entries = document.querySelectorAll('[data-feed-entry]');
  assert(entries.length > 0);
  assert(entries.some((entry) => entry.getAttribute('data-feed-type') === 'work'));
  assert(entries.some((entry) => entry.getAttribute('data-feed-type') === 'writing'));
  const dates = entries.map((entry) => Date.parse(entry.getAttribute('data-date')!));
  assert.deepEqual(dates, [...dates].sort((a, b) => b - a));
  const workLinks = entries.filter((entry) => entry.getAttribute('data-feed-type') === 'work')
    .map((entry) => entry.querySelector('.work-card h3 a')?.getAttribute('href'));
  assert.equal(new Set(workLinks).size, workLinks.length);
  assert(entries.filter((entry) => entry.getAttribute('data-feed-type') === 'writing')
    .every((entry) => entry.querySelector('.writing-list')));
  const headings = document.querySelectorAll('[data-feed-year] h2').map((heading) => heading.getAttribute('id'));
  assert.equal(new Set(headings).size, headings.length);
  assert(document.querySelector('label[for="feed-view"]'));
  assert(document.querySelector('[data-feed-status][role="status"]'));
});

test('writing fallback is excluded from indexing and sitemap while retaining its markdown twin', { skip }, () => {
  const fallback = parse(readFileSync(join(dist, 'writing.html'), 'utf8'));
  assert.equal(fallback.querySelector('meta[name="robots"]')?.getAttribute('content'), 'noindex, follow');
  assert.equal(fallback.querySelector('[data-default-type]')?.getAttribute('data-default-type'), 'writing');
  const sitemap = readFileSync(join(dist, 'sitemap.xml'), 'utf8');
  assert(sitemap.includes(`<loc>${SITE_URL}/work</loc>`));
  assert(!sitemap.includes(`<loc>${SITE_URL}/writing</loc>`));
});

test('RSS includes both work and writing with unique preserved detail URLs', { skip }, () => {
  const rss = parse(readFileSync(join(dist, 'rss.xml'), 'utf8'));
  const items = rss.querySelectorAll('item');
  const urls = items.map((item) => item.querySelector('guid')!.textContent);
  assert.equal(new Set(urls).size, urls.length);
  for (const section of ['work', 'posts', 'reports']) assert(urls.some((url) => url.startsWith(`${SITE_URL}/${section}/`)), section);
  assert(items.every((item) => Number.isFinite(Date.parse(item.querySelector('pubdate')!.textContent))));
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

test('every link that opens a new tab says so, and the note it points at exists', { skip }, () => {
  const failures: string[] = [];
  for (const page of pages) {
    const document = parse(page.html);
    if (!document.querySelector('#new-tab-note')) failures.push(`${page.path}: no #new-tab-note`);
    for (const link of document.querySelectorAll('a[target="_blank"]')) {
      const described = (link.getAttribute('aria-describedby') ?? '').split(/\s+/);
      if (!described.includes('new-tab-note')) {
        failures.push(`${page.path}: ${link.getAttribute('href')} opens a new tab without the note`);
      }
    }
  }
  assert.deepEqual(failures, []);
});

test('headings and named sections have non-empty accessible labels', { skip }, () => {
  for (const page of pages) {
    const document = parse(page.html);
    for (const heading of document.querySelectorAll('h1, h2, h3, h4, h5, h6')) {
      assert(heading.textContent.trim(), `${page.path} has an empty ${heading.tagName}`);
    }
    for (const section of document.querySelectorAll('section[aria-labelledby]')) {
      const ids = section.getAttribute('aria-labelledby')!.split(/\s+/);
      for (const id of ids) {
        assert(document.getElementById(id)?.textContent.trim(), `${page.path} has an unnamed section referencing ${id}`);
      }
    }
  }
});

test('knowledge graphs have stable, unique identities and a connected canonical page', { skip }, () => {
  for (const page of pages) {
    const document = parse(page.html);
    const graph = JSON.parse(document.querySelector('script[type="application/ld+json"]')!.textContent)['@graph'] as Array<Record<string, any>>;
    const canonical = document.querySelector('link[rel="canonical"]')!.getAttribute('href')!;
    const ids = graph.map((node) => node['@id']);
    assert(ids.every((id) => typeof id === 'string' && id.startsWith('https://')), page.path);
    assert.equal(new Set(ids).size, ids.length, `${page.path}: duplicate graph identity`);
    const webPage = graph.find((node) => node['@id'] === `${canonical}#webpage`)!;
    assert(webPage, `${page.path}: no canonical page node`);
    assert.deepEqual(webPage.isPartOf, { '@id': `${SITE_URL}/#website` });
    const person = graph.find((node) => node['@type'] === 'Person')!;
    const image = new URL(person.image);
    assert.equal(image.origin, SITE_URL);
    assert(existsSync(join(dist, image.pathname)), `${page.path}: missing author portrait`);
    assert(!image.pathname.includes('apple-touch-icon'));
    const article = graph.find((node) => node['@id'] === `${canonical}#content`);
    if (article) {
      assert.deepEqual(webPage.mainEntity, { '@id': article['@id'] });
      assert.deepEqual(article.mainEntityOfPage, { '@id': webPage['@id'] });
    }
  }
});

test('index graph lists match the entries visitors can actually browse', { skip }, () => {
  for (const page of pages.filter((page) => page.path === '/work' || page.path.startsWith('/tags/'))) {
    const document = parse(page.html);
    const graph = JSON.parse(document.querySelector('script[type="application/ld+json"]')!.textContent)['@graph'] as Array<Record<string, any>>;
    const list = graph.find((node) => node['@type'] === 'ItemList')!;
    const entries = document.querySelectorAll('[data-feed-entry]');
    assert.equal(list.numberOfItems, entries.length, page.path);
    const visibleUrls = entries.map((entry) => entry.querySelector('h3 a')?.getAttribute('href') ?? entry.querySelector('.writing-list a')?.getAttribute('href'));
    const graphUrls = list.itemListElement.map((item: any) => graph.find((node) => node['@id'] === item.item['@id'])!.url);
    assert.deepEqual(graphUrls, visibleUrls.map((url) => `${SITE_URL}${url}`), page.path);
  }
});

test('profiles, book authors and report encodings use their distinct schema types', { skip }, () => {
  const graphFor = (file: string): Array<Record<string, any>> => JSON.parse(parse(readFileSync(join(dist, file), 'utf8')).querySelector('script[type="application/ld+json"]')!.textContent)['@graph'];
  assert(graphFor('about.html').some((node) => node['@type'] === 'ProfilePage'));
  const reading = graphFor('reading.html');
  assert(reading.some((node) => node['@type'] === 'Book'));
  assert(reading.filter((node) => node['@type'] === 'Book').every((book) => book.author.name && book.author['@id'] === undefined));
  for (const page of pages.filter((page) => page.path.startsWith('/reports/'))) {
    const graph = graphFor(relative(dist, page.file));
    const pdf = graph.find((node) => node['@type'] === 'MediaObject')!;
    assert.equal(pdf.encodingFormat, 'application/pdf');
    assert.equal(pdf.contentUrl, parse(page.html).querySelector('[data-pdf-url]')!.getAttribute('data-pdf-url'));
  }
});

test('the machine-readable directory names every project, article and report and links their resources', { skip }, () => {
  const directory = readFileSync(join(dist, 'llms.txt'), 'utf8');
  for (const page of pages.filter((page) => /^\/(work|posts|reports)\//.test(page.path))) {
    assert(directory.includes(`${SITE_URL}${page.path}`), `${page.path} absent from llms.txt`);
  }
  assert(directory.includes('Accept: text/markdown'));
  assert(!directory.includes(`${SITE_URL}/stats`));
  assert(!directory.includes(`${SITE_URL}/reading/sent`));
});


test('the contact page keeps the callback form when it is published in Site Settings', { skip }, () => {
  const work = pages.find((page) => page.path === '/work')!;
  if (!parse(work.html).querySelector('form[data-contact-form]')) return;
  const contact = pages.find((page) => page.path === '/contact')!;
  const form = parse(contact.html).querySelector('form[data-contact-form]');
  assert(form, 'callback form is published but missing from /contact');
  assert.equal(form.getAttribute('action'), '/api/contact');
  assert.equal(form.getAttribute('method'), 'post');
});
