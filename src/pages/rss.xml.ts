import type { APIRoute } from 'astro';
import { markdownToPlainText } from '../content/markdown';
import { fetchFreshSanity } from '../content/sanity';
import { escapeXml } from '../site/escape';
import { CONTACT_EMAIL, SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from '../site/config';

interface RssPost {
  title: string;
  slug: string;
  publishedAt: string;
  excerpt: string;
  markdownBody?: string;
  tags?: string[];
}

/** How much of a post's text stands in for a description when there is no excerpt. */
const SUMMARY_LENGTH = 300;

export const GET: APIRoute = async () => {
  // Read past the CDN: a publish should reach the feed with the rebuild that
  // follows it, not up to two minutes later.
  const posts = await fetchFreshSanity<RssPost[]>(`
    *[_type == "post"] | order(publishedAt desc)[0...50]{
      title,
      "slug": slug.current,
      publishedAt,
      excerpt,
      markdownBody,
      tags
    }
  `);

  const items = posts
    .map((post) => {
      const url = absoluteUrl(`/posts/${post.slug}`);
      const description =
        post.excerpt?.trim() || `${markdownToPlainText(post.markdownBody ?? '').slice(0, SUMMARY_LENGTH)}...`;

      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid>${escapeXml(url)}</guid>
      <description>${escapeXml(description)}</description>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <author>${escapeXml(CONTACT_EMAIL)} (Hamish Burke)</author>
      ${(post.tags ?? []).map((tag) => `<category>${escapeXml(tag)}</category>`).join('')}
    </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <link>${escapeXml(absoluteUrl('/'))}</link>
    <language>en-nz</language>
    <managingEditor>${escapeXml(CONTACT_EMAIL)} (Hamish Burke)</managingEditor>
    <webMaster>${escapeXml(CONTACT_EMAIL)} (Hamish Burke)</webMaster>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(absoluteUrl('/rss.xml'))}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { 'content-type': 'application/rss+xml; charset=utf-8' },
  });
};
