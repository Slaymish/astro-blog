import rehypeParse from 'rehype-parse';
import rehypeRemark from 'rehype-remark';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { visit, type Node, type Parent } from './markdown';

interface Element extends Node {
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: Node[];
}

/** Elements that carry nothing once the page is text. */
const DROPPED = new Set(['script', 'style', 'noscript', 'svg', 'form', 'button', 'template', 'dialog', 'iframe']);

function findMain(tree: Node): Element | undefined {
  const found: Element[] = [];
  visit(tree, (node) => {
    if ((node as Element).tagName === 'main') found.push(node as Element);
  });
  return found[0];
}

/** Narrows the document to <main>, which is where Base.astro puts a page's body. */
function rehypeMainContent() {
  return (tree: Node): Node => {
    const main = findMain(tree);
    if (!main) return tree;
    const root: Parent = { type: 'root', children: main.children ?? [] };
    return root;
  };
}

function rehypeStripFurniture() {
  return (tree: Node): void => {
    visit(tree, (node, parent, index) => {
      if (!parent || node.type !== 'element') return;
      const element = node as Element;
      const hidden = element.properties?.hidden === true || element.properties?.ariaHidden === 'true';
      if (DROPPED.has(element.tagName ?? '') || hidden) parent.children.splice(index, 1);
    });
  };
}

const processor = unified()
  .use(rehypeParse)
  .use(rehypeMainContent)
  .use(rehypeStripFurniture)
  .use(rehypeRemark)
  .use(remarkGfm)
  .use(remarkStringify, { bullet: '-', fences: true, rule: '-' });

/**
 * A built page as markdown. Derived from the rendered HTML rather than from
 * Sanity, so the twin cannot drift from the page and the two template-owned
 * legal pages need no second copy of their text.
 */
export function htmlToMarkdown(html: string): string {
  return `${String(processor.processSync(html)).trim()}\n`;
}
