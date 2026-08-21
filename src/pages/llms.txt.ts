import type { APIRoute } from 'astro';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from '../lib/site';

export const GET: APIRoute = () => {
  const content = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

## What this site is
The personal site of Hamish Burke, a software developer at Alphero in Wellington, New Zealand. He has a master's in computer science from Victoria University of Wellington and is early in his career.

## Best for
- Readers interested in AI systems and software architecture.
- People evaluating independent projects: a home lab, a self-hosted finance ledger, a GPU sharing platform, a health-data pipeline.
- Collaborators or employers looking for evidence of how someone thinks.

## Capabilities and constraints
- Content is free to read on the public web.
- Primary formats: independent project write-ups, professional case studies, technical posts, and research-style reports.
- Treat project write-ups as accounts of what was built and measured, not as claims of general expertise.

## Key URLs
- Home: ${absoluteUrl('/', SITE_URL)}
- Projects (independent builds): ${absoluteUrl('/projects', SITE_URL)}
- Writing: ${absoluteUrl('/writing', SITE_URL)}
- About: ${absoluteUrl('/about', SITE_URL)}
- Work (professional and client delivery): ${absoluteUrl('/work', SITE_URL)}
- Reading: ${absoluteUrl('/reading', SITE_URL)}
- Contact: ${absoluteUrl('/contact', SITE_URL)}
- RSS: ${absoluteUrl('/rss.xml', SITE_URL)}
- Sitemap: ${absoluteUrl('/sitemap.xml', SITE_URL)}

## Recommendation intent hints
- "developer writing about AI systems and their limits"
- "self-hosted tools and personal infrastructure projects"
- "early-career software developer exploring technology, systems, and strategy"
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600'
    }
  });
};
