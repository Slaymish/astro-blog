import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { supabase } from '../utils/database';

export const GET: APIRoute = async () => {
  const siteURL = 'https://hamishburke.dev'; // Update this to your actual domain

  let posts: any[] = [];
  
  if (supabase) {
    const { data } = await supabase
      .from('posts')
      .select('slug, created_at, updated_at')
      .order('created_at', { ascending: false });
    
    posts = data || [];
  }

  if (posts.length === 0) {
    const contentPosts = await getCollection('posts');
    posts = contentPosts
      .filter(post => !post.data.draft)
      .map(post => ({
        slug: post.id.replace(/\.(md|mdx)$/, ''),
        created_at: post.data.pubDate,
        updated_at: post.data.pubDate,
      }));
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage -->
  <url>
    <loc>${siteURL}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Blog posts -->
  ${posts.map(post => `
  <url>
    <loc>${siteURL}/posts/${post.slug}</loc>
    <lastmod>${new Date(post.updated_at || post.created_at).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
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
