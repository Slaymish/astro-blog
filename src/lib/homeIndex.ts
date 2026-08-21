import type { GraphicKind, WorkStory } from './work';
import { artifactHref, workStoryHref } from './work';
import type { WritingEntry } from './writingData';

/**
 * The homepage is one dated stream rather than separate project and writing
 * sections, so both content types are flattened into a single row shape here and
 * grouped by year. Months and years are sliced out of the ISO date rather than
 * parsed through Date: the build runs in UTC and the site is authored in NZDT, and
 * a timezone shift on a 1 January date would silently move a row into the wrong
 * year group.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface IndexRow {
  key: string;
  href: string;
  title: string;
  /** What kind of thing this is, in the reader's words. Replaces a badge. */
  descriptor: string;
  date: string;
  month: string;
  metric?: string;
  /** Present only on expanded rows. Its absence is what makes a row compact. */
  graphic?: { kind: GraphicKind; alt: string };
}

export interface IndexYear {
  year: string;
  rows: IndexRow[];
}

function monthOf(isoDate: string): string {
  const month = Number(isoDate.slice(5, 7));
  return MONTHS[month - 1] ?? '';
}

const byDateDesc = (a: { date: string }, b: { date: string }) => b.date.localeCompare(a.date);

/**
 * Expanded rows carry a square diagram; compact rows do not. The set is a rule
 * rather than a hand-picked list so it re-evaluates as content is added: the two
 * most recent independent projects, plus the most recent professional one.
 */
function expandedIds(stories: WorkStory[]): Set<string> {
  const newestOfKind = (kind: WorkStory['kind'], count: number) =>
    stories
      .filter((story) => story.kind === kind)
      .sort(byDateDesc)
      .slice(0, count);

  return new Set(
    [...newestOfKind('independent', 2), ...newestOfKind('professional', 1)].map((story) => story.id)
  );
}

function storyRow(story: WorkStory, expanded: boolean): IndexRow {
  return {
    key: story.id,
    href: workStoryHref(story.slug),
    title: story.title,
    descriptor: story.descriptor,
    date: story.date,
    month: monthOf(story.date),
    metric: story.metric,
    graphic: expanded && story.graphic ? story.graphic : undefined
  };
}

function writingRow(entry: WritingEntry): IndexRow {
  return {
    key: entry.href,
    href: entry.href,
    title: entry.title,
    descriptor: entry.type === 'report' ? 'Report' : 'Writing',
    date: entry.publishedAt,
    month: monthOf(entry.publishedAt)
  };
}

/**
 * Hrefs already represented by a story row. Nearly every write-up on the site is an
 * artifact of a work story published within days of it, so interleaving the two
 * unfiltered listed the same thing twice under two titles. The story is canonical
 * and links to its own write-ups; a standalone piece belonging to no story still
 * gets its own row.
 */
function claimedHrefs(stories: WorkStory[]): Set<string> {
  return new Set(
    stories
      .flatMap((story) => [story.primaryArtifact, ...(story.supportingArtifacts ?? [])])
      .filter((artifact) => artifact !== undefined)
      .map(artifactHref)
  );
}

export function buildHomeIndex(stories: WorkStory[], writing: WritingEntry[]): IndexYear[] {
  const expanded = expandedIds(stories);
  const claimed = claimedHrefs(stories);
  const rows = [
    ...stories.map((story) => storyRow(story, expanded.has(story.id))),
    ...writing.filter((entry) => !claimed.has(entry.href)).map(writingRow)
  ].sort(byDateDesc);

  const years: IndexYear[] = [];
  for (const row of rows) {
    const year = row.date.slice(0, 4);
    const current = years.at(-1);
    if (current?.year === year) current.rows.push(row);
    else years.push({ year, rows: [row] });
  }

  return years;
}

/**
 * The middle fold annotation. Counted from the stories rather than authored in the
 * CMS, so it can never claim more than the index directly below it lists. A zero
 * bucket is dropped rather than printed.
 */
export function foldCount(stories: WorkStory[]): string {
  const count = (predicate: (story: WorkStory) => boolean) => stories.filter(predicate).length;

  const buckets: [number, string][] = [
    [count((story) => story.kind === 'independent'), 'independent'],
    [count((story) => story.kind === 'professional'), 'client'],
    [count((story) => Boolean(story.primaryArtifact?.githubUrl)), 'open source']
  ];

  return buckets
    .filter(([total]) => total > 0)
    .map(([total, label]) => `${total} ${label}`)
    .join(' · ');
}
