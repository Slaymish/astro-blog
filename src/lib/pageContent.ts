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

export interface HomePage {
  seo: Seo;
  hero: {
    eyebrow: string;
    headline: string;
    headlineAccent: string;
    lede: string;
    primaryCta: CtaLink;
    secondaryCta: CtaLink;
  };
  services: string[];
  workSection: { eyebrow: string; heading: string; link: CtaLink };
  approach: { label: string; heading: string; body: string; link: CtaLink };
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
  header: { navLinks: CtaLink[]; bookingLabel: string; bookingLabelShort: string };
  footer: { tagline: string; navLinks: CtaLink[]; profileLinks: CtaLink[] };
  contactBand: { availabilityLabel: string; defaultHeading: string; bookingLabel: string };
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
export const getNotFoundPage = () => fetchSingleton<NotFoundPage>('notFoundPage');
export const getSiteSettings = () => fetchSingleton<SiteSettings>('siteSettings');
