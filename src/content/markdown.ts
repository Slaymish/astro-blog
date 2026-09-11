import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

/** The two shapes the tree walker needs from a unified tree. */
export interface Node {
  type: string;
}

export interface Parent extends Node {
  children: Node[];
}

/** How a component placeholder looks in the markdown source. */
const COMPONENT_SOURCE = /^\{\{([a-z0-9-]+)\}\}$/;
/** How it looks once rendered, and the only raw HTML allowed through. */
const COMPONENT_COMMENT = /^<!--component:[a-z0-9-]+-->$/;

const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

/** Mirrors the old isSafeUri: site-relative, or one of four protocols. */
export function isSafeUri(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return true;
  try {
    return SAFE_PROTOCOLS.includes(new URL(trimmed).protocol);
  } catch {
    return false;
  }
}

export function visit(node: Node, handle: (node: Node, parent: Parent | null, index: number) => void): void {
  const walk = (current: Node, parent: Parent | null, index: number): void => {
    handle(current, parent, index);
    const children = (current as Parent).children;
    if (!Array.isArray(children)) return;
    // Backwards, so a handler replacing a node cannot shift what is left to visit.
    for (let i = children.length - 1; i >= 0; i -= 1) {
      walk(children[i]!, current as Parent, i);
    }
  };
  walk(node, null, 0);
}

/**
 * Turns a paragraph that is exactly `{{name}}` into an HTML comment the page
 * can split on, so placing a component is a marker the renderer emitted rather
 * than a regex over rendered paragraphs.
 */
function remarkComponentMarkers() {
  return (tree: Node): void => {
    visit(tree, (node) => {
      if (node.type !== 'paragraph') return;
      const children = (node as Parent).children;
      if (children?.length !== 1) return;
      const only = children[0] as Node & { value?: string };
      if (only.type !== 'text' || typeof only.value !== 'string') return;
      const match = COMPONENT_SOURCE.exec(only.value.trim());
      if (!match) return;

      const marker = node as Node & { value?: string; children?: unknown };
      marker.type = 'html';
      marker.value = `<!--component:${match[1]}-->`;
      delete marker.children;
    });
  };
}

/**
 * Drops unsafe href and src values, and drops every raw node that is not the
 * one component marker. `allowDangerousHtml` is on so the marker survives
 * remark-rehype; this is what stops anything else surviving with it.
 */
function rehypeSafeUrls() {
  return (tree: Node): void => {
    visit(tree, (node, parent, index) => {
      if ((node.type === 'raw' || node.type === 'comment') && parent) {
        const value = String((node as Node & { value?: string }).value ?? '');
        if (!COMPONENT_COMMENT.test(value.trim())) parent.children.splice(index, 1);
        return;
      }
      const element = node as Node & { properties?: Record<string, unknown> };
      if (node.type !== 'element' || !element.properties) return;
      for (const attribute of ['href', 'src'] as const) {
        const value = element.properties[attribute];
        if (typeof value === 'string' && !isSafeUri(value)) delete element.properties[attribute];
      }
    });
  };
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkComponentMarkers)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeSlug)
  .use(rehypeSafeUrls)
  .use(rehypeStringify, { allowDangerousHtml: true });

export function markdownToHtml(markdown: string): string {
  return String(processor.processSync(markdown));
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#x27;': "'",
  '&#39;': "'",
  '&nbsp;': ' ',
};

/**
 * Markdown as words, for reading time. Derived from the rendered HTML rather
 * than from the source, so it inherits the renderer's handling of links, raw
 * HTML and component markers instead of approximating it with regexes.
 */
export function markdownToPlainText(markdown: string): string {
  return markdownToHtml(markdown)
    .replace(/<pre[\s\S]*?<\/pre>/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;|&#x?[0-9a-f]+;/gi, (entity) => ENTITIES[entity.toLowerCase()] ?? ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The rendered HTML either side of a component marker, or null if absent. */
export function splitAtComponent(html: string, name: string): [string, string] | null {
  const marker = `<!--component:${name}-->`;
  const at = html.indexOf(marker);
  if (at === -1) return null;
  return [html.slice(0, at), html.slice(at + marker.length)];
}
