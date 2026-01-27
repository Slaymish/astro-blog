import type { APIRoute } from 'astro';
import { fetchSanity } from '../lib/sanity';
import { portableTextToPlainText } from '../lib/portableText';

export const GET: APIRoute = async () => {
  const siteURL = 'https://hamishburke.dev'; // Update this to your actual domain

  const posts = await fetchSanity<Array<{ title: string; slug: string; publishedAt: string; body?: any; tags?: string[] }>>(`
    *[_type == "post"] | order(publishedAt desc)[0...50]{
      title,
      "slug": slug.current,
      publishedAt,
      tags,
      body
    }
  `);

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Hamish's Blog</title>
    <description>Software engineering, AI, mathematics, and technology insights by Hamish Burke</description>
    <link>${siteURL}</link>
    <language>en-us</language>
    <managingEditor>hamish@your-domain.com (Hamish Burke)</managingEditor>
    <webMaster>hamish@your-domain.com (Hamish Burke)</webMaster>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteURL}/rss.xml" rel="self" type="application/rss+xml"/>
    
    ${posts.map(post => {
      const cleanContent = portableTextToPlainText(post.body).substring(0, 300);
      const categories = post.tags || [];
      
      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteURL}/posts/${post.slug}</link>
      <guid>${siteURL}/posts/${post.slug}</guid>
      <description><![CDATA[${cleanContent}...]]></description>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <author>hamish@your-domain.com (Hamish Burke)</author>
      ${categories.map((cat: string) => `<category>${cat}</category>`).join('')}
    </item>`;
    }).join('')}
  </channel>
</rss>`;

  return new Response(rssXml, {
    headers: {
      'Content-Type': 'application/rss+xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
