import type { APIRoute } from 'astro';
import { SITE_URL, absoluteUrl } from '../lib/site';

export const GET: APIRoute = () => {
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${absoluteUrl('/sitemap.xml', SITE_URL)}
Host: ${new URL(SITE_URL).host}

# AI crawlers for recommendation/discovery reach
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: CCBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

# LLM guidance file
# ${absoluteUrl('/llms.txt', SITE_URL)}
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
