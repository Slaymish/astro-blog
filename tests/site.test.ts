import assert from 'node:assert/strict';
import test from 'node:test';
import { SITE_NAME, SITE_URL, absoluteUrl, publicPathFromAstro } from '../src/site/config';
import { buildMetadata, contentId, serializeJsonLd } from '../src/site/seo';

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

    const node = graph['@graph'].find((node) => node['@type'] === type)!;
    assert(node, `Missing ${type}`);
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

function graphOf(input: Parameters<typeof buildMetadata>[0]) {
  return buildMetadata(input).jsonLd['@graph'] as Array<Record<string, any>>;
}

test('article and page identities link to one another and to the site author', () => {
  const graph = graphOf({ title: 'A', description: 'D', path: '/posts/a', article: { kind: 'post', publishedAt: '2026-01-01', text: 'Visible article text', wordCount: 3, minutes: 1 } });
  const page = graph.find((node) => node['@type'] === 'WebPage')!;
  const article = graph.find((node) => node['@type'] === 'BlogPosting')!;
  assert.deepEqual(page.mainEntity, { '@id': contentId('/posts/a') });
  assert.deepEqual(article.mainEntityOfPage, { '@id': `${SITE_URL}/posts/a#webpage` });
  assert.deepEqual(article.author, page.author);
  assert.deepEqual(article.isPartOf, page.isPartOf);
  assert.equal(article.articleBody, 'Visible article text');
  assert.equal(article.wordCount, 3);
  assert.equal(article.timeRequired, 'PT1M');
});

test('profile pages identify the real person and use the supplied portrait rather than an icon', () => {
  const graph = graphOf({ title: 'About', description: 'D', path: '/about', pageType: 'ProfilePage', profileImage: '/portrait.webp' });
  const person = graph.find((node) => node['@type'] === 'Person')!;
  const page = graph.find((node) => node['@type'] === 'ProfilePage')!;
  assert.deepEqual(page.mainEntity, { '@id': person['@id'] });
  assert.equal(person.url, `${SITE_URL}/about`);
  assert.equal(person.image, `${SITE_URL}/portrait.webp`);
  assert.deepEqual(person.mainEntityOfPage, { '@id': page['@id'] });
});

test('report PDF metadata describes the encoding without inventing extracted text', () => {
  const graph = graphOf({ title: 'R', description: 'D', path: '/reports/r', article: { kind: 'report', publishedAt: '2026-01-01', pdf: { url: 'https://cdn.sanity.io/r.pdf', bytes: 1234 } } });
  const report = graph.find((node) => node['@type'] === 'Report')!;
  const pdf = graph.find((node) => node['@type'] === 'MediaObject')!;
  assert.deepEqual(report.encoding, { '@id': pdf['@id'] });
  assert.deepEqual(pdf.encodesCreativeWork, { '@id': report['@id'] });
  assert.equal(pdf.contentUrl, 'https://cdn.sanity.io/r.pdf');
  assert.equal(pdf.contentSize, '1234 B');
  assert.equal(pdf.encodingFormat, 'application/pdf');
  assert.equal(report.text, undefined);
});

test('collections preserve visible entry order, deduplicate topics and share content identities', () => {
  const graph = graphOf({ title: 'Work', description: 'D', path: '/work', pageType: 'CollectionPage', collections: [{
    id: 'entries', name: 'Work', entries: [
      { type: 'CreativeWork', name: 'Project', url: '/work/p', tags: ['AI', 'ai'] },
      { type: 'BlogPosting', name: 'Post', url: '/posts/p', tags: ['AI'] },
    ],
  }] });
  const list = graph.find((node) => node['@type'] === 'ItemList')!;
  assert.equal(list.numberOfItems, 2);
  assert.deepEqual(list.itemListElement.map((item: any) => [item.position, item.item['@id']]), [[1, contentId('/work/p')], [2, contentId('/posts/p')]]);
  assert.equal(graph.filter((node) => node['@type'] === 'DefinedTerm').length, 1);
  assert.equal(new Set(graph.map((node) => node['@id'])).size, graph.length);
});

test('books retain their own authors instead of being attributed to the site author', () => {
  const graph = graphOf({ title: 'Reading', description: 'D', path: '/reading', pageType: 'CollectionPage', collections: [{
    id: 'read', name: 'Read', entries: [{ type: 'Book', id: '/reading#book-one', name: 'Book', author: 'Another author' }],
  }] });
  const book = graph.find((node) => node['@type'] === 'Book')!;
  assert.deepEqual(book.author, { '@type': 'Person', name: 'Another author' });
  assert.equal(book['@id'], `${SITE_URL}/reading#book-one`);
  assert.equal(book.inLanguage, undefined);
});

test('external related resources are links, not claims of identical identity', () => {
  const external = 'https://example.com/article';
  const graph = graphOf({ title: 'Project', description: 'D', path: '/work/p', relatedLinks: [external, external] });
  const page = graph.find((node) => node['@type'] === 'WebPage')!;
  assert.deepEqual(page.relatedLink, [external]);
  assert.equal(page.sameAs, undefined);
});

test('JSON-LD serialization cannot close its script element through content', () => {
  const graph = { text: '</script><script>alert(1)</script> & words' };
  const serialized = serializeJsonLd(graph);
  assert.equal(serialized.includes('<'), false);
  assert.deepEqual(JSON.parse(serialized), graph);
});
