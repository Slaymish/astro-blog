# Connect the site's public knowledge graph

This ExecPlan is maintained according to PLANS.md. Its Progress, Surprises & Discoveries, Decision Log and Outcomes & Retrospective sections must remain current.

## Purpose / Big Picture

Readers and crawlers should be able to identify Hamish, connect his articles and reports to their pages, discover the items shown in indexes and understand topic relationships. JSON-LD is a structured description embedded in the HTML; its graph connects entities through stable URL identifiers. Enrichment must describe the visible content rather than invent credentials or repeat unrelated content everywhere. The separately authorised content change adds Read on Alphero to The City's existing link controls.

## Progress

- [x] (2026-10-06 NZDT) Inspect metadata builder, routes, content models and four crawl endpoints.
- [x] (2026-10-06 NZDT) Publish and verify the Alphero link using the existing authenticated Sanity session.
- [x] Implement connected page/content/image/topic/list nodes and supply content from routes.
- [x] Replace the static llms.txt directory with a generated content catalogue.
- [x] Add regression coverage; run tests, build, tests again, knip and Studio build.
- [x] Trigger a delayed Netlify build and verify deployed content on the deploy permalink.

## Surprises & Discoveries

The existing Sanity token in .env returned 401 Session not found. The already authenticated CLI session succeeded without changing access. Content was published at 2026-10-05T21:48:54Z. The site's Netlify id is 29001146-bec3-4edb-8751-9378a0204baa and its name is hamishswords. The site's production build follows the GitHub main branch; local code changes do not reach that build unless pushed or deployed separately.

Existing JSON-LD includes Person, WebSite and a page or article, but content nodes have no identifiers, article pages omit a separate WebPage, the Person image is an app icon, and collections omit their contents.

## Decision Log

Use the existing Sanity fields and visible content as the metadata source. Keep the central src/site/seo.ts graph builder, one graph per page, existing canonicals and markdown negotiation. Use specialised page types where appropriate, full article text and reading counts, report PDF encodings, topic identities and ordered lists of displayed entries. External article links are related resources, not proof that the project page and external article are identical. Do not add ratings, unverified qualifications, fake FAQs or app offers. This decision reflects the user's request for a detailed graph while respecting Google's representativeness requirements.

## Outcomes & Retrospective

Implementation is complete. The production build, all 183 tests, knip and Studio build passed. The authorised delayed content build was verified on deploy 6ac41c7087682ef46f44825a: The City includes the Alphero link in HTML and negotiated Markdown, and the home and about pages return successful responses. Production code deployment is separate from the authorised content-only follow-up build; the metadata changes are local until pushed and deployed. No dependencies or canonicals changed.

## Context and Orientation

src/site/seo.ts returns the metadata graph used by src/layouts/Base.astro. Routes own Sanity fetching and can supply additional plain-text content and displayed entries to Base.astro. src/content/types.ts describes the content contract; src/content/queries.ts memoises public reads. src/pages/llms.txt.ts, robots.txt.ts, sitemap.xml.ts and rss.xml.ts are the crawl surface. Canonicals and redirects remain unchanged. tests/site.test.ts exercises the pure builder; tests/build-output.test.ts checks generated HTML. dist is generated and must never be committed.

## Plan of Work

First extend MetadataInput with explicit optional page type, profile image, article details, displayed list items, page topics and links. Add stable IDs and connect the graph in src/site/seo.ts. Pass optimised portrait metadata from Base.astro and route-specific content from posts, reports, work, about, contact, reading, home and indexes. Reuse pure helpers for mapping feeds and topics rather than duplicate route logic. Expand llms.txt using existing collection titles, summaries and project links; retain access and scope information. Update ARCHITECTURE.md with the enriched graph invariants and document a review report.

## Concrete Steps

Work from /Users/hamish/Documents/Personal/astro-blog. Run pnpm run test, pnpm run build, pnpm run test, pnpm exec knip and pnpm run studio:build. Each must exit zero. Inspect JSON-LD from dist/index.html, dist/about.html, dist/work.html, one post, one report, one work page and dist/reading.html. Verify unique graph IDs, matching canonical page IDs, resolvable references and content-derived lists.

Several minutes after the Sanity write, run netlify api createSiteBuild --data '{"site_id":"29001146-bec3-4edb-8751-9378a0204baa"}'. Read the returned deploy id and check its state with Netlify's API. Fetch https://<deploy-id>--hamishswords.netlify.app/work/the-city and other pages to verify the link and successful HTML serving. Local edge/CDN freshness is not evidence about the build region.

## Validation and Acceptance

The City's existing hero controls must include Read on Alphero with the supplied URL and accessible new-tab notice. Each public page must have one valid JSON-LD graph and stable page/entity IDs. An article's WebPage mainEntity must point to its content node, the content must point back to its WebPage, and both must identify the same author and site. Collections must list precisely their visible entries in order. Reports must expose the PDF as an encoding, not claim its text was extracted. Profile pages must identify Hamish as mainEntity and use a real portrait. Topic references must use the same URLs as tag pages. llms.txt must catalogue the existing content and preserve its limitations. No secret or private stats data enters the graph or catalogue.

## Idempotence and Recovery

The content patch checks for the external URL before inserting and preserves the existing link array. A pre-write document backup is at /tmp/the-city-before-alphero.json. Build commands may be rerun; never delete user work or generated files as a cleanup shortcut. Local code is reviewed through git diff and can be revised file by file. Preserve the user's package.json and local-settings changes.

## Artifacts and Notes

The patch source is /tmp/the-city-alphero-patch.json. Validation logs should be kept under /tmp and summarised in docs/reviews/2026-10-06-knowledge-graph.md. No dataset credentials should appear in either document.

## Interfaces and Dependencies

MetadataInput remains exported from src/site/seo.ts. All additions are optional so private/server pages and existing consumers remain compatible. The builder must remain importable under tsx without astro:env/server; data fetching remains in routes/content helpers. Use existing Astro image optimisation, markdown/Portable Text renderers, node:test and node-html-parser. Add no dependencies.
