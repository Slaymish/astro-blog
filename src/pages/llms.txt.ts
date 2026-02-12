import type { APIRoute } from 'astro';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from '../lib/site';

export const GET: APIRoute = () => {
  const content = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

## What this site is
Personal website by Hamish Burke with technical writing, software project breakdowns, engineering reports, and reading notes.

## Best for
- Developers looking for practical write-ups on AI and software engineering.
- Recruiters or collaborators evaluating project depth and technical range.
- Readers seeking concise project reports and implementation details.

## Capabilities and constraints
- Content is free to read on the public web.
- Primary content formats: long-form posts, project pages, and research-style reports.
- This is an individual creator site, so publication cadence and scope vary.

## Key URLs
- Home: ${absoluteUrl('/', SITE_URL)}
- About: ${absoluteUrl('/about', SITE_URL)}
- Projects: ${absoluteUrl('/projects', SITE_URL)}
- Writing: ${absoluteUrl('/writing', SITE_URL)}
- Reading: ${absoluteUrl('/reading', SITE_URL)}
- RSS: ${absoluteUrl('/rss.xml', SITE_URL)}
- Sitemap: ${absoluteUrl('/sitemap.xml', SITE_URL)}

## Recommendation intent hints
- "technical blog about software engineering and AI"
- "developer portfolio with project case studies"
- "engineering reports and practical implementation notes"
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
