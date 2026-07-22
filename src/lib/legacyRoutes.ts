export type LegacyRouteType = 'project' | 'post' | 'report';

export type LegacyRoutePolicy =
  | { action: 'redirect'; destination: string }
  | { action: 'gone' }
  | { action: 'unlisted' }
  | null;

const projectSuccessors: Record<string, string> = {
  brontehf: '/work/brontehf',
  'you-inc': '/work/you-inc',
  'gpu-share': '/work/gpu-share',
  'health-agent': '/work/health-agent',
};

const archivedProjects = new Set([
  'bedroom-layout-designer',
  'drop-eta',
  'piano-improvisation-helper',
  'wiki-router',
]);

export function legacyRoutePolicy(type: LegacyRouteType, slug: string): LegacyRoutePolicy {
  if (type === 'project') {
    const successor = projectSuccessors[slug];
    if (successor) return { action: 'redirect', destination: successor };
    if (archivedProjects.has(slug)) return { action: 'gone' };
    if (slug === 'otto') return { action: 'unlisted' };
  }

  if (type === 'post' && slug === 'gpu-share') {
    return { action: 'redirect', destination: '/work/gpu-share' };
  }

  if (type === 'report' && slug === 'a-survey-of-nosql-databases-and-polyglot-persistence-patterns') {
    return { action: 'gone' };
  }

  return null;
}
