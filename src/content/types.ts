export type WorkKind = 'professional' | 'independent' | 'research';

interface SanityAssetRef {
  _id: string;
  url: string;
  width: number;
  height: number;
}

export interface SanityImage {
  asset: SanityAssetRef;
  alt?: string;
  hotspot?: { x: number; y: number; width: number; height: number };
  crop?: { top: number; bottom: number; left: number; right: number };
}

export type PortableTextBody = Array<{ _type: string } & Record<string, unknown>>;

interface Seo {
  title: string;
  description: string;
}

interface CtaLink {
  label: string;
  href: string;
  external?: boolean;
  ariaLabel?: string;
}

interface Link {
  label: string;
  href: string;
  external?: boolean;
}

interface FigureFact {
  label: string;
  value: string;
  note?: string;
}

interface CoverImage {
  kind: 'image';
  alt: string;
  image: SanityImage;
}

interface CoverFigure {
  kind: 'figure';
  alt: string;
  figure: {
    label?: string;
    title: string;
    facts: FigureFact[];
    footnote?: string;
  };
}

export type Cover = CoverImage | CoverFigure;

export interface Evidence {
  image: SanityImage;
  alt: string;
  label?: string;
  heading?: string;
  caption?: string;
}

/** A post or report reachable from a work story. */
interface Artifact {
  _type: 'post' | 'report';
  title: string;
  slug: string;
  publishedAt: string;
  excerpt: string;
}

/** A curated related entry, before it is turned into a RelatedEntry. */
export interface RelatedRef {
  _type: 'post' | 'report' | 'workStory';
  title: string;
  slug: string;
  publishedAt?: string;
  date?: string;
}

export interface RelatedEntry {
  title: string;
  href: string;
  type: 'post' | 'report' | 'workStory';
  publishedAt: string;
}

export interface Post {
  _id: string;
  title: string;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
  excerpt: string;
  tags: string[];
  coverImage?: SanityImage;
  markdownBody: string;
  related: RelatedRef[];
}

export interface Report {
  _id: string;
  title: string;
  slug: string;
  publishedAt: string;
  description: string;
  tags: string[];
  pdfUrl: string;
  pdfBytes: number;
  body?: PortableTextBody;
  related: RelatedRef[];
}

export interface WorkStory {
  _id: string;
  title: string;
  descriptor: string;
  slug: string;
  kind: WorkKind;
  order: number;
  date: string;
  timeframe?: string;
  summary: string;
  introduction: string;
  role: string;
  body: PortableTextBody;
  resultHeading?: string;
  result: string;
  links: Link[];
  cover: Cover;
  evidence: Evidence[];
  artifacts: Artifact[];
  related: RelatedRef[];
}

export interface Book {
  _id: string;
  title: string;
  author: string;
  status: 'reading' | 'read' | 'to-read';
  note?: string;
  link?: string;
  order?: number;
  sharedNote?: string;
  coverImage?: SanityImage;
}

export interface HomePage {
  seo: Seo;
  eyebrow: string;
  heading: string;
  lede: string;
  intro: string;
  aboutLabel: string;
  featured: string[];
  leadLinkLabel: string;
  moreWorkHeading: string;
  allWorkLabel: string;
  writingLabel: string;
  writingEntry: { _type: 'post' | 'report'; title: string; slug: string };
  writingBlurb: string;
  writingLinkLabel: string;
  allWritingLabel: string;
  readingLabel: string;
  readingText: string;
  readingLinkLabel: string;
}

interface Hero {
  eyebrow: string;
  headlineLines: string[];
  intro: string;
}

interface CvHero extends Hero {
  actions: CtaLink[];
}

export interface WorkIndexPage {
  seo: Seo;
  hero: Hero;
}

export interface ReadingPage {
  seo: Seo;
  eyebrow: string;
  headline: string;
  quote: { text: string; attribution: string };
  groups: { reading: string; toRead: string; read: string };
  recommend: {
    lead: string;
    placeholder: string;
    button: string;
    empty: string;
    sending: string;
    error: string;
    limited: string;
    success: string;
  };
}

export interface AboutPage {
  seo: Seo;
  eyebrow: string;
  heading: string;
  intro: string;
  portraitAlt: string;
  largeCopy?: PortableTextBody;
  projects: Array<{ heading: string; body: string; link: CtaLink }>;
  background: { label: string; heading: string; paragraphs: string[]; links: CtaLink[] };
}

export interface WritingIndexPage {
  seo: Seo;
  hero: Hero;
  filterLabel: string;
  emptyMessage: string;
}

export interface CvPage {
  seo: Seo;
  hero: CvHero;
  facts: Array<{ label: string; value: string }>;
  academic: {
    eyebrow: string;
    heading: string;
    body: string;
    downloadCta: CtaLink;
    requestCta: CtaLink;
  };
}

export interface ContactPage {
  seo: Seo;
  hero: Hero;
  availabilityNote: string;
  channels: Array<{ label: string; note: string; link: CtaLink }>;
}

export interface NotFoundPage {
  seo: Seo;
  code: string;
  heading: string;
  body: string;
  homeLabel: string;
  backLabel: string;
  suggestionsLabel: string;
  suggestions: CtaLink[];
}

export interface SiteSettings {
  contactBand: {
    label: string;
    defaultHeading: string;
    contactLabel: string;
    bookingLabel: string;
  };
}

/** One entry in the merged posts-and-reports stream. */
export interface WritingEntry {
  type: 'post' | 'report';
  title: string;
  excerpt: string;
  href: string;
  publishedAt: string;
  displayDate: string;
  tags: string[];
}
