import type { WorkKind } from './types';

const LABELS: Record<WorkKind, string> = {
  professional: 'Client',
  independent: 'Independent',
  research: 'Research',
};

export function categoryLabel(kind: WorkKind): string {
  return LABELS[kind];
}

/** The href for a post or report reached from a work story. */
export function artifactHref(type: 'post' | 'report', slug: string): string {
  return type === 'report' ? `/reports/${slug}` : `/posts/${slug}`;
}
