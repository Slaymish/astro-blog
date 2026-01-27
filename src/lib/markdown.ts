import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';

const markdownProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify);

export function markdownToHtml(markdown: string) {
  const file = markdownProcessor.processSync(markdown);
  return String(file);
}

export function markdownToPlainText(markdown: string) {
  return markdownToHtml(markdown).replace(/<[^>]+>/g, '').trim();
}
