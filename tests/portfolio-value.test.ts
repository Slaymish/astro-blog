import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { mergeFeed, sortFeedByValue, type FeedEntry } from '../src/content/feed';
import { mergeWriting } from '../src/content/writing';
import { validatePosts, validateReports, validateWorkStories } from '../src/content/validate';
import type { Post, Report, WorkStory } from '../src/content/types';

const post: Post = { _id: 'p', title: 'Post', slug: 'p', publishedAt: '2026-01-01', excerpt: 'Excerpt', markdownBody: 'Body', tags: [], related: [] };
const report: Report = { _id: 'r', title: 'Report', slug: 'r', publishedAt: '2025-01-01', description: 'Description', pdfUrl: '/r.pdf', pdfBytes: 1, tags: [], related: [] };
const story: WorkStory = {
  _id: 'w', title: 'Work', slug: 'w', date: '2024-01-01', kind: 'independent', order: 1,
  descriptor: 'Example', summary: 'Summary', introduction: 'Introduction', role: 'Developer',
  body: [], result: 'Result', links: [], evidence: [], related: [], artifacts: [],
  cover: { kind: 'figure', alt: 'Cover', figure: { title: 'Figure', facts: [{ label: 'Count', value: '1' }] } },
};

test('all document validators accept unassessed and integer scores, reject every invalid present score', () => {
  const validators = [
    (valueScore: unknown) => validatePosts([{ ...post, valueScore } as Post]),
    (valueScore: unknown) => validateReports([{ ...report, valueScore } as Report]),
    (valueScore: unknown) => validateWorkStories([{ ...story, valueScore } as WorkStory]),
  ];
  for (const validate of validators) {
    for (const value of [undefined, null, 0, 1, 100]) assert.deepEqual(validate(value), []);
    for (const value of [NaN, Infinity, -Infinity, 0.5, -1, 101, '50', '', false, {}, []]) {
      assert.match(validate(value).join('\n'), /valueScore must be an integer from 0 to 100/);
    }
  }
  assert.deepEqual(validatePosts([post]), []);
  assert.deepEqual(validateReports([report]), []);
  assert.deepEqual(validateWorkStories([story]), []);
});

test('scores propagate from all source types through writing and feed without changing chronology', () => {
  for (const score of [undefined, null, 0, 100]) {
    const writing = mergeWriting([{ ...post, valueScore: score }], [{ ...report, valueScore: score }]);
    assert.deepEqual(writing.map((entry) => entry.valueScore), [score, score]);
    const feed = mergeFeed([{ ...story, valueScore: score }], writing);
    assert.deepEqual(feed.map((entry) => entry.valueScore), [score, score, score]);
    assert.deepEqual(feed.map((entry) => entry.href), ['/posts/p', '/reports/r', '/work/w']);
  }
});

function entry(href: string, valueScore: unknown, publishedAt = '2026-01-01'): FeedEntry {
  return { type: 'work', story, href, valueScore, publishedAt, tags: [] } as FeedEntry;
}

test('value sort ranks scores then instants then href, preserves zero and never mutates input', () => {
  const entries = [
    entry('/unset', undefined, '2030-01-01'), entry('/zero', 0, '2020-01-01'),
    entry('/b', 50), entry('/a', 50, '2026-01-01T01:00:00+01:00'),
    entry('/newer', 50, '2026-01-02'), entry('/highest', 100, '2000-01-01'),
    entry('/null', null), entry('/invalid', Infinity), entry('/fraction', 1.5),
    entry('/string', '100'), entry('/negative', -1), entry('/too-high', 101),
  ];
  const before = structuredClone(entries);
  Object.freeze(entries);
  const sorted = sortFeedByValue(entries);
  assert.notEqual(sorted, entries);
  assert.deepEqual(sorted.slice(0, 6).map((item) => item.href), ['/highest', '/newer', '/a', '/b', '/zero', '/unset']);
  assert.deepEqual(sorted.slice(6).map((item) => item.href), ['/fraction', '/invalid', '/negative', '/null', '/string', '/too-high']);
  assert.deepEqual(entries, before);
  assert.equal(sorted[0], entries[5]);
  const empty: FeedEntry[] = [];
  assert.deepEqual(sortFeedByValue(empty), []);
  assert.notEqual(sortFeedByValue(empty), empty);
});

test('site queries project scores for all source types and never project internal reasons', () => {
  const queries = readFileSync(new URL('../src/content/queries.ts', import.meta.url), 'utf8');
  for (const type of ['workStory', 'post', 'report']) {
    const projection = queries.split(`*[_type == "${type}"]`)[1]?.split('assertValid')[0];
    assert.match(projection ?? '', /\bvalueScore\b/);
  }
  assert.doesNotMatch(queries, /\bvalueReason\b/);
});
