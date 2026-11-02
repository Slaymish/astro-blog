import assert from 'node:assert/strict';
import test from 'node:test';
import { associateFeed, feedTags, groupFeedByYear, mergeFeed, resolveFeatured, workTags } from '../src/content/feed';
import { feedFilterUrl, matchesFeedFilter, readFeedFilter } from '../src/client/feedFilter';
import type { WorkStory, WritingEntry } from '../src/content/types';

const story = (slug: string, date: string, tags?: string[]): WorkStory => ({
  _id: slug, title: slug, slug, date, tags, kind: 'independent', order: 0,
  descriptor: 'Example', summary: 'Summary', introduction: 'Introduction', role: 'Developer',
  body: [], result: 'Result', links: [], evidence: [], related: [],
  cover: { kind: 'figure', alt: 'Cover', figure: { title: 'Figure', facts: [{ label: 'Count', value: '1' }] } },
  artifacts: [{ _type: 'post', title: 'Linked', slug: 'linked', publishedAt: date, excerpt: 'Excerpt', tags: ['AI', 'Self-hosted'] }],
});
const writing = (type: 'post' | 'report', slug: string, date: string, tags = ['AI']): WritingEntry => ({
  type, title: slug, href: `/${type === 'post' ? 'posts' : 'reports'}/${slug}`,
  publishedAt: date, displayDate: 'Date', excerpt: 'Excerpt', tags,
});

test('mixed feed orders actual dates and datetimes newest first without duplicating projects', () => {
  const stories = [story('new', '2026-03-27'), story('old', '2025-01-01')];
  const feed = mergeFeed(stories, [writing('post', 'post', '2026-03-26T23:00:00Z'), writing('report', 'report', '2026-03-27T01:00:00+13:00')]);
  assert.deepEqual(feed.map((entry) => entry.href), ['/work/new', '/posts/post', '/reports/report', '/work/old']);
  assert.equal(feed.filter((entry) => entry.type === 'work').length, stories.length);
  assert.deepEqual(stories.map((entry) => entry.slug), ['new', 'old']);
});

test('the pinned band keeps the curated order rather than the feed order', () => {
  const stories = [story('newest', '2026-03-27'), story('middle', '2026-02-01'), story('oldest', '2025-01-01')];
  assert.deepEqual(resolveFeatured(stories, ['oldest', 'newest']).map((s) => s.slug), ['oldest', 'newest']);
  assert.deepEqual(resolveFeatured(stories, undefined).map((s) => s.slug), []);
});

test('a pinned slug that matches no story fails the build instead of leaving a gap', () => {
  assert.throws(() => resolveFeatured([story('kept', '2026-01-01')], ['kept', 'retired']),
    /workIndexPage\.featured references missing work stories: retired/);
});

test('equal publication times have deterministic URL ordering', () => {
  assert.deepEqual(mergeFeed([story('z', '2026-01-01')], [writing('post', 'a', '2026-01-01T00:00:00Z')]).map((entry) => entry.href), ['/posts/a', '/work/z']);
});

test('work topics inherit linked artifacts only when no explicit list exists', () => {
  assert.deepEqual(workTags(story('inherited', '2026-01-01')), ['AI', 'Self-hosted']);
  assert.deepEqual(workTags(story('override', '2026-01-01', ['Research'])), ['Research']);
  assert.deepEqual(workTags(story('empty', '2026-01-01', [])), []);
});

test('work topics skip null artifacts and inherit valid artifact tags when tags are unset', () => {
  const parent = story('project', '2026-01-01');
  parent.artifacts = [null, parent.artifacts[0]] as unknown as WorkStory['artifacts'];
  assert.deepEqual(workTags(parent), ['AI', 'Self-hosted']);
});

test('associations skip null artifacts and retain the valid writing association', () => {
  const parent = story('project', '2026-01-01', []);
  parent.artifacts = [null, parent.artifacts[0]] as unknown as WorkStory['artifacts'];
  const paper = writing('post', 'linked', '2026-01-02');
  const rows = associateFeed(mergeFeed([parent], [paper]));
  assert.equal(rows.find(row => row.entry.href === paper.href)?.associatedWork, '/work/project');
  assert.deepEqual(rows.find(row => row.entry.type === 'work')?.linkedWriting, [{ ...paper, title: 'Linked' }]);
});

test('all topics are offered, with slug-equivalent labels and whitespace deduplicated', () => {
  const feed = mergeFeed([story('one', '2026-01-01', [' AI ', 'ai', 'Solo', ''])], [writing('report', 'r', '2026-01-02', ['AI', 'Self hosted', 'self-hosted'])]);
  assert.deepEqual(feedTags(feed), ['AI', 'Self hosted', 'Solo']);
});

