import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { transpileModule, ScriptTarget, ModuleKind } from 'typescript';
import { freshnessPoints, rankByValue, selectHomeWork, selectHomeWriting } from '../src/content/ranking';
import { mergeFeed } from '../src/content/feed';
import { feedMetadataEntries } from '../src/content/metadata';
import type { WorkStory, WritingEntry } from '../src/content/types';

const now = Date.parse('2026-11-03T00:00:00Z');
const day = 86400000;
const date = (days: number) => new Date(now - days * day).toISOString();
const entry = (href: string, valueScore: number | null | undefined, days = 0) => ({ href, valueScore, publishedAt: date(days) });
const story = (slug: string, valueScore?: number, days = 0): WorkStory => ({
  _id: slug, slug, title: slug, valueScore, date: date(days), kind: 'independent', order: 0,
  descriptor: 'Example', summary: 'Summary', introduction: 'Introduction', role: 'Developer',
  body: [], result: 'Result', links: [], evidence: [], related: [], artifacts: [],
  cover: { kind: 'figure', alt: 'Cover', figure: { title: 'Figure', facts: [{ label: 'Count', value: '1' }] } },
});
const writing = (href: string, valueScore: number): WritingEntry => ({
  href, valueScore, title: href, type: 'report', excerpt: 'Excerpt', publishedAt: date(0), displayDate: 'Date', tags: [],
});

test('freshness has a five point bound, 90 day half-life and explicit clock', () => {
  assert.equal(freshnessPoints(date(0), now), 5);
  assert.equal(freshnessPoints(date(90), now), 2.5);
  assert.equal(freshnessPoints(date(180), now), 1.25);
  assert.equal(freshnessPoints(date(0), now + 90 * day), 2.5);
  for (let age = 0; age < 2000; age++) assert.ok(freshnessPoints(date(age), now) <= 5);
  assert.deepEqual(rankByValue([entry('/old', 80, 10000), entry('/new', 74)], now).map(e => e.href), ['/old', '/new']);
  const changing = [entry('/older', 80, 90), entry('/recent', 79)];
  assert.equal(rankByValue(changing, now)[0].href, '/recent');
  assert.equal(rankByValue(changing, now + 180 * day)[0].href, '/older');
});

test('invalid/future dates gain nothing and updatedAt has no effect', () => {
  for (const publishedAt of ['bad', '', date(-1)]) assert.equal(freshnessPoints(publishedAt, now), 0);
  const entries = [{ ...entry('/old', 80, 900), updatedAt: date(0) }, entry('/new', 80)];
  assert.equal(rankByValue(entries, now)[0].href, '/new');
  assert.deepEqual(rankByValue(entries, now).map(e => e.href), rankByValue(entries.map(e => ({ ...e, updatedAt: '2099-01-01' })), now).map(e => e.href));
});

test('unassessed and invalid scores always rank below explicit zero', () => {
  const invalid = [undefined, null, NaN, Infinity, -1, 101, 1.5, '100'];
  const entries = invalid.map((valueScore, i) => ({ ...entry(`/invalid-${i}`, undefined), valueScore })) as ReturnType<typeof entry>[];
  assert.equal(rankByValue([...entries, entry('/zero', 0, 10000)], now)[0].href, '/zero');
});

test('ties use base, then date, then href; sorting is immutable', () => {
  const entries = [entry('/fresh', 75), { ...entry('/base', 80), publishedAt: 'invalid' }, entry('/z', 50, 90), entry('/a', 50, 90)];
  const before = structuredClone(entries);
  entries.forEach(Object.freeze);
  Object.freeze(entries);
  const sorted = rankByValue(entries, now);
  assert.deepEqual(sorted.map(e => e.href), ['/base', '/fresh', '/a', '/z']);
  assert.deepEqual(entries, before);
  assert.notEqual(sorted, entries);
  assert.equal(sorted[0], entries[1]);
  assert.deepEqual(rankByValue([{ ...entry('/invalid', 50), publishedAt: 'bad' }, { ...entry('/future', 50), publishedAt: date(-1) }], now).map(e => e.href), ['/future', '/invalid']);
});

test('home includes strongest older work, excludes sub-70 demos and caps at five', () => {
  const stories = [story('old', 98, 2000), story('demo', 69), ...Array.from({ length: 6 }, (_, i) => story(`work-${i}`, 80 + i))];
  const selected = selectHomeWork(stories, ['demo'], now);
  assert.equal(selected.length, 5);
  assert.equal(selected[0].slug, 'old');
  assert.ok(!selected.some(s => s.slug === 'demo'));
  assert.deepEqual(selectHomeWork([story('legacy')], ['legacy'], now).map(s => s.slug), ['legacy']);
  assert.throws(() => selectHomeWork([], ['missing'], now), /homePage.featured references missing/);
});

