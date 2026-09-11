import assert from 'node:assert/strict';
import test from 'node:test';
import { SITE_NAME, SITE_URL, absoluteUrl, publicPathFromAstro } from '../src/site/config';
import { buildMetadata } from '../src/site/seo';

test('file-format prerender URLs match public routes and sitemap URLs', () => {
  for (const [input, expected] of [
    ['/index.html', '/'],
    ['/work.html', '/work'],
    ['/work/you-inc.html', '/work/you-inc'],
    ['/about.html', '/about'],
    ['/posts/index', '/posts/index'],
    ['/about/', '/about'],
    ['/cv?from=about#academic', '/cv'],
  ]) {
    const path = publicPathFromAstro(new URL(input!, SITE_URL));
    assert.equal(path, expected);
    assert.equal(absoluteUrl(path), `${SITE_URL}${expected}`);
  }
});

test('absoluteUrl passes absolute URLs through and normalises bare paths', () => {
  assert.equal(absoluteUrl('https://example.com/article'), 'https://example.com/article');
  assert.equal(absoluteUrl('http://example.com/a'), 'http://example.com/a');
  assert.equal(absoluteUrl('work'), `${SITE_URL}/work`);
  assert.equal(absoluteUrl('/work'), `${SITE_URL}/work`);
});

test('buildMetadata titles the home page without the suffix and everything else with it', () => {
  assert.equal(buildMetadata({ title: SITE_NAME, description: 'd', path: '/' }).fullTitle, SITE_NAME);
  assert.equal(buildMetadata({ title: 'Work', description: 'd', path: '/work' }).fullTitle, `Work | ${SITE_NAME}`);
});

test('buildMetadata resolves the canonical and the Open Graph image absolutely', () => {
  const meta = buildMetadata({ title: 'Work', description: 'd', path: '/work' });
  assert.equal(meta.canonical, `${SITE_URL}/work`);
  assert.equal(meta.ogImage, `${SITE_URL}/og-default.png`);

  const withImage = buildMetadata({
    title: 'A post',
    description: 'd',
    path: '/posts/a',
    image: 'https://cdn.sanity.io/images/x/y/z.png?w=1200',
  });
  assert.equal(withImage.ogImage, 'https://cdn.sanity.io/images/x/y/z.png?w=1200');
});

test('buildMetadata emits one graph with a Person, a WebSite and a page node', () => {
  const graph = buildMetadata({ title: 'Work', description: 'd', path: '/work' }).jsonLd as {
    '@context': string;
    '@graph': Array<Record<string, unknown>>;
  };
  assert.equal(graph['@context'], 'https://schema.org');
  const types = graph['@graph'].map((node) => node['@type']);
  assert.deepEqual(types, ['Person', 'WebSite', 'WebPage']);
});

test('buildMetadata maps each article kind to its schema type and carries its dates', () => {
  for (const [kind, type] of [
    ['post', 'BlogPosting'],
    ['report', 'Report'],
    ['work', 'CreativeWork'],
  ] as const) {
    const graph = buildMetadata({
      title: 'T',
      description: 'd',
      path: '/posts/t',
      article: { kind, publishedAt: '2026-01-01', updatedAt: '2026-02-01', tags: ['ai', 'systems'] },
    }).jsonLd as { '@graph': Array<Record<string, unknown>> };

    const node = graph['@graph'][2]!;
    assert.equal(node['@type'], type);
    assert.equal(node.datePublished, '2026-01-01');
    assert.equal(node.dateModified, '2026-02-01');
    assert.equal(node.keywords, 'ai, systems');
  }
});

test('buildMetadata puts Home at the front of a breadcrumb trail and omits it with no crumbs', () => {
  const withCrumbs = buildMetadata({
    title: 'You Inc',
    description: 'd',
    path: '/work/you-inc',
    breadcrumbs: [
      { name: 'Work', path: '/work' },
      { name: 'You Inc', path: '/work/you-inc' },
    ],
  }).jsonLd as { '@graph': Array<Record<string, unknown>> };

  const list = withCrumbs['@graph'].find((node) => node['@type'] === 'BreadcrumbList') as {
    itemListElement: Array<{ position: number; name: string; item: string }>;
  };
  assert.deepEqual(
    list.itemListElement.map((item) => [item.position, item.name, item.item]),
    [
      [1, 'Home', `${SITE_URL}/`],
      [2, 'Work', `${SITE_URL}/work`],
      [3, 'You Inc', `${SITE_URL}/work/you-inc`],
    ],
  );

  const without = buildMetadata({ title: 'T', description: 'd', path: '/' }).jsonLd as {
    '@graph': Array<Record<string, unknown>>;
  };
  assert.equal(
    without['@graph'].some((node) => node['@type'] === 'BreadcrumbList'),
    false,
  );
});
