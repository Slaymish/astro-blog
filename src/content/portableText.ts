import { toHTML, type PortableTextComponents } from '@portabletext/to-html';
import { escapeHtmlAttribute } from '../site/escape';
import { sanitySrcSet } from './images';
import { isSafeUri } from './markdown';
import type { PortableTextBody, SanityImage } from './types';

/** Heading ids, de-duplicated within one document. */
function createSlugger() {
  const seen = new Map<string, number>();
  return (text: string): string => {
    const base =
      text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'section';
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
  };
}

/** The widths an in-body image is offered at. */
const BODY_IMAGE_WIDTHS = [480, 720, 1080, 1440];

function components(): PortableTextComponents {
  const slug = createSlugger();

  const heading =
    (tag: 'h2' | 'h3' | 'h4') =>
    ({ children, value }: { children?: string; value?: unknown }): string => {
      const text = plainTextOfBlock(value);
      return `<${tag} id="${escapeHtmlAttribute(slug(text))}">${children ?? ''}</${tag}>`;
    };

  return {
    block: {
      h2: heading('h2'),
      h3: heading('h3'),
      h4: heading('h4'),
    },
    marks: {
      link: ({ children, value }) => {
        const href = typeof value?.href === 'string' ? value.href : '';
        if (!isSafeUri(href)) return `<span>${children ?? ''}</span>`;
        const external = href.startsWith('http');
        const rel = external ? ' rel="noopener noreferrer" target="_blank"' : '';
        return `<a href="${escapeHtmlAttribute(href)}"${rel}>${children ?? ''}</a>`;
      },
    },
    types: {
      image: ({ value }) => {
        const image = value as SanityImage | undefined;
        if (!image?.asset?.url) return '';
        const { src, srcset, width, height } = sanitySrcSet(image, BODY_IMAGE_WIDTHS);
        const alt = escapeHtmlAttribute(image.alt ?? '');
        return (
          `<img src="${escapeHtmlAttribute(src)}" srcset="${escapeHtmlAttribute(srcset)}" ` +
          `sizes="(min-width: 48rem) 42rem, 100vw" width="${width}" height="${height}" ` +
          `alt="${alt}" loading="lazy" decoding="async" />`
        );
      },
    },
  };
}

function plainTextOfBlock(block: unknown): string {
  const children = (block as { children?: Array<{ text?: string }> } | undefined)?.children;
  if (!Array.isArray(children)) return '';
  return children.map((child) => child.text ?? '').join('');
}

export function portableTextToHtml(body: PortableTextBody | null | undefined): string {
  if (!body?.length) return '';
  return toHTML(body, { components: components() });
}

export function portableTextToPlainText(body: PortableTextBody | null | undefined): string {
  if (!body?.length) return '';
  return body
    .filter((block) => block._type === 'block')
    .map(plainTextOfBlock)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
