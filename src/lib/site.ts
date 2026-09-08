export const SITE_URL = 'https://hamishburke.dev';
export const SITE_NAME = 'Hamish Burke';
export const SITE_DESCRIPTION =
  'Hamish Burke is a software developer in Wellington, New Zealand. Independent projects, client work, and notes on AI and software systems.';
export const SITE_AUTHOR = 'Hamish Burke';
export const CONTACT_EMAIL = 'hamishapps@gmail.com';
export const BOOKING_URL = 'https://cal.com/hamishburke/30min';

export const SOCIAL_PROFILES = [
  'https://github.com/Slaymish',
  'https://www.linkedin.com/in/hamish-burke-2301669a',
  'https://twitter.com/Slaymishh',
  'https://instagram.com/hamishburke.studio'
] as const;

export function absoluteUrl(pathOrUrl: string, base = SITE_URL): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }

  const normalizedPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return new URL(normalizedPath, `${base}/`).toString();
}

/** Public path for Astro's file-format prerender URL, also used by navigation. */
export function publicPathFromAstro(requestUrl: URL): string {
  return requestUrl.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/\/$/, '') || '/';
}

export function canonicalFromAstro(
  requestUrl: URL,
  configuredSite?: URL,
  override?: string
): string {
  const base = configuredSite?.toString() || SITE_URL;
  // With build.format = 'file', Astro.url contains the output filename during
  // prerendering. Metadata must use the public route, like the sitemap does.
  const target = override || publicPathFromAstro(requestUrl);

  if (target.startsWith('http://') || target.startsWith('https://')) {
    const absolute = new URL(target);
    absolute.hash = '';
    absolute.search = '';
    return absolute.toString();
  }

  const canonical = new URL(target, `${base}/`);
  canonical.hash = '';
  canonical.search = '';
  return canonical.toString();
}
