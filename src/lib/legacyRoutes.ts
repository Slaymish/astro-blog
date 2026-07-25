export type LegacyRouteType = 'project' | 'post' | 'report';

export type LegacyRoutePolicy =
  | { action: 'redirect'; destination: string }
  | { action: 'gone' }
  | { action: 'unlisted' }
  | null;

export const projectSuccessors: Record<string, string> = {
  brontehf: '/work/brontehf',
  'you-inc': '/work/you-inc',
  'gpu-share': '/work/gpu-share',
  'health-agent': '/work/health-agent',
};

export const archivedProjects = new Set([
  'bedroom-layout-designer',
  'drop-eta',
  'piano-improvisation-helper',
  'wiki-router',
]);

export const publicPostSlugs: Record<string, string> = {
  'gpu-share': 'building-a-private-ai-server-for-friends',
};

/** Archived reports that should answer 410 rather than 404. */
export const archivedReports = new Set([
  'a-survey-of-nosql-databases-and-polyglot-persistence-patterns',
]);

/**
 * Permanent redirects for retired URLs, consumed by `redirects` in
 * astro.config.ts so they are emitted as real 301s at build time.
 */
export function buildLegacyRedirects(): Record<string, string> {
  const redirects: Record<string, string> = {};

  for (const [slug, destination] of Object.entries(projectSuccessors)) {
    redirects[`/projects/${slug}`] = destination;
  }

  for (const [contentSlug, publicSlug] of Object.entries(publicPostSlugs)) {
    redirects[`/posts/${contentSlug}`] = `/posts/${publicSlug}`;
  }

  return redirects;
}

const contentPostSlugs = Object.fromEntries(
  Object.entries(publicPostSlugs).map(([contentSlug, publicSlug]) => [publicSlug, contentSlug])
);

export function publicPostSlug(contentSlug: string): string {
  return publicPostSlugs[contentSlug] ?? contentSlug;
}

export function contentPostSlug(publicSlug: string): string {
  return contentPostSlugs[publicSlug] ?? publicSlug;
}

export function legacyRoutePolicy(type: LegacyRouteType, slug: string): LegacyRoutePolicy {
  if (type === 'project') {
    const successor = projectSuccessors[slug];
    if (successor) return { action: 'redirect', destination: successor };
    if (archivedProjects.has(slug)) return { action: 'gone' };
    if (slug === 'otto') return { action: 'unlisted' };
  }

  if (type === 'post' && slug === 'gpu-share') {
    return { action: 'redirect', destination: `/posts/${publicPostSlug(slug)}` };
  }

  if (type === 'report' && slug === 'a-survey-of-nosql-databases-and-polyglot-persistence-patterns') {
    return { action: 'gone' };
  }

  return null;
}
