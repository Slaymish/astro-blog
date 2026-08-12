import { fetchSanity } from './sanity';

/** Portable Text blocks are passed straight through to the renderer in portableText.ts. */
type PortableTextBlock = unknown;

/**
 * Page copy lives in Sanity as singleton documents with fixed IDs, so each page
 * fetches exactly one known document rather than querying by slug.
 */

export interface CtaLink {
  label: string;
  href: string;
  external?: boolean;
  ariaLabel?: string;
}

export interface Seo {
  title: string;
  description: string;
}

/** A homepage section header with its own "see all" link. */
export interface IndexSection {
  eyebrow: string;
  heading: string;
  link: CtaLink;
}

export interface HomePage {
  seo: Seo;
  hero: {
    eyebrow: string;
    headline: string;
    headlineAccent: string;
    lede: string;
    links: CtaLink[];
  };
  interests: {
    label: string;
    statement: string;
    items: { title: string; body: string }[];
  };
  currently: { label: string; heading: string; body: string; link: CtaLink };
  projectsSection: IndexSection;
  workSection: IndexSection;
  writingSection: IndexSection;
  contactHeading: string;
}

export interface AboutPage {
  seo: Seo;
  hero: { eyebrow: string; heading: string; intro: string };
  portrait: {
    imageAlt: string;
    label: string;
    largeCopy: PortableTextBlock[];
    body: string;
  };
  capabilities: {
    label: string;
    heading: string;
    items: { title: string; body: string }[];
  };
  background: {
    label: string;
    heading: string;
    paragraphs: string[];
    links: CtaLink[];
  };
  contactHeading: string;
}

export interface CvPage {
  seo: Seo;
  hero: { eyebrow: string; headlineLines: string[]; intro: string; actions: CtaLink[] };
  facts: { label: string; value: string }[];
  academic: {
    eyebrow: string;
    heading: string;
    body: string;
    downloadCta: CtaLink;
    requestCta: CtaLink;
  };
}

export interface WorkIndexPage {
  seo: Seo;
  hero: { eyebrow: string; headlineLines: string[]; intro: string };
  leadSection: { heading: string; description: string };
  supportSection: { heading: string; description: string };
  contactHeading: string;
}

export interface ProjectsIndexPage {
  seo: Seo;
  hero: { eyebrow: string; headlineLines: string[]; intro: string };
  contactHeading: string;
}

export interface WritingIndexPage {
  seo: Seo;
  hero: { eyebrow: string; headlineLines: string[]; intro: string };
  filterLabel: string;
  emptyMessage: string;
}

export interface ContactPage {
  seo: Seo;
  hero: { eyebrow: string; headlineLines: string[]; intro: string };
  channels: { label: string; note: string; link: CtaLink }[];
  availabilityNote: string;
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
  header: { navLinks: CtaLink[] };
  footer: { tagline: string; navLinks: CtaLink[]; profileLinks: CtaLink[] };
  contactBand: { label: string; defaultHeading: string; contactLabel: string; bookingLabel: string };
}

async function fetchSingleton<T>(documentId: string): Promise<T> {
  const doc = await fetchSanity<T | null>(`*[_id == $documentId][0]`, { documentId });

  if (!doc) {
    throw new Error(
      `Missing Sanity document "${documentId}". Page copy is managed in the CMS — ` +
        `run "npm run seed:copy" to publish the initial content, or create the document in Studio.`
    );
  }

  return doc;
}

export const getHomePage = () => fetchSingleton<HomePage>('homePage');
export const getAboutPage = () => fetchSingleton<AboutPage>('aboutPage');
export const getCvPage = () => fetchSingleton<CvPage>('cvPage');
export const getWorkIndexPage = () => fetchSingleton<WorkIndexPage>('workIndexPage');
export const getProjectsIndexPage = () => fetchSingleton<ProjectsIndexPage>('projectsIndexPage');
export const getWritingIndexPage = () => fetchSingleton<WritingIndexPage>('writingIndexPage');
export const getContactPage = () => fetchSingleton<ContactPage>('contactPage');
export const getNotFoundPage = () => fetchSingleton<NotFoundPage>('notFoundPage');
export const getSiteSettings = () => fetchSingleton<SiteSettings>('siteSettings');
