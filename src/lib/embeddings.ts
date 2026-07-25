/**
 * Build-time semantic relatedness.
 *
 * Tag overlap only relates documents that happen to share vocabulary. Embedding
 * the corpus lets "double-entry ledger" match "accounting" without a shared tag.
 *
 * The model runs locally during the build — no API key, no runtime service. The
 * corpus is embedded once per build and the resulting vectors are compared in
 * memory, so pages stay fully static.
 */

import { fetchSanity } from './sanity';
import { publicPostSlug } from './legacyRoutes';

/** Cosine similarity below this is treated as "not actually related". */
const MIN_SIMILARITY = 0.25;
const MODEL = 'Xenova/all-MiniLM-L6-v2';

export interface RelatedDoc {
  type: 'post' | 'report' | 'workStory';
  title: string;
  slug: string;
  href: string;
  publishedAt: string | null;
  similarity: number;
}

interface CorpusDoc extends Omit<RelatedDoc, 'similarity'> {
  /** Concatenated title, summary and tags — the text actually embedded. */
  text: string;
}

interface Corpus {
  docs: CorpusDoc[];
  vectors: number[][];
}

type SanityDoc = {
  type: string;
  title?: string;
  slug?: string;
  summary?: string;
  publishedAt?: string;
  tags?: string[];
};

function hrefFor(type: string, slug: string): string {
  if (type === 'report') return `/reports/${slug}`;
  if (type === 'workStory') return `/work/${slug}`;
  // Posts are published under their public slug; linking the content slug would
  // point at a legacy URL that only 301s.
  return `/posts/${publicPostSlug(slug)}`;
}

async function fetchCorpusDocs(): Promise<CorpusDoc[]> {
  const docs = await fetchSanity<SanityDoc[]>(`
    *[_type in ["post", "report", "workStory"] && defined(slug.current)]{
      "type": _type,
      title,
      "slug": slug.current,
      "summary": coalesce(excerpt, description, summary),
      "publishedAt": coalesce(publishedAt, date),
      tags
    }
  `);

  return (docs ?? [])
    .filter((doc): doc is SanityDoc & { title: string; slug: string } =>
      Boolean(doc.title && doc.slug)
    )
    .map((doc) => ({
      type: doc.type as RelatedDoc['type'],
      title: doc.title,
      slug: doc.slug,
      href: hrefFor(doc.type, doc.slug),
      publishedAt: doc.publishedAt ?? null,
      text: [doc.title, doc.summary ?? '', (doc.tags ?? []).join(' ')].join('. ').trim()
    }));
}

/**
 * Memoised so the model is loaded and the corpus embedded exactly once per
 * build, rather than once per prerendered page.
 */
let corpusPromise: Promise<Corpus | null> | null = null;

async function getCorpus(): Promise<Corpus | null> {
  if (!corpusPromise) {
    corpusPromise = (async () => {
      const docs = await fetchCorpusDocs();
      if (docs.length < 2) return null;

      // Imported lazily so the model is only pulled in when relatedness is used.
      const { pipeline } = await import('@huggingface/transformers');
      const embed = await pipeline('feature-extraction', MODEL);
      const output = await embed(
        docs.map((doc) => doc.text),
        { pooling: 'mean', normalize: true }
      );

      return { docs, vectors: output.tolist() as number[][] };
    })().catch((error) => {
      console.warn('[embeddings] falling back to tag matching:', (error as Error).message);
      return null;
    });
  }

  return corpusPromise;
}

/** Vectors are L2-normalised, so the dot product is the cosine similarity. */
function cosine(a: number[], b: number[]): number {
  let total = 0;
  for (let i = 0; i < a.length; i += 1) total += a[i] * b[i];
  return total;
}

/**
 * Nearest neighbours to `slug` by meaning. Returns an empty array when the
 * model is unavailable so callers can fall back rather than fail the build.
 */
export async function getRelatedByMeaning(slug: string, limit = 3): Promise<RelatedDoc[]> {
  const corpus = await getCorpus();
  if (!corpus) return [];

  const index = corpus.docs.findIndex((doc) => doc.slug === slug);
  if (index === -1) return [];

  const target = corpus.vectors[index];

  return corpus.docs
    .map((doc, i) => ({ doc, similarity: i === index ? -1 : cosine(target, corpus.vectors[i]) }))
    .filter((entry) => entry.similarity >= MIN_SIMILARITY)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .map(({ doc, similarity }) => ({
      type: doc.type,
      title: doc.title,
      slug: doc.slug,
      href: doc.href,
      publishedAt: doc.publishedAt,
      similarity
    }));
}
