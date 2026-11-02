import { isValueScore } from './valueScore';
import type { FeedIndexCopy, WorkStory, WritingEntry } from './types';
import { getWriting, tagSlug } from './writing';

interface FeedBase {
  valueScore?: number | null;
  href: string;
  publishedAt: string;
  tags: string[];
}

export type FeedEntry = FeedBase & (
  | { type: 'work'; story: WorkStory }
  | { type: 'writing'; writing: WritingEntry }
);

export interface AssociatedFeedEntry {
  entry: FeedEntry;
  associatedWork?: string;
  linkedWriting: WritingEntry[];
}

/** First parent in the supplied order owns each real writing URL. Never changes ranking. */
export function associateFeed(entries: readonly FeedEntry[]): AssociatedFeedEntry[] {
  const writing = new Map(entries.flatMap(entry =>
    entry.type === 'writing' ? [[entry.href, entry.writing] as const] : []));
  const owners = new Map<string, string>();
  const links = new Map<string, WritingEntry[]>();
  for (const entry of entries) {
    if (entry.type !== 'work') continue;
    for (const artifact of entry.story.artifacts ?? []) {
      if (!artifact) continue;
      const href = artifact._type === 'post' ? `/posts/${artifact.slug}` : `/reports/${artifact.slug}`;
      const linked = writing.get(href);
      if (!linked || linked.type !== artifact._type || owners.has(href)) continue;
      owners.set(href, entry.href);
      links.set(entry.href, [...(links.get(entry.href) ?? []), { ...linked, title: artifact.title }]);
    }
  }
  return entries.map(entry => ({
    entry,
    associatedWork: entry.type === 'writing' ? owners.get(entry.href) : undefined,
    linkedWriting: links.get(entry.href) ?? [],
  }));
}

/**
 * Resolve the curated slugs to stories in the order they were curated.
 * A slug that no longer matches a story fails the build rather than leaving a
 * gap in the band, the same way homePage.featured does.
 */
export function resolveFeatured(stories: WorkStory[], slugs: string[] | null = []): WorkStory[] {
  // Sanity returns null for an unset field, and a default parameter only covers undefined.
  const curated = slugs ?? [];
  const bySlug = new Map(stories.map((story) => [story.slug, story]));
  const missing = curated.filter((slug) => !bySlug.has(slug));
  if (missing.length) throw new Error(`workIndexPage.featured references missing work stories: ${missing.join(', ')}`);
  return curated.flatMap((slug) => {
    const story = bySlug.get(slug);
    return story ? [story] : [];
  });
}

/** Explicit project topics override the topics of its linked posts/reports. */
export function workTags(story: WorkStory): string[] {
  return uniqueTags(story.tags ?? (story.artifacts ?? []).flatMap((artifact) => artifact?.tags ?? []));
}

function uniqueTags(tags: string[]): string[] {
  const topics = new Map<string, string>();
  for (const tag of tags) {
    const label = tag.trim();
    if (label && !topics.has(tagSlug(label))) topics.set(tagSlug(label), label);
  }
  return [...topics.values()].sort((a, b) => a.localeCompare(b));
}

export function mergeFeed(stories: WorkStory[], writing: WritingEntry[]): FeedEntry[] {
  const entries: FeedEntry[] = [
    ...stories.map((story): FeedEntry => ({
      type: 'work', story, href: `/work/${story.slug}`,
      valueScore: story.valueScore,
      publishedAt: story.date, tags: workTags(story),
    })),
    ...writing.map((entry): FeedEntry => ({
      type: 'writing', writing: entry, href: entry.href,
      valueScore: entry.valueScore,
      publishedAt: entry.publishedAt, tags: uniqueTags(entry.tags),
    })),
  ];
  // Compare instants rather than date strings: dates and datetimes can coexist.
  return entries.sort((a, b) =>
    Date.parse(b.publishedAt) - Date.parse(a.publishedAt) || a.href.localeCompare(b.href),
  );
}

/** Opt-in editorial ranking. Unassessed or invalid scores rank below explicit zero. */
export function sortFeedByValue(entries: readonly FeedEntry[]): FeedEntry[] {
  const score = (entry: FeedEntry): number => isValueScore(entry.valueScore) ? entry.valueScore : -1;
  return [...entries].sort((a, b) =>
    score(b) - score(a) ||
    Date.parse(b.publishedAt) - Date.parse(a.publishedAt) ||
    (a.href < b.href ? -1 : a.href > b.href ? 1 : 0),
  );
}

export function groupFeedByYear(entries: FeedEntry[]): { year: string; entries: FeedEntry[] }[] {
  const groups = new Map<string, FeedEntry[]>();
  for (const entry of entries) {
    const year = String(new Date(entry.publishedAt).getUTCFullYear());
    const group = groups.get(year) ?? [];
    group.push(entry);
    groups.set(year, group);
  }
  return [...groups].map(([year, entries]) => ({ year, entries }));
}

/** Collect topics for tag pages and crawl endpoints, including single-entry topics. */
export function feedTags(entries: FeedEntry[]): string[] {
  return uniqueTags(entries.flatMap((entry) => entry.tags));
}

export async function getFeed(): Promise<FeedEntry[]> {
  const { getWorkStories } = await import('./queries');
  const [stories, writing] = await Promise.all([getWorkStories(), getWriting()]);
  return mergeFeed(stories, writing);
}

/** Existing Sanity prose keeps builds working before combined copy is published. */
export async function getFeedIndexCopy(): Promise<FeedIndexCopy> {
  const { getWorkIndexPage, getWritingIndexPage } = await import('./queries');
  const [work, writing] = await Promise.all([getWorkIndexPage(), getWritingIndexPage()]);
  const label = `${work.seo.title} & ${writing.seo.title}`;
  const combined = work.combined ?? {};
  return {
    seo: { title: label, description: `${work.seo.description} ${writing.seo.description}` },
    hero: { headlineLines: [label], intro: `${work.hero.intro} ${writing.hero.intro}` },
    navigationLabel: label,
    typeFilterLabel: 'View',
    allLabel: 'All',
    workLabel: work.seo.title,
    writingLabel: writing.seo.title,
    tagFilterLabel: writing.filterLabel,
    emptyMessage: writing.emptyMessage,
    resetLabel: 'Show all',
    resultsLabel: 'entries',
    ...Object.fromEntries(Object.entries(combined).filter(([, value]) => value != null)),
  };
}
