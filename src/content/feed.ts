import type { FeedIndexCopy, WorkStory, WritingEntry } from './types';
import { getWriting, tagSlug } from './writing';

interface FeedBase {
  href: string;
  publishedAt: string;
  tags: string[];
}

export type FeedEntry = FeedBase & (
  | { type: 'work'; story: WorkStory }
  | { type: 'writing'; writing: WritingEntry }
);

/** Explicit project topics override the topics of its linked posts/reports. */
export function workTags(story: WorkStory): string[] {
  return uniqueTags(story.tags ?? story.artifacts.flatMap((artifact) => artifact.tags ?? []));
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
      publishedAt: story.date, tags: workTags(story),
    })),
    ...writing.map((entry): FeedEntry => ({
      type: 'writing', writing: entry, href: entry.href,
      publishedAt: entry.publishedAt, tags: uniqueTags(entry.tags),
    })),
  ];
  // Compare instants rather than date strings: dates and datetimes can coexist.
  return entries.sort((a, b) =>
    Date.parse(b.publishedAt) - Date.parse(a.publishedAt) || a.href.localeCompare(b.href),
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

/** Offer even single-entry topics, deduplicating by the shared URL slug. */
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