test('year groups preserve chronological mixing, use UTC years and allow an empty feed', () => {
  const feed = mergeFeed([story('work', '2025-12-31')], [writing('post', 'post', '2026-01-01T01:00:00+13:00'), writing('report', 'report', '2024-12-01')]);
  const groups = groupFeedByYear(feed);
  assert.deepEqual(groups.map((group) => group.year), ['2025', '2024']);
  assert.deepEqual(groups[0]!.entries.map((entry) => entry.type), ['writing', 'work']);
  assert.deepEqual(groupFeedByYear([]), []);
});

test('views show all entries or just the selected type', () => {
  const feed = mergeFeed([story('untagged', '2026-01-01', [])], [writing('post', 'ai', '2025-01-01')]);
  const filter = (view: 'all' | 'work' | 'writing') => feed.filter((entry) => matchesFeedFilter(entry.type, view));
  assert.equal(filter('all').length, 2);
  assert.deepEqual(filter('writing').map((entry) => entry.href), ['/posts/ai']);
  assert.deepEqual(filter('work').map((entry) => entry.href), ['/work/untagged']);
});

test('URL views ignore old topic filters, reject unknown types and support the writing alias', () => {
  assert.equal(readFeedFilter(new URL('https://example.com/work?type=writing&tag=ai')), 'writing');
  assert.equal(readFeedFilter(new URL('https://example.com/work?type=other&tag=missing')), 'all');
  assert.equal(readFeedFilter(new URL('https://example.com/writing?tag=all'), 'writing'), 'writing');
  assert.equal(readFeedFilter(new URL('https://example.com/writing?type=all'), 'writing'), 'all');
});

test('URL updates preserve unrelated parameters and fragments while removing topic and default filters', () => {
  const url = new URL('https://example.com/work?utm_source=friend&type=work&tag=ai#year-2026');
  assert.equal(feedFilterUrl(url, 'writing'), '/work?utm_source=friend&type=writing#year-2026');
  assert.equal(feedFilterUrl(url, 'all'), '/work?utm_source=friend#year-2026');
  assert.equal(url.searchParams.get('type'), 'work');
  assert.equal(url.searchParams.get('tag'), 'ai');
});


test('linked writing belongs to its project while standalone writing stays independent', () => {
  const feed = mergeFeed([story('project', '2026-01-01')], [
    writing('post', 'linked', '2026-01-02'), writing('report', 'standalone', '2026-01-03'),
  ]);
  const rows = associateFeed(feed);
  assert.equal(rows.find(row => row.entry.href === '/posts/linked')?.associatedWork, '/work/project');
  assert.deepEqual(rows.find(row => row.entry.type === 'work')?.linkedWriting.map(link => link.href), ['/posts/linked']);
  assert.deepEqual(rows.filter(row => matchesFeedFilter(row.entry.type, 'all', !!row.associatedWork)).map(row => row.entry.href),
    ['/reports/standalone', '/work/project']);
});


test('associations use only present parents, preserve input, and assign shared links once', () => {
  const first = story('first', '2026-01-01');
  const second = story('second', '2026-01-01');
  const paper = writing('post', 'linked', '2026-01-02');
  const feed = mergeFeed([first, second], [paper]);
  const before = structuredClone(feed);
  const rows = associateFeed(feed);
  assert.deepEqual(feed, before);
  assert.deepEqual(rows.filter(row => row.linkedWriting.length).map(row => row.entry.href), ['/work/first']);
  assert.equal(rows.find(row => row.entry.type === 'writing')?.associatedWork, '/work/first');
  assert.equal(associateFeed(feed.filter(entry => entry.type === 'writing'))[0]?.associatedWork, undefined);
  assert.deepEqual(associateFeed([]), []);
});

test('reports match type and URL, never title; dangling and unset artifacts are harmless', () => {
  const parent = story('masters', '2026-01-01');
  parent.artifacts = [{ _type: 'report', slug: 'paper', title: 'CMS paper title', excerpt: '', publishedAt: parent.date }];
  const report = writing('report', 'paper', parent.date);
  const post = { ...writing('post', 'paper', parent.date), title: report.title };
  const rows = associateFeed(mergeFeed([parent], [report, post]));
  assert.equal(rows.find(row => row.entry.href === report.href)?.associatedWork, '/work/masters');
  assert.equal(rows.find(row => row.entry.href === post.href)?.associatedWork, undefined);
  assert.deepEqual(rows.find(row => row.entry.type === 'work')?.linkedWriting.map(link => link.title), ['CMS paper title']);
  assert.equal(associateFeed(mergeFeed([parent], []))[0]?.linkedWriting.length, 0);
  for (const artifacts of [null, undefined]) {
    const unset = { ...parent, artifacts } as unknown as WorkStory;
    assert.deepEqual(associateFeed(mergeFeed([unset], [report])).map(row => row.associatedWork), [undefined, undefined]);
  }
});

