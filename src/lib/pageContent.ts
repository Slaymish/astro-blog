import { fetchSanity } from './sanity';

/** Portable Text blocks are passed straight through to the renderer in portableText.ts. */
type PortableTextBlock = unknown;

/**
 * Page copy for About, CV, Writing, Contact and 404 lives in Sanity as singleton
 * documents with fixed IDs, so each page fetches exactly one known document
 * rather than querying by slug. The homepage and the work index write their copy
 * in the template instead (see src/lib/workEditorial.ts); their singletons were
 * retired on 2026-09-05.
 */

interface CtaLink {
  label: string;
  href: string;
  external?: boolean;
  ariaLabel?: string;
}

interface Seo {
  title: string;
  description: string;
}

interface AboutPage {
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

interface CvPage {
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

interface WritingIndexPage {
  seo: Seo;
  hero: { eyebrow: string; headlineLines: string[]; intro: string };
  filterLabel: string;
  emptyMessage: string;
}

interface ContactPage {
  seo: Seo;
  hero: { eyebrow: string; headlineLines: string[]; intro: string };
  channels: { label: string; note: string; link: CtaLink }[];
  availabilityNote: string;
}

interface NotFoundPage {
  seo: Seo;
  code: string;
  heading: string;
  body: string;
  homeLabel: string;
  backLabel: string;
  suggestionsLabel: string;
  suggestions: CtaLink[];
}

/** Only the contact band still reads this; the header and footer are written in their components. */
interface SiteSettings {
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

export const getAboutPage = () => fetchSingleton<AboutPage>('aboutPage');
export const getCvPage = () => fetchSingleton<CvPage>('cvPage');
export const getWritingIndexPage = () => fetchSingleton<WritingIndexPage>('writingIndexPage');
export const getContactPage = () => fetchSingleton<ContactPage>('contactPage');
export const getNotFoundPage = () => fetchSingleton<NotFoundPage>('notFoundPage');
export const getSiteSettings = () => fetchSingleton<SiteSettings>('siteSettings');
