/**
 * The three kinds of work story. The titles are the labels both Studio's radio
 * list and the Work & Writing index show, so they are defined once here.
 */
export const WORK_KINDS = [
  { title: 'Client', value: 'professional' },
  { title: 'Independent', value: 'independent' },
  { title: 'Research', value: 'research' },
] as const;

export type WorkKind = (typeof WORK_KINDS)[number]['value'];

export function workKindLabel(kind: WorkKind): string {
  return WORK_KINDS.find((entry) => entry.value === kind)?.title ?? kind;
}

/** The href for a post or report reached from a work story. */
export function artifactHref(type: 'post' | 'report', slug: string): string {
  return type === 'report' ? `/reports/${slug}` : `/posts/${slug}`;
}
