import assert from 'node:assert/strict';
import test from 'node:test';
import { feedTags, groupFeedByYear, mergeFeed, workTags } from '../src/content/feed';
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

test('equal publication times have deterministic URL ordering', () => {
  assert.deepEqual(mergeFeed([story('z', '2026-01-01')], [writing('post', 'a', '2026-01-01T00:00:00Z')]).map((entry) => entry.href), ['/posts/a', '/work/z']);
});

test('work topics inherit linked artifacts only when no explicit list exists', () => {
  assert.deepEqual(workTags(story('inherited', '2026-01-01')), ['AI', 'Self-hosted']);
  assert.deepEqual(workTags(story('override', '2026-01-01', ['Research'])), ['Research']);
  assert.deepEqual(workTags(story('empty', '2026-01-01', [])), []);
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

test('type and tag filters intersect and can return zero results', () => {
  const feed = mergeFeed([story('untagged', '2026-01-01', [])], [writing('post', 'ai', '2025-01-01')]);
  const filter = (type: 'all' | 'work' | 'writing', tag: string | null) => feed.filter((entry) => matchesFeedFilter(entry.type, entry.tags.map((tag) => tag.toLowerCase()), { type, tag }));
  assert.equal(filter('all', null).length, 2);
  assert.equal(filter('writing', 'ai').length, 1);
  assert.equal(filter('work', 'ai').length, 0);
  assert.equal(filter('work', null).length, 1);
});

test('URL filters restore known topics including literal all, reject unknown state and support the writing alias', () => {
  assert.deepEqual(readFeedFilter(new URL('https://example.com/work?type=writing&tag=ai'), ['ai']), { type: 'writing', tag: 'ai' });
  assert.deepEqual(readFeedFilter(new URL('https://example.com/work?type=other&tag=missing'), ['ai']), { type: 'all', tag: null });
  assert.deepEqual(readFeedFilter(new URL('https://example.com/writing?tag=all'), ['all'], 'writing'), { type: 'writing', tag: 'all' });
  assert.deepEqual(readFeedFilter(new URL('https://example.com/writing?type=all'), [], 'writing'), { type: 'all', tag: null });
});

test('URL updates preserve unrelated query parameters and fragments, and remove default filters', () => {
  const url = new URL('https://example.com/work?utm_source=friend&type=work&tag=ai#year-2026');
  assert.equal(feedFilterUrl(url, { type: 'writing', tag: 'self-hosted' }), '/work?utm_source=friend&type=writing&tag=self-hosted#year-2026');
  assert.equal(feedFilterUrl(url, { type: 'all', tag: null }), '/work?utm_source=friend#year-2026');
  assert.equal(url.searchParams.get('type'), 'work');
});
