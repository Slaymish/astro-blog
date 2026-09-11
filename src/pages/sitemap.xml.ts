import type { APIRoute } from 'astro';
import { getNowPage, getPosts, getReports, getTags, getWorkStories } from '../content/queries';
import { tagSlug } from '../content/writing';
import { escapeXml } from '../site/escape';
import { absoluteUrl } from '../site/config';

/**
 * Every public page once. `/stats` and `/reading/sent` are never listed, and the
 * static pages carry no `lastmod`: a build timestamp would tell a crawler the
 * page changed every deploy, which is worse than saying nothing.
 */
const STATIC_PATHS = [
  '/',
  '/work',
  '/writing',
  '/reading',
  '/about',
  '/cv',
  '/contact',
  '/privacy',
  '/terms',
];

function entry(path: string, lastmod?: string): string {
  const modified = lastmod ? `<lastmod>${escapeXml(lastmod.slice(0, 10))}</lastmod>` : '';
  return `  <url><loc>${escapeXml(absoluteUrl(path))}</loc>${modified}</url>`;
}

export const GET: APIRoute = async () => {
  const [stories, posts, reports, tags, now] = await Promise.all([
    getWorkStories(),
    getPosts(),
    getReports(),
    getTags(),
    getNowPage(),
  ]);

  const urls = [
    ...STATIC_PATHS.map((path) => entry(path)),
    entry('/now', now.updatedAt),
    ...stories.map((story) => entry(`/work/${story.slug}`, story.date)),
    ...posts.map((post) => entry(`/posts/${post.slug}`, post.updatedAt ?? post.publishedAt)),
    ...reports.map((report) => entry(`/reports/${report.slug}`, report.publishedAt)),
    ...tags.map((tag) => entry(`/tags/${tagSlug(tag)}`)),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;

  return new Response(xml, {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
};
