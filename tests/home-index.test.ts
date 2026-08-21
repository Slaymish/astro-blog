import assert from 'node:assert/strict';
import test from 'node:test';
import { buildHomeIndex, foldCount } from '../src/lib/homeIndex';
import type { WorkStory } from '../src/lib/work';
import type { WritingEntry } from '../src/lib/writingData';

function story(overrides: Partial<WorkStory> = {}): WorkStory {
  return {
    id: 'workStory-one',
    title: 'Example',
    descriptor: 'Example system',
    slug: 'example',
    kind: 'independent',
    status: 'lead',
    order: 1,
    service: 'digital-products',
    date: '2026-01-01',
    summary: 'Built a useful example system.',
    problem: 'The example needed a reliable implementation.',
    role: 'Solo engineer.',
    interventions: ['Designed the system boundary.'],
    result: 'The system works and the limits are documented.',
    graphic: { kind: 'brontehf', alt: 'An example system diagram.' },
    supportingArtifacts: [],
    ...overrides
  };
}

function writing(overrides: Partial<WritingEntry> = {}): WritingEntry {
  return {
    type: 'post',
    title: 'A standalone essay',
    href: '/posts/standalone',
    publishedAt: '2026-05-01',
    displayDate: 'May 2026',
    tags: [],
    ...overrides
  };
}

const rowsOf = (years: ReturnType<typeof buildHomeIndex>) => years.flatMap((year) => year.rows);

test('groups rows by year, newest first', () => {
  const years = buildHomeIndex(
    [
      story({ id: 'a', slug: 'a', date: '2025-06-01' }),
      story({ id: 'b', slug: 'b', date: '2026-08-01' })
    ],
    []
  );

  assert.deepEqual(
    years.map((year) => year.year),
    ['2026', '2025']
  );
  assert.deepEqual(rowsOf(years).map((row) => row.month), ['Aug', 'Jun']);
});

test('expands the rows whose graphic is a screenshot, whatever their kind or age', () => {
  const years = buildHomeIndex(
    [
      story({ id: 'shot', slug: 'shot', date: '2026-08-01', graphic: { kind: 'sprint-coach', alt: 'A screenshot.' } }),
      story({ id: 'diagram', slug: 'diagram', date: '2026-07-01', graphic: { kind: 'you-inc', alt: 'A diagram.' } }),
      story({ id: 'old-shot', slug: 'old-shot', date: '2024-01-01', graphic: { kind: 'health-agent', alt: 'A screenshot.' } }),
      story({ id: 'none', slug: 'none', date: '2026-06-01', graphic: undefined })
    ],
    []
  );

  const expanded = rowsOf(years).filter((row) => row.graphic).map((row) => row.key);
  assert.deepEqual(expanded, ['shot', 'old-shot']);
});

test('suppresses writing already represented by a story, primary or supporting', () => {
  const stories = [
    story({
      id: 'a',
      slug: 'a',
      date: '2026-06-01',
      primaryArtifact: { id: 'r1', type: 'report', title: 'Study', slug: 'the-study' },
      supportingArtifacts: [{ id: 'p1', type: 'post', title: 'Notes', slug: 'the-notes' }]
    })
  ];
  const entries = [
    writing({ href: '/reports/the-study', title: 'Study' }),
    writing({ href: '/posts/the-notes', title: 'Notes' }),
    writing({ href: '/posts/standalone', title: 'A standalone essay' })
  ];

  const titles = rowsOf(buildHomeIndex(stories, entries)).map((row) => row.title);
  assert.deepEqual(titles.sort(), ['A standalone essay', 'Example']);
});

test('writing rows name their own kind rather than carrying a badge', () => {
  const rows = rowsOf(buildHomeIndex([], [writing({ type: 'report' }), writing({ type: 'post' })]));
  assert.deepEqual(rows.map((row) => row.descriptor).sort(), ['Report', 'Writing']);
});

test('the fold count is derived, and drops empty buckets rather than printing a zero', () => {
  const stories = [
    story({ id: 'a', slug: 'a', kind: 'independent' }),
    story({
      id: 'b',
      slug: 'b',
      kind: 'independent',
      primaryArtifact: { id: 'x', type: 'project', title: 'Repo', slug: 'repo', githubUrl: 'https://github.com/x/y' }
    })
  ];

  assert.equal(foldCount(stories), '2 independent · 1 open source');
  assert.equal(foldCount([]), '');
});