test('home writing excludes both report and post artifacts from selected work', () => {
  const featured = story('masters', 99);
  featured.artifacts = [
    { _type: 'report', slug: 'masters', title: 'Masters', excerpt: 'Excerpt', publishedAt: date(0) },
    { _type: 'post', slug: 'linked', title: 'Linked', excerpt: 'Excerpt', publishedAt: date(0) },
  ];
  const independent = writing('/reports/independent', 80);
  assert.equal(selectHomeWriting([writing('/reports/masters', 100), writing('/posts/linked', 99), independent], [featured], now), independent);
  assert.equal(selectHomeWriting([writing('/reports/masters', 100)], [featured], now), undefined);
});

test('ranked metadata matches entry order without disclosing editorial fields', () => {
  const ranked = rankByValue(mergeFeed([story('older', 99, 2000), story('new', 70)], []), now);
  const metadata = feedMetadataEntries(ranked);
  assert.deepEqual(metadata.map(e => e.url), ranked.map(e => e.href));
  assert.doesNotMatch(JSON.stringify(metadata), /valueScore|valueReason|freshness|effectiveScore/);
});

const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
test('home route omits writing and its metadata when all writing belongs to selected work', async () => {
  const home = source('src/pages/index.astro');
  // Execute the route's actual assembly, including any curated fallback, not just the selector.
  const frontmatter = home.split('---')[1];
  const assembly = frontmatter.slice(frontmatter.indexOf('const now'));
  const { outputText } = transpileModule(assembly, {
    compilerOptions: { target: ScriptTarget.ESNext, module: ModuleKind.ESNext },
  });
  const assemble = new Function('getHomePage', 'getWorkStories', 'getSiteSettings', 'getWriting',
    'selectHomeWork', 'selectHomeWriting',
    `return (async () => { ${outputText}; return { selectedWriting, featuredMetadata }; })()`);
  const featured = story('selected', 99);
  featured.artifacts = [{ _type: 'report', slug: 'linked', title: 'Linked', excerpt: 'Linked excerpt', publishedAt: date(0) }];
  const linked = writing('/reports/linked', 100);
  const independent = { ...writing('/posts/independent', 80), type: 'post' as const };
  const copy = {
    featured: ['selected'], writingEntry: { _type: 'report', slug: 'linked', title: 'Unsafe fallback' },
    writingBlurb: 'Unsafe fallback excerpt', readingLabel: 'Reading', readingText: 'Reading text',
  };
  for (const entries of [[], [linked], [linked, independent]]) {
    const result = await assemble(async () => copy, async () => [featured], async () => ({}),
      async () => entries, selectHomeWork, selectHomeWriting);
    assert.deepEqual(result.featuredMetadata.map((entry: { url: string }) => entry.url),
      entries.length <= 1 ? ['/work/selected', '/reading'] : ['/work/selected', independent.href, '/reading']);
    if (entries.length > 1) {
      assert.deepEqual(result.featuredMetadata[1], {
        type: 'BlogPosting', name: independent.title, url: independent.href,
        description: independent.excerpt, publishedAt: independent.publishedAt,
      });
    } else {
      assert.equal(result.selectedWriting, undefined);
    }
  }
  assert.match(home, /\{selectedWriting && index === Math\.min\(1, featured\.length - 1\) && \(\s*<section class="notes notes--writing"/);
  assert.doesNotMatch(home, /copy\.writingEntry|copy\.writingBlurb|artifactHref/);
});

test('actual routes rank once at build time and pass the same stream to metadata and list', () => {
  for (const route of ['work', 'writing']) {
    const text = source(`src/pages/${route}/index.astro`);
    assert.match(text, /const now = Date.now\(\)/);
    assert.match(text, /const entries = rankByValue\(feed, now\)/);
    assert.match(text, /feedMetadataEntries\(visibleEntries\)/);
    assert.match(text, /<FeedIndex entries=\{entries\}[^>]*mode="flat"/);
    assert.doesNotMatch(text, /resolveFeatured|featured=/);
  }
  const home = source('src/pages/index.astro');
  assert.match(home, /selectHomeWork\(stories, copy.featured, now\)/);
  assert.match(home, /selectHomeWriting\(writing, featured, now\)/);
  assert.match(home, /name: selectedWriting.title, url: selectedWriting.href, description: selectedWriting.excerpt/);
  assert.match(home, /type: selectedWriting.type === 'post'/);
  assert.match(home, /\{selectedWriting\.title\}/);
  assert.match(home, /\{selectedWriting\.excerpt\}/);
});

test('presentation keeps filters and chronological mode without scores or special spotlight', () => {
  const index = source('src/components/FeedIndex.astro');
  const list = source('src/components/FeedList.astro');
  assert.match(index, /data-feed-view/);
  assert.match(index, /mode=\{mode\}/);
  assert.match(list, /mode = 'chronological'/);
  assert.match(list, /mode === 'flat' \? \[\{ year: null, entries \}\] : groupFeedByYear\(entries\)/);
  assert.match(list, /<time[^>]*datetime=\{entry.publishedAt\}/);
  assert.doesNotMatch(index, /codex-usage|featured-tool/);
  for (const text of [index, list, source('src/pages/index.astro')]) {
    assert.doesNotMatch(text.split('---')[2], /valueScore|valueReason|freshness|rankByValue/);
  }
});
