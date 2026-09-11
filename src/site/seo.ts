import {
  LOCALE,
  SITE_AUTHOR,
  SITE_NAME,
  SITE_URL,
  SOCIAL_PROFILES,
  absoluteUrl,
} from './config';

type ArticleKind = 'post' | 'report' | 'work';

export interface MetadataInput {
  title: string;
  description: string;
  path: string;
  image?: string;
  robots?: string;
  article?: {
    kind: ArticleKind;
    publishedAt: string;
    updatedAt?: string;
    tags?: string[];
  };
  breadcrumbs?: Array<{ name: string; path: string }>;
}

export interface Metadata {
  fullTitle: string;
  canonical: string;
  ogImage: string;
  jsonLd: Record<string, unknown>;
}

const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;

const ARTICLE_TYPE: Record<ArticleKind, string> = {
  post: 'BlogPosting',
  report: 'Report',
  work: 'CreativeWork',
};

function person(): Record<string, unknown> {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: SITE_AUTHOR,
    alternateName: 'Slaymish',
    url: absoluteUrl('/'),
    image: absoluteUrl('/apple-touch-icon.png'),
    jobTitle: 'Software developer',
    sameAs: Object.values(SOCIAL_PROFILES),
  };
}

function website(): Record<string, unknown> {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE_NAME,
    url: absoluteUrl('/'),
    publisher: { '@id': PERSON_ID },
    inLanguage: LOCALE,
  };
}

export function buildMetadata(input: MetadataInput): Metadata {
  const { title, description, path, image, article, breadcrumbs } = input;

  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
  const canonical = absoluteUrl(path);
  const ogImage = absoluteUrl(image ?? '/og-default.png');

  const graph: Array<Record<string, unknown>> = [person(), website()];

  if (article) {
    const node: Record<string, unknown> = {
      '@type': ARTICLE_TYPE[article.kind],
      headline: title,
      description,
      url: canonical,
      author: { '@id': PERSON_ID },
      publisher: { '@id': PERSON_ID },
      image: ogImage,
      datePublished: article.publishedAt,
      inLanguage: LOCALE,
      mainEntityOfPage: canonical,
    };
    if (article.updatedAt) node.dateModified = article.updatedAt;
    if (article.tags?.length) node.keywords = article.tags.join(', ');
    graph.push(node);
  } else {
    graph.push({
      '@type': 'WebPage',
      name: title,
      description,
      url: canonical,
      isPartOf: { '@id': WEBSITE_ID },
      inLanguage: LOCALE,
    });
  }

  if (breadcrumbs?.length) {
    const trail = [{ name: 'Home', path: '/' }, ...breadcrumbs];
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: trail.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: absoluteUrl(crumb.path),
      })),
    });
  }

  return {
    fullTitle,
    canonical,
    ogImage,
    jsonLd: { '@context': 'https://schema.org', '@graph': graph },
  };
}
