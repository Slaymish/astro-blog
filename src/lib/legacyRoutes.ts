type LegacyRouteType = 'project' | 'post' | 'report';

export type LegacyRoutePolicy =
  | { action: 'redirect'; destination: string }
  | { action: 'gone' }
  | null;

export const projectSuccessors: Record<string, string> = {
  'sprint-coach': '/work/sprint-coach',
  brontehf: '/work/brontehf',
  'you-inc': '/work/you-inc',
  'gpu-share': '/work/gpu-share',
  'health-agent': '/work/health-agent',
};

export const archivedProjects = new Set([
  'bedroom-layout-designer',
  'drop-eta',
  // Never finished; retired rather than left as an unlisted page (an X-Robots-Tag
  // set from a prerendered route is a no-op, so it was never actually unlisted).
  'otto',
  'piano-improvisation-helper',
  'wiki-router',
]);

const publicPostSlugs: Record<string, string> = {
  'gpu-share': 'building-a-private-ai-server-for-friends',
};

/** Archived reports that should answer 410 rather than 404. */
const archivedReports = new Set([
  'a-survey-of-nosql-databases-and-polyglot-persistence-patterns',
]);

// Retired URLs are served as real 301s/410s by netlify.toml. The project maps
// are exported so tests can check the corresponding redirect rules.

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
  }

  if (type === 'post' && slug === 'gpu-share') {
    return { action: 'redirect', destination: `/posts/${publicPostSlug(slug)}` };
  }

  if (type === 'report' && archivedReports.has(slug)) {
    return { action: 'gone' };
  }

  return null;
}
