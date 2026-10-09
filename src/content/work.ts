/**
 * The three kinds of work story, used by Studio's radio list and validation.
 */
export const WORK_KINDS = [
  { title: 'Client', value: 'professional' },
  { title: 'Independent', value: 'independent' },
  { title: 'Research', value: 'research' },
] as const;

/** The href for a post or report reached from a work story. */
export function artifactHref(type: 'post' | 'report', slug: string): string {
  return type === 'report' ? `/reports/${slug}` : `/posts/${slug}`;
}
