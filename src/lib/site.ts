export const SITE_URL = 'https://hamishburke.dev';
export const SITE_NAME = 'Hamish Burke';
export const SITE_DESCRIPTION =
  'Software engineer in Wellington building useful websites, digital products, AI automation, and technical systems.';
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

export function canonicalFromAstro(
  requestUrl: URL,
  configuredSite?: URL,
  override?: string
): string {
  const base = configuredSite?.toString() || SITE_URL;
  const target = override || requestUrl.pathname;

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
