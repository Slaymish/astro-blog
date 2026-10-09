import {
  LOCALE,
  SITE_AUTHOR,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  SOCIAL_PROFILES,
  absoluteUrl,
} from './config';
import { tagSlug } from '../content/writing';

type ArticleKind = 'post' | 'report' | 'work';
type PageType = 'WebPage' | 'AboutPage' | 'ProfilePage' | 'ContactPage' | 'CollectionPage';
type Node = Record<string, unknown>;

export interface StructuredEntry {
  type: 'BlogPosting' | 'Report' | 'CreativeWork' | 'Book' | 'WebPage';
  name: string;
  url?: string;
  id?: string;
  description?: string;
  publishedAt?: string;
  tags?: string[];
  image?: string;
  /** Book authors are distinct from the site's author. */
  author?: string;
}

export interface MetadataInput {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  profileImage?: string;
  pageType?: PageType;
  topics?: string[];
  relatedLinks?: string[];
  collections?: Array<{ id: string; name: string; entries: StructuredEntry[] }>;
  robots?: string;
  article?: {
    kind: ArticleKind;
    publishedAt: string;
    updatedAt?: string;
    tags?: string[];
    text?: string;
    wordCount?: number;
    minutes?: number;
    pdf?: { url: string; bytes: number };
    citations?: Array<{ name: string; url: string }>;
  };
  breadcrumbs?: Array<{ name: string; path: string }>;
}

export interface Metadata {
  fullTitle: string;
  canonical: string;
  ogImage: string;
  jsonLd: Node;
}

const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const ARTICLE_TYPE: Record<ArticleKind, StructuredEntry['type']> = {
  post: 'BlogPosting', report: 'Report', work: 'CreativeWork',
};
const ref = (id: string): Node => ({ '@id': id });

/** A single source for IDs used by detail pages and references in indexes. */
export function contentId(url: string): string {
  return `${absoluteUrl(url)}#content`;
}

/** Escape markup delimiters before embedding JSON in an HTML script element. */
export function serializeJsonLd(graph: Node): string {
  return JSON.stringify(graph).replace(/</g, '\\u003c');
}

