import type { APIRoute } from 'astro';
import { fetchSanity } from '../lib/sanity';
import { portableTextToPlainText } from '../lib/portableText';
import { markdownToPlainText } from '../lib/markdown';
import { escapeXml } from '../lib/escape';
import { CONTACT_EMAIL, SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from '../lib/site';

type RssPost = {
  title: string;
  slug: string;
  publishedAt: string;
  body?: any;
  markdownBody?: string;
  tags?: string[];
};

export const GET: APIRoute = async () => {
  const posts = await fetchSanity<RssPost[]>(`
    *[_type == "post"] | order(publishedAt desc)[0...50]{
      title,
      "slug": slug.current,
      publishedAt,
      tags,
      body,
      markdownBody
    }
  `);

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <link>${escapeXml(absoluteUrl('/', SITE_URL))}</link>
    <language>en-us</language>
    <managingEditor>${CONTACT_EMAIL} (Hamish Burke)</managingEditor>
    <webMaster>${CONTACT_EMAIL} (Hamish Burke)</webMaster>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(absoluteUrl('/rss.xml', SITE_URL))}" rel="self" type="application/rss+xml"/>

    ${posts
      .map((post) => {
        const cleanContentSource = post.markdownBody
          ? markdownToPlainText(post.markdownBody)
          : portableTextToPlainText(post.body);
        const cleanContent = cleanContentSource.substring(0, 300);
        const categories = post.tags || [];
        const postUrl = absoluteUrl(`/posts/${post.slug}`, SITE_URL);

        return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(postUrl)}</link>
      <guid>${escapeXml(postUrl)}</guid>
      <description>${escapeXml(`${cleanContent}...`)}</description>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <author>${CONTACT_EMAIL} (Hamish Burke)</author>
      ${categories.map((cat: string) => `<category>${escapeXml(cat)}</category>`).join('')}
    </item>`;
      })
      .join('')}
  </channel>
</rss>`;

  return new Response(rssXml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
