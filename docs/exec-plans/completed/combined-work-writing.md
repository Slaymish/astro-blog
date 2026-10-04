# Combine work and writing into one chronological index

This is a living ExecPlan maintained under `PLANS.md`. It describes implementation in `/Users/hamishburke/.codex/worktrees/47fe/astro-blog` without production Sanity writes or deployment.

## Purpose / Big Picture

Visitors can browse everything Hamish makes in one newest-first stream at `/work`, using an All / Work / Writing dropdown and shared topic chips. Bold year headings organise the stream. Existing designed WorkCard visuals and the writing row layout remain distinct, and individual content addresses remain stable.

## Progress

- [x] (2026-10-04) Read repository architecture, routing conventions, plan requirements and the clean-mode hamish-voice guide. Inspect current Sanity page copy and linked artifact tags without changing production.
- [x] (2026-10-04) Add shared content, tag defaults and optional Sanity copy fields.
- [x] (2026-10-04) Render mixed year groups and accessible URL-backed filters.
- [x] (2026-10-04) Consolidate navigation, old index URLs, tag pages and crawl surfaces.
- [x] (2026-10-04) Run meaningful tests, build, post-build tests, dead-code checks and Studio build.
- [x] (2026-10-04) Inspect desktop/mobile filters, empty states, browser history and unchanged homepage work visuals.

## Surprises & Discoveries

The worktree initially had no node_modules. Installing the existing frozen lockfile restored dependencies without changing their declarations. Work stories have no own tags yet, but five projects link to tagged posts or reports. Those linked artifacts give a content-backed default rather than guessed project topics.

## Decision Log

Decision: Keep `/work` as the single index, labelled Work & Writing. Redirect `/writing` to its Writing view, retain a canonicalised local fallback page, and preserve the old tag query. Rationale: work detail routes remain under their existing parent and writing readers keep a familiar subset. Date/author: 2026-10-04, Codex.

Decision: Reuse WorkCard unchanged and reuse EntryList for each writing entry. Rationale: the user explicitly values the project visuals and wants to revisit writing visuals later. Date/author: 2026-10-04, Codex.

Decision: Offer every topic, including topics attached to one entry. Missing work tags inherit the unique tags of linked artifacts; explicit empty arrays mean no topics. Rationale: filters should expose small topics and the model must work with existing production content. Date/author: 2026-10-04, Codex.

Decision: Add optional combined-index copy to the existing workIndexPage singleton, retaining current Sanity copy as a build-safe fallback. Rationale: production writes need approval and a schema initial value does not populate an existing document. Date/author: 2026-10-04, Codex.

## Outcomes & Retrospective

Implemented and validated on 2026-10-04: 162 tests pass before and after the build, knip and the Studio build are clean, and browser checks confirmed type and tag intersection, empty-year hiding, reset, query restoration, Back/Forward and no horizontal scroll at 375px. Finishing removed the writingFilter compatibility shim and the now-unused filterableTags helper, and fixed a case-sensitive pubDate selector in the RSS build test. Production copy and explicit project tags remain separately reviewable; no dataset write or deployment is authorised by this task.

## Context and Orientation

Routes in src/pages fetch Sanity content at build time. Components present it. Browser modules in src/client hide or reveal already rendered entries because a static route cannot read query parameters at request time. src/content/writing.ts merges posts and reports; WorkCard renders a project cover alongside its introduction. The canonical URL is the single public address search engines should index. Base.astro supplies canonical metadata and generated markdown links; netlify.toml owns redirects. The build's markdown twins are generated from main content by scripts/build-markdown.ts, never hand-written.

## Plan of Work

First add src/content/feed.ts with a discriminated union (an entry carrying either a work story or a writing entry), chronological merge, year grouping and all-topic discovery. Add optional tags to workStory and project linked-artifact projections, and optional combined copy in workIndexPage. Then add a presentation-only FeedIndex component that uses WorkCard and EntryList within year sections. Replace the work index assembly, and render the same feed in the writing fallback with canonical /work and noindex. Replace the writing-only client filter with a feed filter that combines type and tag, hides empty years, restores state from URLs and history, announces result counts, and supports a reset control. Keep unenhanced HTML as a full readable feed and reveal controls only when JavaScript is ready.

Update Header and detail-page back links, homepage index links, tag pages, sitemap and llms.txt. Tags include work and writing. Expand RSS to include reports and projects with unique existing detail URLs and fresh Sanity reads. Review Base.astro, src/site/seo.ts, src/site/config.ts and robots.txt together, adding only the canonical override required by the fallback. Update ARCHITECTURE.md for these stream and tag semantics.

## Concrete Steps

From the worktree run pnpm install --frozen-lockfile to restore existing locked packages. Edit the modules above, then run pnpm run test and SANITY_PROJECT_ID=qnuj1c4o pnpm run build. After build run pnpm run test again to exercise dist assertions, pnpm exec knip and pnpm run studio:build. Start SANITY_PROJECT_ID=qnuj1c4o pnpm run dev -- --host 127.0.0.1 and inspect /work, /work?type=writing&tag=ai and /work?type=work&tag=ai. Use the assigned available port if 4321 is occupied.

## Validation and Acceptance

Tests must prove cross-type chronological ordering (including date and datetime comparisons), exactly one entry per project, absent versus empty project tags, unique topic discovery, intersection filters and URL normalisation with unrelated query parameters and hashes preserved. Built HTML must have one canonical index, unique year headings, unchanged work-card markup, all original detail addresses, valid sitemap entries and markdown twins. Browser inspection must demonstrate dropdown plus tag intersection, empty year removal, a useful resettable empty state, query restoration, Back/Forward and keyboard use. At narrow width the covers and writing rows must fit without horizontal scrolling.

## Idempotence and Recovery

All content queries are read-only. Schema fields are optional so the current dataset builds. Repeat checks and local server startup safely; do not delete files or change history. No dependency declarations, production mutations or deploy commands are needed. Existing writing fallback HTML keeps local previews usable even without Netlify redirects.

## Artifacts and Notes

Netlify's redirect documentation confirms 301 redirects pass source query parameters through. Preserve the tag query in the writing alias rule. Review production copy as optional fields under workIndexPage.combined, and record a proposed payload after implementation, without executing it.

## Interfaces and Dependencies

Use existing Astro, Sanity, TypeScript, node:test and node-html-parser dependencies. src/content/feed.ts exports FeedEntry, mergeFeed(stories, writing), groupFeedByYear(entries), feedTags(entries) and getFeed(). src/client/feedFilter.ts exports initFeedFilter() and pure URL-state/matching helpers. FeedIndex receives entries and Sanity-backed copy as props and never fetches collections. No new packages are required.

Revision note: Initial plan records routing, backward-compatible tagging, copy fallback and concrete acceptance before implementation.
