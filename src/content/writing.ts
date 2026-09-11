import { LOCALE } from '../site/config';
import type { WritingEntry } from './types';

const monthYear = new Intl.DateTimeFormat(LOCALE, { month: 'short', year: 'numeric' });
const fullDate = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });

export const formatMonthYear = (iso: string): string => monthYear.format(new Date(iso));
export const formatFullDate = (iso: string): string => fullDate.format(new Date(iso));

/** The tag's URL segment. Every tag link on the site is built with this. */
export function tagSlug(tag: string): string {
  return (
    tag
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'tag'
  );
}

/**
 * Posts and reports as one stream, newest first.
 *
 * The query layer is imported here rather than at the top of the file so the
 * pure exports above stay importable under `tsx`, which cannot resolve the
 * `astro:env/server` module the Sanity client needs.
 */
export async function getWriting(): Promise<WritingEntry[]> {
  const { getPosts, getReports } = await import('./queries');
  const [posts, reports] = await Promise.all([getPosts(), getReports()]);

  const entries: WritingEntry[] = [
    ...posts.map((post) => ({
      type: 'post' as const,
      title: post.title,
      excerpt: post.excerpt,
      href: `/posts/${post.slug}`,
      publishedAt: post.publishedAt,
      displayDate: formatMonthYear(post.publishedAt),
      tags: post.tags ?? [],
    })),
    ...reports.map((report) => ({
      type: 'report' as const,
      title: report.title,
      excerpt: report.description,
      href: `/reports/${report.slug}`,
      publishedAt: report.publishedAt,
      displayDate: formatMonthYear(report.publishedAt),
      tags: report.tags ?? [],
    })),
  ];

  return entries.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/** Tags worth offering as a filter: the ones that would narrow to more than one entry. */
export function filterableTags(entries: WritingEntry[]): string[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of entry.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([tag]) => tag)
    .sort((a, b) => a.localeCompare(b));
}
