import { toHTML } from '@portabletext/to-html';
import GithubSlugger from 'github-slugger';
import { urlFor } from './sanity';
type PortableTextBlock = any;

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, '').trim();
}

export function portableTextToHtml(content: PortableTextBlock[] | null | undefined) {
  if (!content) return '';
  const slugger = new GithubSlugger();

  return toHTML(content, {
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
          return `<img src="${src}" alt="${alt}" loading="lazy" />`;
        }
      }
    }
  });
}

export function portableTextToPlainText(content: PortableTextBlock[] | null | undefined) {
  if (!content) return '';
  const html = portableTextToHtml(content);
  return stripHtml(html);
}
