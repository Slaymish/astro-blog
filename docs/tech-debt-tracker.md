# Tech Debt Tracker

Last updated: 2026-08-12

This document tracks known technical debt in the codebase with evidence and next actions.

## Prioritization

- `P0`: Must fix before shipping major changes.
- `P1`: High-value debt; fix in next active iteration.
- `P2`: Important, but can be scheduled.
- `P3`: Cleanup / quality improvements.

## Active Debt

### TD-002 (`P1`) - Raw `innerHTML` writes in feature component

- Area: Frontend security hardening.
- Evidence:
  - `src/components/features/HiddenContent.astro:267`
  - `src/components/features/HiddenContent.astro:295`
- Risk:
  - Current values are controlled, but the pattern is brittle and can become an XSS sink if future values become dynamic.
- Recommended fix:
  - Replace `innerHTML` with `textContent` and explicit element creation.
  - Add a lint/test guard against new raw HTML sinks in interactive components.

### TD-003 (`P1`) - Duplicate Sanity schema definitions (drift risk)

- Area: Content model maintainability.
- Evidence:
  - Embedded schema: `src/sanity/schemaTypes/*`
  - Standalone studio schema: `studio-production/schemaTypes/*`
- Risk:
  - Future schema edits can diverge between copies.
  - Silent runtime/editor mismatch risk.
- Observed (2026-08-12): this risk materialised. `src/sanity/schemaTypes/project.ts` had a
  `relatedPost` reference field that the studio copy lacked, so the standalone Studio could
  not edit it. Both copies are now byte-identical.
- Recommended fix:
  - Extract shared schema package/module and import from both app and standalone studio.
  - Add CI check to fail if schema directories diverge. Until then, the cheap manual check is:
    `for f in $(ls src/sanity/schemaTypes/); do diff -q "src/sanity/schemaTypes/$f" "studio-production/schemaTypes/$f"; done`

### TD-004 (`P1`) - Dependency vulnerability backlog

- Area: Supply-chain security.
- Evidence:
  - `npm audit` (2026-02-12): `30` total (`9 high`, `18 moderate`, `3 low`).
  - High-impact examples include `astro`, `devalue`, `h3`, `glob`, `tar`, `qs` (transitive/direct mix).
- Risk:
  - Increased exposure window for known advisories.
- Recommended fix:
  - Run a staged upgrade pass with lockfile refresh and full regression testing.
  - Prioritize direct dependencies first (`astro`, `@astrojs/*`, `@sanity/*`, `js-yaml`).

### TD-005 (`P2`) - Bundle size warnings in production build

- Area: Performance.
- Evidence:
  - `npm run build` reports large chunks (>500kB).
  - Notable outputs include:
    - `dist/_astro/studio-component.DSbb9Hoy.js` (~5.4MB)
    - `dist/_astro/VideoPlayer.lY9N-Bhj.js` (~1.0MB)
- Risk:
  - Slower load/parse time, especially on mobile or lower-end devices.
- Recommended fix:
  - Introduce code-splitting and lazy loading for heavy studio/client features.
  - Set chunk budgets and track them in CI.

### TD-006 (`P2`) - `preview` script is non-functional in current adapter setup

- Area: Developer experience.
- Evidence:
  - With required env set (`SANITY_PROJECT_ID`), `npm run preview` fails:
  - `@astrojs/netlify adapter does not support the preview command`.
- Risk:
  - Confusing local workflow; wasted time during verification.
- Recommended fix:
  - Update scripts/docs to provide a supported local verification path for server output.
  - Option: dedicated local config/script for preview-equivalent behavior.

### TD-007 (`P2`) - Astro content collections are defined but not used by runtime routes

- Area: Architectural clarity.
- Evidence:
  - Collection definitions exist: `src/content.config.ts`.
  - Runtime pages currently fetch from Sanity directly via GROQ queries.
- Risk:
  - Dual content-model mental model; contributors may update unused pathways.
- Recommended fix:
  - Either remove unused collections, or adopt them intentionally and document ownership boundary.

### TD-008 (`P3`) - Thin automated test coverage across page/content surfaces

- Area: Reliability.
- Evidence:
  - Current tests are limited to:
    - `tests/escape.test.ts`
    - `tests/markdown-safety.test.ts`
    - `tests/pdf-route.test.ts`
- Risk:
  - Regressions in route rendering, SEO endpoints, and Sanity-query pages can slip through.
- Recommended fix:
  - Add tests for:
    - SEO/crawl endpoints (`/robots.txt`, `/sitemap.xml`, `/rss.xml`, `/llms.txt`).
    - Core route rendering paths (`/`, `/writing`, `/projects`, dynamic slug routes).

## Closed Debt

- **TD-001 (`P0`) - Markdown safety behavior and test mismatch.** Closed 2026-08-12.
  `src/lib/markdown.ts` now strips script tags and `javascript:` links, and
  `tests/markdown-safety.test.ts` passes. The entry had been left open in this file after
  the fix landed; the whole suite is green (44/44). No further action.

## Notes

- Keep this file focused on actionable debt, not feature ideas.
- When an item is resolved, move it to `Closed Debt` with date and PR/commit reference.
