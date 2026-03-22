/**
 * Match {{interactive}} in rendered HTML. Handles:
 * 1. Wrapped in its own <p> tag: <p>{{interactive}}</p>
 * 2. At the start/end of a <p> with other content
 * 3. Raw text (e.g. in portable text output)
 *
 * When the placeholder is inside a <p> with other content, the regex
 * captures the full <p>...</p> so we can split cleanly without leaving
 * broken tags or nesting a <div> island inside a <p>.
 */
const STANDALONE_RE = /<p>\s*\{\{interactive\}\}\s*<\/p>/;
const INLINE_RE = /<p>([^]*?)\{\{interactive\}\}([^]*?)<\/p>/;
const RAW_RE = /\{\{interactive\}\}/;

/**
 * Split HTML at the {{interactive}} placeholder.
 * Returns [before, after] if found, or null if no placeholder present.
 */
export function splitHtmlAtInteractive(html: string): [string, string] | null {
  // Case 1: placeholder is the only content in a <p>
  const standalone = html.match(STANDALONE_RE);
  if (standalone && standalone.index !== undefined) {
    return [
      html.slice(0, standalone.index),
      html.slice(standalone.index + standalone[0].length),
    ];
  }

  // Case 2: placeholder is inside a <p> with other content
  const inline = html.match(INLINE_RE);
  if (inline && inline.index !== undefined) {
    const before = html.slice(0, inline.index);
    const after = html.slice(inline.index + inline[0].length);
    const textBefore = inline[1].trim();
    const textAfter = inline[2].trim();
    return [
      before + (textBefore ? `<p>${textBefore}</p>` : ''),
      (textAfter ? `<p>${textAfter}</p>` : '') + after,
    ];
  }

  // Case 3: raw placeholder not in a <p>
  const raw = html.match(RAW_RE);
  if (raw && raw.index !== undefined) {
    return [
      html.slice(0, raw.index),
      html.slice(raw.index + raw[0].length),
    ];
  }

  return null;
}

/** Remove any stray {{interactive}} markers from HTML */
export function stripInteractivePlaceholder(html: string): string {
  return html
    .replace(STANDALONE_RE, '')
    .replace(INLINE_RE, (_, before, after) => {
      const text = (before + after).trim();
      return text ? `<p>${text}</p>` : '';
    })
    .replace(RAW_RE, '');
}