export function buildMetadata(input: MetadataInput): Metadata {
  const { title, description, path, image, article, breadcrumbs } = input;
  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
  const canonical = absoluteUrl(path);
  const ogImage = absoluteUrl(image ?? '/og-default.png');
  const pageId = `${canonical}#webpage`;
  const nodes = new Map<string, Node>();
  const add = (node: Node): Node => {
    const id = String(node['@id']);
    nodes.set(id, { ...nodes.get(id), ...node });
    return ref(id);
  };

  add({
    '@type': 'Person', '@id': PERSON_ID,
    name: SITE_AUTHOR, alternateName: 'Slaymish',
    description: SITE_DESCRIPTION,
    url: absoluteUrl('/about'),
    mainEntityOfPage: ref(`${absoluteUrl('/about')}#webpage`),
    jobTitle: 'Software developer',
    sameAs: Object.values(SOCIAL_PROFILES),
    ...(input.profileImage ? { image: absoluteUrl(input.profileImage) } : {}),
  });
  add({
    '@type': 'WebSite', '@id': WEBSITE_ID,
    name: SITE_NAME, description: SITE_DESCRIPTION,
    url: absoluteUrl('/'), publisher: ref(PERSON_ID),
    inLanguage: LOCALE,
  });

  const topics = (labels: string[] = []): Node[] => {
    const unique = new Map<string, string>();
    for (const label of labels) if (label.trim()) unique.set(tagSlug(label), label.trim());
    return [...unique].map(([slug, name]) => add({
      '@type': 'DefinedTerm', '@id': `${absoluteUrl(`/tags/${slug}`)}#topic`,
      name, url: absoluteUrl(`/tags/${slug}`),
    }));
  };

  const page: Node = {
    '@type': input.pageType ?? 'WebPage', '@id': pageId,
    name: title, description, url: canonical,
    isPartOf: ref(WEBSITE_ID), inLanguage: LOCALE,
    author: ref(PERSON_ID), publisher: ref(PERSON_ID),
  };
  add(page);
  // Retain this object so subsequent connections are applied to the graph node.
  const pageNode = nodes.get(pageId)!;
  const pageTopics = topics(input.topics ?? article?.tags);
  if (pageTopics.length) pageNode.about = pageTopics;
  if (input.relatedLinks?.length) pageNode.relatedLink = [...new Set(input.relatedLinks.map((url) => absoluteUrl(url)))];
  if (input.pageType === 'ProfilePage' || input.pageType === 'AboutPage') pageNode.mainEntity = ref(PERSON_ID);
  if (input.pageType === 'ContactPage') pageNode.about = ref(PERSON_ID);

  if (image) {
    const imageRef = add({
      '@type': 'ImageObject', '@id': `${canonical}#primaryimage`,
      url: ogImage, contentUrl: ogImage,
      ...(input.imageAlt ? { caption: input.imageAlt } : {}),
    });
    pageNode.primaryImageOfPage = imageRef;
  }

  if (article) {
    const node: Node = {
      '@type': ARTICLE_TYPE[article.kind], '@id': contentId(canonical),
      name: title, headline: title, description, url: canonical,
      author: ref(PERSON_ID), publisher: ref(PERSON_ID),
      datePublished: article.publishedAt,
      inLanguage: LOCALE, isAccessibleForFree: true,
      mainEntityOfPage: ref(pageId), isPartOf: ref(WEBSITE_ID),
    };
    if (image) node.image = ref(`${canonical}#primaryimage`);
    if (article.updatedAt) {
      node.dateModified = article.updatedAt;
      pageNode.dateModified = article.updatedAt;
    }
    pageNode.datePublished = article.publishedAt;
    if (article.tags?.length) {
      node.keywords = article.tags.join(', ');
      node.about = topics(article.tags);
    }
    if (article.text?.trim()) node[article.kind === 'post' ? 'articleBody' : 'text'] = article.text.trim();
    if (article.kind === 'post' && article.wordCount !== undefined) node.wordCount = article.wordCount;
    if (article.minutes) node.timeRequired = `PT${article.minutes}M`;
    if (article.citations?.length) node.citation = article.citations.map((citation) => ({
      '@type': 'CreativeWork', name: citation.name, url: absoluteUrl(citation.url),
    }));
    if (article.pdf) node.encoding = add({
      '@type': 'MediaObject', '@id': `${canonical}#pdf`,
      name: title, contentUrl: article.pdf.url,
      encodingFormat: 'application/pdf', contentSize: `${article.pdf.bytes} B`,
      encodesCreativeWork: ref(contentId(canonical)),
    });
    pageNode.mainEntity = add(node);
  }

  if (input.collections?.length) {
    const lists = input.collections.map((collection) => {
      const listId = `${canonical}#${collection.id}`;
      const items = collection.entries.map((entry, index) => {
        const url = entry.url ? absoluteUrl(entry.url) : undefined;
        const id = entry.id ? absoluteUrl(entry.id) : url ? (entry.type === 'WebPage' ? `${url}#webpage` : contentId(url)) : `${listId}-item-${index + 1}`;
        const item: Node = { '@type': entry.type, '@id': id, name: entry.name };
        if (url) item.url = url;
        if (entry.description) item.description = entry.description;
        if (entry.image) item.image = absoluteUrl(entry.image);
        if (entry.publishedAt) item.datePublished = entry.publishedAt;
        if (entry.tags?.length) {
          item.keywords = entry.tags.join(', ');
          item.about = topics(entry.tags);
        }
        if (entry.type === 'Book') {
          if (entry.author) item.author = { '@type': 'Person', name: entry.author };
        } else if (entry.type !== 'WebPage') {
          item.author = ref(PERSON_ID);
          item.inLanguage = LOCALE;
          if (url) item.mainEntityOfPage = ref(`${url}#webpage`);
        }
        return { '@type': 'ListItem', position: index + 1, item: add(item) };
      });
      return add({
        '@type': 'ItemList', '@id': listId,
        name: collection.name, numberOfItems: items.length, itemListElement: items,
      });
    });
    pageNode.mainEntity = lists.length === 1 ? lists[0] : lists;
  }

  if (breadcrumbs?.length) {
    const trail = [{ name: 'Home', path: '/' }, ...breadcrumbs];
    pageNode.breadcrumb = add({
      '@type': 'BreadcrumbList', '@id': `${canonical}#breadcrumbs`,
      itemListElement: trail.map((crumb, index) => ({
        '@type': 'ListItem', position: index + 1,
        name: crumb.name, item: absoluteUrl(crumb.path),
      })),
    });
  }

  return {
    fullTitle, canonical, ogImage,
    jsonLd: { '@context': 'https://schema.org', '@graph': [...nodes.values()] },
  };
}
