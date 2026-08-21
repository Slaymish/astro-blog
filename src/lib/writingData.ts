import { fetchSanity } from './sanity';
import { publicPostSlug } from './legacyRoutes';

/**
 * Posts and reports share one reverse-chronological stream on /writing and on the
 * homepage, so both surfaces read them through here rather than repeating the query.
 */

type WritingType = 'post' | 'report';

export interface WritingEntry {
  type: WritingType;
  title: string;
  excerpt?: string;
  href: string;
  publishedAt: string;
  displayDate: string;
  tags: string[];
}

type PostDoc = {
  title: string;
  excerpt?: string;
  publishedAt: string;
  slug: string;
  tags?: string[];
};

type ReportDoc = {
  title: string;
  description?: string;
  publishedAt: string;
  slug: string;
  tags?: string[];
};

/** Sanity stores a content slug; some posts publish under a different public one. */
const postHref = (slug: string) => `/posts/${publicPostSlug(slug)}`;

function formatDate(value: string): string {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-NZ', { year: 'numeric', month: 'short' });
}

export async function getWriting(): Promise<WritingEntry[]> {
  const [posts, reports] = await Promise.all([
    fetchSanity<PostDoc[]>(`
      *[_type == "post" && defined(slug.current)] | order(publishedAt desc){
        title,
        excerpt,
        publishedAt,
        "slug": slug.current,
        tags
      }
    `),
    fetchSanity<ReportDoc[]>(`
      *[_type == "report" && defined(slug.current)] | order(publishedAt desc){
        title,
        description,
        publishedAt,
        "slug": slug.current,
        tags
      }
    `)
  ]);

  const entries: WritingEntry[] = [
    ...posts.map((post) => ({
      type: 'post' as const,
      title: post.title || 'Untitled',
      excerpt: post.excerpt,
      href: postHref(post.slug),
      publishedAt: post.publishedAt,
      displayDate: formatDate(post.publishedAt),
      tags: post.tags ?? []
    })),
    ...reports.map((report) => ({
      type: 'report' as const,
      title: report.title || 'Untitled',
      excerpt: report.description,
      href: `/reports/${report.slug}`,
      publishedAt: report.publishedAt,
      displayDate: formatDate(report.publishedAt),
      tags: report.tags ?? []
    }))
  ];

  return entries.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}


/** Tags worth offering as a filter: anything that would narrow to more than one entry. */
export function filterableTags(entries: WritingEntry[]): string[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of entry.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([tag]) => tag)
    .sort();
}
