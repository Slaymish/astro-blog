import { toHTML } from '@portabletext/to-html';
import GithubSlugger from 'github-slugger';
import { urlFor } from './sanity';
import { escapeHtmlAttribute } from './escape';
/**
 * One node of a Portable Text document, as Sanity returns it.
 *
 * Derived from the renderer's own signature rather than restated, so it cannot
 * drift from what `toHTML` actually accepts. `@portabletext/types` is only a
 * transitive dependency here, so the type is reached through `toHTML` instead
 * of imported directly.
 */
type PortableTextBlock = Extract<Parameters<typeof toHTML>[0], readonly unknown[]>[number];

/** A whole Portable Text body: the array Sanity stores under a `body` field. */
export type PortableTextBody = PortableTextBlock[];

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, '').trim();
}

/**
 * Wider than `PortableTextBody` because one caller (`pageContent.ts`) still
 * types its documents as `unknown[]`. Narrow this once that is fixed; the cast
 * at the `toHTML` call below is the only place the looseness is absorbed.
 */
type RenderableBody = readonly unknown[] | null | undefined;

export function portableTextToHtml(content: RenderableBody) {
  if (!content) return '';
  const slugger = new GithubSlugger();

  return toHTML(content as PortableTextBody, {
    components: {
      block: {
        h2: ({ children }) => {
          const text = stripHtml(String(children ?? ''));
          const id = slugger.slug(text);
          return `<h2 id="${id}">${children}</h2>`;
        },
        h3: ({ children }) => {
          const text = stripHtml(String(children ?? ''));
          const id = slugger.slug(text);
          return `<h3 id="${id}">${children}</h3>`;
        },
        h4: ({ children }) => {
          const text = stripHtml(String(children ?? ''));
          const id = slugger.slug(text);
          return `<h4 id="${id}">${children}</h4>`;
        }
      },
      types: {
        image: ({ value }) => {
          const alt = value?.alt ? String(value.alt) : '';
          const src = value?.asset ? urlFor(value).width(1200).url() : '';
          if (!src) return '';
          return `<img src="${escapeHtmlAttribute(src)}" alt="${escapeHtmlAttribute(alt)}" loading="lazy" />`;
        }
      }
    }
  });
}

export function portableTextToPlainText(content: RenderableBody) {
  if (!content) return '';
  const html = portableTextToHtml(content);
  return stripHtml(html);
}
