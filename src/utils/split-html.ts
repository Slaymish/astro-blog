/** Match {{interactive}} as raw text or wrapped in a <p> tag by markdown/portable text */
const PLACEHOLDER_RE = /<p>\s*\{\{interactive\}\}\s*<\/p>|\{\{interactive\}\}/;

/**
 * Split HTML at the {{interactive}} placeholder.
 * Returns [before, after] if found, or null if no placeholder present.
 */
export function splitHtmlAtInteractive(html: string): [string, string] | null {
  const match = html.match(PLACEHOLDER_RE);
  if (!match || match.index === undefined) return null;
  const before = html.slice(0, match.index);
  const after = html.slice(match.index + match[0].length);
  return [before, after];
}

/** Remove any stray {{interactive}} markers from HTML */
export function stripInteractivePlaceholder(html: string): string {
  return html.replace(PLACEHOLDER_RE, '');
}
