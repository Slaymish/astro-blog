/**
 * The two halves of Accept-header negotiation that can be checked without a
 * deploy: the HTML-to-markdown conversion the build writes, and the route-to-
 * twin mapping the edge function resolves.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { htmlToMarkdown } from '../src/content/htmlToMarkdown';
import negotiate, { markdownTwin } from '../netlify/edge-functions/markdown';

const page = (body: string) => `<!doctype html><html><head><title>T</title></head><body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header><nav><a href="/work">Work</a></nav></header>
  <main id="main">${body}</main>
  <footer><p>Footer text</p></footer>
</body></html>`;

test('converts only the main element', () => {
  const markdown = htmlToMarkdown(page('<h1>Title</h1><p>Body text.</p>'));
  assert.equal(markdown, '# Title\n\nBody text.\n');
});

test('keeps headings, lists, links and code', () => {
  const markdown = htmlToMarkdown(
    page('<h2>Heading</h2><ul><li>One</li><li><a href="/about">Two</a></li></ul><pre><code>run()</code></pre>'),
  );
  assert.match(markdown, /^## Heading$/m);
  assert.match(markdown, /^- One$/m);
  assert.match(markdown, /\[Two\]\(\/about\)/);
  assert.match(markdown, /```\nrun\(\)\n```/);
});

test('drops scripts, styles, svg, forms and hidden nodes', () => {
  const markdown = htmlToMarkdown(
    page(
      '<p>Kept.</p><script>alert(1)</script><style>a{color:red}</style>' +
        '<svg><title>Icon</title></svg><form><button>Send</button></form>' +
        '<p hidden>Hidden</p><p aria-hidden="true">Decorative</p>',
    ),
  );
  assert.equal(markdown, 'Kept.\n');
});

test('falls back to the whole document when there is no main', () => {
  const markdown = htmlToMarkdown('<!doctype html><html><body><p>Loose.</p></body></html>');
  assert.equal(markdown, 'Loose.\n');
});

test('maps a route to the file the build wrote', () => {
  assert.equal(markdownTwin('/'), '/index.md');
  assert.equal(markdownTwin('/about'), '/about.md');
  assert.equal(markdownTwin('/posts/some-slug'), '/posts/some-slug.md');
  assert.equal(markdownTwin('/work/'), '/work.md');
});

/** Stands in for the platform: records what was asked for, answers with a twin. */
function stubContext(twin: string | null) {
  const asked: string[] = [];
  const next = async (request: Request): Promise<Response> => {
    asked.push(new URL(request.url).pathname);
    return twin === null ? new Response('not found', { status: 404 }) : new Response(twin);
  };
  return { asked, context: { next } as never };
}

const ask = (path: string, accept: string, method = 'GET') =>
  new Request(`https://hamishburke.dev${path}`, { method, headers: { accept } });

test('answers a markdown request with the twin and its headers', async () => {
  const { asked, context } = stubContext('# About\n');
  const response = await negotiate(ask('/about', 'text/markdown'), context);

  assert.deepEqual(asked, ['/about.md']);
  assert.equal(response?.status, 200);
  assert.equal(response?.headers.get('content-type'), 'text/markdown; charset=utf-8');
  assert.equal(response?.headers.get('vary'), 'Accept');
  assert.equal(response?.headers.get('x-markdown-tokens'), '2');
  assert.equal(await response?.text(), '# About\n');
});

test('leaves a browser request alone', async () => {
  const { asked, context } = stubContext('# About\n');
  const response = await negotiate(ask('/about', 'text/html,application/xhtml+xml,*/*;q=0.8'), context);

  assert.equal(response, undefined);
  assert.deepEqual(asked, []);
});

test('leaves files, non-GET methods and missing twins alone', async () => {
  const file = stubContext('# About\n');
  assert.equal(await negotiate(ask('/rss.xml', 'text/markdown'), file.context), undefined);
  assert.deepEqual(file.asked, []);

  const post = stubContext('# About\n');
  assert.equal(await negotiate(ask('/about', 'text/markdown', 'POST'), post.context), undefined);
  assert.deepEqual(post.asked, []);

  const missing = stubContext(null);
  assert.equal(await negotiate(ask('/nope', 'text/markdown'), missing.context), undefined);
  assert.deepEqual(missing.asked, ['/nope.md']);
});
