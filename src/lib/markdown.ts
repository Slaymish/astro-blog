import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';

type HastNode = {
  type?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

const SAFE_HREF_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const SAFE_SRC_PROTOCOLS = new Set(['http:', 'https:']);

function isAllowedRelativeReference(value: string) {
  return (
    value.startsWith('#') ||
    value.startsWith('/') ||
    value.startsWith('./') ||
    value.startsWith('../') ||
    value.startsWith('?')
  );
}

function isSafeUri(value: string, kind: 'href' | 'src') {
  const trimmed = value.trim();
  if (!trimmed) return false;

  const compactLower = trimmed.replace(/[\u0000-\u001F\u007F\s]+/g, '').toLowerCase();
  if (
    compactLower.startsWith('javascript:') ||
    compactLower.startsWith('vbscript:') ||
    compactLower.startsWith('data:') ||
    compactLower.startsWith('file:')
  ) {
    return false;
  }

  if (isAllowedRelativeReference(trimmed) || trimmed.startsWith('//')) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    const allowed = kind === 'href' ? SAFE_HREF_PROTOCOLS : SAFE_SRC_PROTOCOLS;
    return allowed.has(parsed.protocol);
  } catch {
    return false;
  }
}

function sanitizeUriProperty(
  properties: Record<string, unknown>,
  key: 'href' | 'src',
  kind: 'href' | 'src'
) {
  const value = properties[key];
  if (typeof value !== 'string') return;

  if (!isSafeUri(value, kind)) {
    delete properties[key];
  }
}

function sanitizeNode(node: HastNode) {
  if (node.type === 'element' && node.properties) {
    sanitizeUriProperty(node.properties, 'href', 'href');
    sanitizeUriProperty(node.properties, 'src', 'src');
  }

  if (!Array.isArray(node.children)) return;
  for (const child of node.children) {
    sanitizeNode(child);
  }
}

function rehypeSanitizeUris() {
  return (tree: unknown) => {
    if (!tree || typeof tree !== 'object') return;
    sanitizeNode(tree as HastNode);
  };
}

const markdownProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSlug)
  .use(rehypeSanitizeUris)
  .use(rehypeStringify);

export function markdownToHtml(markdown: string) {
  const file = markdownProcessor.processSync(markdown);
  return String(file);
}

export function markdownToPlainText(markdown: string) {
  return markdownToHtml(markdown).replace(/<[^>]+>/g, '').trim();
}
