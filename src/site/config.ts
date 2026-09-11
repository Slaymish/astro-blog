export const SITE_URL = 'https://hamishburke.dev';
export const SITE_NAME = 'Hamish Burke';
export const SITE_DESCRIPTION =
  'Hamish Burke is a software developer in Wellington, New Zealand. Independent projects, client work, and notes on AI and software systems.';
export const SITE_AUTHOR = 'Hamish Burke';
export const CONTACT_EMAIL = 'hamishapps@gmail.com';
export const BOOKING_URL = 'https://cal.com/hamishburke/30min';

export const SOCIAL_PROFILES = {
  github: 'https://github.com/Slaymish',
  linkedin: 'https://www.linkedin.com/in/hamish-burke-2301669a',
  twitter: 'https://twitter.com/Slaymishh',
  instagram: 'https://instagram.com/hamishburke.studio',
} as const;

export const TWITTER_HANDLE = '@Slaymishh';
export const UMAMI_WEBSITE_ID = '3b77a67f-19f6-4f3c-a7ab-8af0d58bfbc6';
export const LOCALE = 'en-NZ';

export function absoluteUrl(pathOrUrl: string, base: string = SITE_URL): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return new URL(path, `${base}/`).toString();
}

/**
 * Public route for a prerendered page. Under build.format 'file' Astro sets
 * Astro.url to the output filename, so metadata has to map it back.
 */
export function publicPathFromAstro(requestUrl: URL): string {
  return (
    requestUrl.pathname
      .replace(/\/index\.html$/, '/')
      .replace(/\.html$/, '')
      .replace(/\/$/, '') || '/'
  );
}
