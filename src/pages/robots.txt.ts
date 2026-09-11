import type { APIRoute } from 'astro';
import { absoluteUrl } from '../site/config';

export const GET: APIRoute = () => {
  // The per-crawler blocks the old file carried all said `Allow: /`, which the
  // wildcard already says. The non-standard `Host:` line went with them.
  const body = `User-agent: *
Allow: /
Disallow: /stats
Disallow: /reading/sent

Sitemap: ${absoluteUrl('/sitemap.xml')}
`;

  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
};
