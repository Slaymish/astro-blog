import type { APIRoute } from 'astro';
import { fetchSanity } from '../lib/sanity';

export const GET: APIRoute = async () => {
  const siteURL = 'https://hamishburke.dev'; // Update this to your actual domain

  const posts = await fetchSanity<Array<{ slug: string; publishedAt: string; updatedAt?: string }>>(`
    *[_type == "post"] | order(publishedAt desc){
      "slug": slug.current,
      publishedAt,
      updatedAt
    }
  `);

  const projects = await fetchSanity<Array<{ slug: string; date: string }>>(`
    *[_type == "project"] | order(date desc){
      "slug": slug.current,
      date
    }
  `);

  const reports = await fetchSanity<Array<{ slug: string; publishedAt: string }>>(`
    *[_type == "report"] | order(publishedAt desc){
      "slug": slug.current,
      publishedAt
    }
  `);

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage -->
  <url>
    <loc>${siteURL}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>

  <url>
    <loc>${siteURL}/projects</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>${siteURL}/writing</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>${siteURL}/reading</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <!-- Blog posts -->
  ${posts.map(post => `
  <url>
    <loc>${siteURL}/posts/${post.slug}</loc>
    <lastmod>${new Date(post.updatedAt || post.publishedAt).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}

  <!-- Projects -->
  ${projects.map(project => `
  <url>
    <loc>${siteURL}/projects/${project.slug}</loc>
    <lastmod>${new Date(project.date).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}

  <!-- Reports -->
  ${reports.map(report => `
  <url>
    <loc>${siteURL}/reports/${report.slug}</loc>
    <lastmod>${new Date(report.publishedAt).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
  
  <!-- Tag pages (if you have them) -->
  <!-- Add other static pages here -->
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
