import type { RelatedEntry, RelatedRef } from './types';
import { artifactHref } from './work';

interface Current {
  type: 'post' | 'report' | 'workStory';
  slug: string;
  tags?: string[];
  related?: RelatedRef[];
}

function hrefFor(ref: RelatedRef): string {
  if (ref._type === 'workStory') return `/work/${ref.slug}`;
  return artifactHref(ref._type, ref.slug);
}

/**
 * The curated `related` list when an editor set one, otherwise posts and
 * reports sharing at least one tag, newest first.
 */
export async function getRelated(current: Current, limit = 3): Promise<RelatedEntry[]> {
  if (current.related?.length) {
    return current.related.slice(0, limit).map((ref) => ({
      title: ref.title,
      href: hrefFor(ref),
      type: ref._type,
      publishedAt: ref.publishedAt ?? ref.date ?? '',
    }));
  }

  const tags = new Set(current.tags ?? []);
  if (tags.size === 0) return [];

  const { getPosts, getReports } = await import('./queries');
  const [posts, reports] = await Promise.all([getPosts(), getReports()]);

  const candidates: RelatedEntry[] = [
    ...posts.map((post) => ({
      title: post.title,
      href: `/posts/${post.slug}`,
      type: 'post' as const,
      publishedAt: post.publishedAt,
      tags: post.tags ?? [],
      slug: post.slug,
    })),
    ...reports.map((report) => ({
      title: report.title,
      href: `/reports/${report.slug}`,
      type: 'report' as const,
      publishedAt: report.publishedAt,
      tags: report.tags ?? [],
      slug: report.slug,
    })),
  ]
    .filter((entry) => !(entry.type === current.type && entry.slug === current.slug))
    .filter((entry) => entry.tags.some((tag) => tags.has(tag)))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit)
    .map(({ title, href, type, publishedAt }) => ({ title, href, type, publishedAt }));

  return candidates;
}
