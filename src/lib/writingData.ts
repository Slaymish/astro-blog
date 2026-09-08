import { fetchSanity } from './sanity';
import { publicPostSlug } from './legacyRoutes';

/**
 * Posts and reports share one reverse-chronological stream on /writing and on the
 * homepage, so both surfaces read them through here rather than repeating the query.
 */

type WritingType = 'post' | 'report';

interface WritingEntry {
  type: WritingType;
  title: string;
  excerpt?: string;
  href: string;
  publishedAt: string;
  displayDate: string;
  tags: string[];
}

type WritingDoc = {
  type: WritingType;
  title: string;
  excerpt?: string;
  publishedAt: string;
  slug: string;
  tags?: string[];
};

export async function getWriting(): Promise<WritingEntry[]> {
  const docs = await fetchSanity<WritingDoc[]>(`
    *[_type in ["post", "report"] && defined(slug.current)]
      | order(publishedAt desc, _type asc) {
        "type": _type,
        title,
        "excerpt": select(_type == "post" => excerpt, description),
        publishedAt,
        "slug": slug.current,
        tags
      }
  `);

  return docs.map(doc => ({
    type: doc.type,
    title: doc.title || 'Untitled',
    excerpt: doc.excerpt,
    href: doc.type === 'post' ? `/posts/${publicPostSlug(doc.slug)}` : `/reports/${doc.slug}`,
    publishedAt: doc.publishedAt,
    displayDate: doc.publishedAt
      ? new Date(doc.publishedAt).toLocaleDateString('en-NZ', { year: 'numeric', month: 'short' })
      : '',
    tags: doc.tags ?? [],
  }));
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
