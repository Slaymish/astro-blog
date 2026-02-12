import type { APIRoute } from 'astro';
import { fetchSanity } from '../lib/sanity';
import { SITE_URL, absoluteUrl } from '../lib/site';
import { createSlug } from '../utils/slug';

type SitemapEntry = {
  loc: string;
  lastmod: string;
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: string;
};

type PostSitemapDoc = {
  slug: string;
  publishedAt: string;
  updatedAt?: string;
};

type ProjectSitemapDoc = {
  slug: string;
  date: string;
};

type ReportSitemapDoc = {
  slug: string;
  publishedAt: string;
};

async function safeFetch<T>(query: string): Promise<T[]> {
  try {
    return await fetchSanity<T[]>(query);
  } catch (error) {
    console.error('[sitemap] Failed Sanity fetch:', error);
    return [];
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function entryToXml(entry: SitemapEntry): string {
  return `
  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`;
}

export const GET: APIRoute = async () => {
  const now = new Date().toISOString();

  const [posts, projects, reports, tags] = await Promise.all([
    safeFetch<PostSitemapDoc>(`
      *[_type == "post" && defined(slug.current)] | order(coalesce(updatedAt, publishedAt) desc){
        "slug": slug.current,
        publishedAt,
        updatedAt
      }
    `),
    safeFetch<ProjectSitemapDoc>(`
      *[_type == "project" && defined(slug.current)] | order(date desc){
        "slug": slug.current,
        date
      }
    `),
    safeFetch<ReportSitemapDoc>(`
      *[_type == "report" && defined(slug.current)] | order(publishedAt desc){
        "slug": slug.current,
        publishedAt
      }
    `),
    safeFetch<string>(`
      array::unique(*[_type in ["post", "report"]].tags[])
    `)
  ]);

  const entries: SitemapEntry[] = [
    { loc: absoluteUrl('/', SITE_URL), lastmod: now, changefreq: 'weekly', priority: '1.0' },
    { loc: absoluteUrl('/about', SITE_URL), lastmod: now, changefreq: 'monthly', priority: '0.6' },
    { loc: absoluteUrl('/projects', SITE_URL), lastmod: now, changefreq: 'weekly', priority: '0.8' },
    { loc: absoluteUrl('/writing', SITE_URL), lastmod: now, changefreq: 'weekly', priority: '0.8' },
    { loc: absoluteUrl('/reading', SITE_URL), lastmod: now, changefreq: 'weekly', priority: '0.7' },
    { loc: absoluteUrl('/cv', SITE_URL), lastmod: now, changefreq: 'monthly', priority: '0.5' },
    { loc: absoluteUrl('/studio', SITE_URL), lastmod: now, changefreq: 'weekly', priority: '0.6' }
  ];

  for (const post of posts) {
    entries.push({
      loc: absoluteUrl(`/posts/${post.slug}`, SITE_URL),
      lastmod: new Date(post.updatedAt || post.publishedAt).toISOString(),
      changefreq: 'monthly',
      priority: '0.8'
    });
  }

  for (const project of projects) {
    entries.push({
      loc: absoluteUrl(`/projects/${project.slug}`, SITE_URL),
      lastmod: new Date(project.date).toISOString(),
      changefreq: 'monthly',
      priority: '0.7'
    });
  }

  for (const report of reports) {
    entries.push({
      loc: absoluteUrl(`/reports/${report.slug}`, SITE_URL),
      lastmod: new Date(report.publishedAt).toISOString(),
      changefreq: 'monthly',
      priority: '0.7'
    });
  }

  for (const tag of tags.filter(Boolean)) {
    entries.push({
      loc: absoluteUrl(`/tags/${createSlug(tag)}`, SITE_URL),
      lastmod: now,
      changefreq: 'weekly',
      priority: '0.5'
    });
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.map(entryToXml).join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
