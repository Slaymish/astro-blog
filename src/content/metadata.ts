import rehypeParse from 'rehype-parse';
import { unified } from 'unified';
import type { StructuredEntry } from '../site/seo';
import type { FeedEntry } from './feed';
import type { Node } from './markdown';

interface HtmlNode extends Node {
  value?: string;
  tagName?: string;
  properties?: { href?: unknown };
  children?: HtmlNode[];
}
const parser = unified().use(rehypeParse, { fragment: true });
const OMITTED = new Set(['script', 'style', 'button', 'svg']);

/** Metadata follows the rendered body, including code and table text. */
export function renderedContentMetadata(html: string): {
  text: string;
  citations: Array<{ name: string; url: string }>;
} {
  const tree = parser.parse(html) as HtmlNode;
  const textOf = (node: HtmlNode): string => {
    if (OMITTED.has(node.tagName ?? '')) return '';
    if (node.type === 'text') return node.value ?? '';
    return (node.children ?? []).map(textOf).join(node.type === 'root' || node.tagName !== 'span' ? ' ' : '');
  };
  const citations = new Map<string, { name: string; url: string }>();
  const collect = (node: HtmlNode): void => {
    if (OMITTED.has(node.tagName ?? '')) return;
    const href = node.properties?.href;
    if (node.tagName === 'a' && typeof href === 'string' && /^(https?:\/\/|\/(?!\/))/.test(href)) {
      const name = textOf(node).replace(/\s+/g, ' ').trim();
      if (name) citations.set(href, { name, url: href });
    }
    for (const child of node.children ?? []) collect(child);
  };
  collect(tree);
  return { text: textOf(tree).replace(/\s+/g, ' ').trim(), citations: [...citations.values()] };
}

/** Index markup and its graph consume the same ordered entries. */
export function feedMetadataEntries(entries: FeedEntry[]): StructuredEntry[] {
  return entries.map((entry) => ({
    type: entry.type === 'work' ? 'CreativeWork' : entry.writing.type === 'post' ? 'BlogPosting' : 'Report',
    name: entry.type === 'work' ? entry.story.title : entry.writing.title,
    url: entry.href,
    description: entry.type === 'work' ? entry.story.introduction : entry.writing.excerpt,
    publishedAt: entry.publishedAt,
    tags: entry.tags,
  }));
}
