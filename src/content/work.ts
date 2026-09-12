/** The href for a post or report reached from a work story. */
export function artifactHref(type: 'post' | 'report', slug: string): string {
  return type === 'report' ? `/reports/${slug}` : `/posts/${slug}`;
}