test('linked writing is hidden only in All; writing and work views keep their types', () => {
  assert.equal(matchesFeedFilter('writing', 'all', true), false);
  assert.equal(matchesFeedFilter('writing', 'writing', true), true);
  assert.equal(matchesFeedFilter('writing', 'work', true), false);
  for (const view of ['all', 'work', 'writing'] as const) {
    assert.equal(matchesFeedFilter('work', view, true), view !== 'writing');
  }
});

test('flat rendering ships static visibility, nested links and default-view metadata', async () => {
  const { readFileSync } = await import('node:fs');
  const source = (path: string) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
  const list = source('src/components/FeedList.astro');
  assert.match(list, /data-associated-work=/);
  assert.match(list, /hidden=\{!matchesFeedFilter/);
  assert.match(list, /mode === 'flat' \? associateFeed/);
  assert.match(list, /linkedWriting=\{row.linkedWriting\}/);
  const card = source('src/components/WorkCard.astro');
  assert.match(card, /linkedWriting.map/);
  assert.doesNotMatch(card, /data-feed-entry/);
  assert.match(source('src/components/FeedIndex.astro'), /defaultType=\{defaultType\}/);
  for (const route of ['work', 'writing']) {
    assert.match(source('src/pages/' + route + '/index.astro'), /feedMetadataEntries\(visibleEntries\)/);
  }
});

test('browser filters restore linked writing via URL, history and empty state', async () => {
  const { parse } = await import('node-html-parser');
  const { initFeedFilter } = await import('../src/client/feedFilter');
  const document = parse('<div id="feed-index"><div data-feed-controls hidden></div><button data-feed-view="all"></button><button data-feed-view="writing"></button><button data-feed-view="work"></button><li data-feed-entry data-feed-type="work"></li><li data-feed-entry data-feed-type="writing" data-associated-work="/work/project" hidden></li><p data-feed-empty hidden></p></div>');
  const listeners = new Map<string, () => void>();
  document.getElementById('feed-index')!.setAttribute('data-default-type', 'writing');
  const location = { href: 'https://example.com/work?type=writing&tag=old#entries' };
  const calls: string[] = [];
  for (const node of document.querySelectorAll('*')) {
    Object.defineProperty(node, 'dataset', { get: () => Object.fromEntries(Object.entries(node.attributes)
      .filter(([key]) => key.startsWith('data-'))
      .map(([key, value]) => [key.slice(5).replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase()), value])) });
    Object.defineProperty(node, 'hidden', {
      get: () => node.hasAttribute('hidden'),
      set: value => value ? node.setAttribute('hidden', '') : node.removeAttribute('hidden'),
    });
    Object.assign(node, { addEventListener: (event: string, callback: () => void) => listeners.set(node.getAttribute('data-feed-view') + event, callback) });
  }
  const saved = ['document', 'window', 'history'].map(key => Object.getOwnPropertyDescriptor(globalThis, key));
  try {
    Object.assign(globalThis, {
      document,
      window: { location, addEventListener: (event: string, callback: () => void) => listeners.set(event, callback) },
      history: Object.fromEntries(['pushState', 'replaceState'].map(method => [method, (_state: unknown, _title: string, url: string) => {
        calls.push(method + ':' + url);
        location.href = new URL(url, location.href).href;
      }])),
    });
    initFeedFilter();
    const visible = () => document.querySelectorAll('[data-feed-entry]:not([hidden])').map(node => node.getAttribute('data-feed-type'));
    assert.deepEqual(visible(), ['writing']);
    listeners.get('allclick')!();
    assert.deepEqual(visible(), ['work']);
    assert(calls.includes('pushState:/work#entries'));
    location.href = 'https://example.com/work?type=writing';
    listeners.get('popstate')!();
    assert.deepEqual(visible(), ['writing']);
    location.href = 'https://example.com/work';
    listeners.get('popstate')!();
    assert.deepEqual(visible(), ['work']);
    location.href = 'https://example.com/work?type=writing';
    listeners.get('popstate')!();
    document.querySelector('[data-feed-type="work"]')!.remove();
    // A fresh init captures the now writing-only supplied DOM.
    initFeedFilter();
    listeners.get('workclick')!();
    assert.deepEqual(visible(), []);
    assert(!document.querySelector('[data-feed-empty]')!.hasAttribute('hidden'));
  } finally {
    ['document', 'window', 'history'].forEach((key, index) => {
      if (saved[index]) Object.defineProperty(globalThis, key, saved[index]!);
      else Reflect.deleteProperty(globalThis, key);
    });
  }
});
