import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const siteURL = 'https://hamishburke.dev'; // Update this to your actual domain
  
  const robotsTxt = `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${siteURL}/sitemap.xml

# LLM and AI crawlers
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: CCBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Claude-Web
Allow: /

# Block certain paths if needed
# Disallow: /admin/
# Disallow: /private/

# Crawl delay (optional, in seconds)
# Crawl-delay: 1`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    }
  });
};
