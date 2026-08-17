# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **pnpm** (CI and Netlify both use it; `pnpm-lock.yaml` is the committed lockfile).

```bash
pnpm run dev          # Dev server on :4321 — uses astro.config.dev.ts (no Netlify adapter)
pnpm run build        # astro check && astro build — type errors fail the build
pnpm run test         # tsx --test tests/*.test.ts
pnpm run preview      # Preview the production build
pnpm run studio:dev   # Sanity Studio (separate app in studio-production/)
pnpm run seed:copy    # Publish the page-copy singletons; safe to re-run
```

Run a single test file: `pnpm exec tsx --test tests/circuit-geometry.test.ts`.

The glob is `tests/*.test.ts`, not `tests/**` — tests in subdirectories will not run.

`pnpm exec knip` checks for dead code and unused dependencies (config in `knip.json`); there is
no package.json script for it.

## Environment

`SANITY_PROJECT_ID` is required and validated at config load, so a missing `.env` fails
before Astro starts. Defaults: `SANITY_DATASET=production`, `SANITY_API_VERSION=2024-01-01`.

## Rendering model (read this before touching a route)

`output: 'static'` with the Netlify adapter. Every content route is baked to HTML at build
time from Sanity via `getStaticPaths`. Consequences that catch people out:

- **Request-time inputs do not exist on pages.** Query params, headers, and cookies must be
  resolved client-side (see the "from" back-link script in `src/pages/posts/[slug].astro`).
- **Publishing in Sanity requires a Netlify build hook** to appear on the site.
- The only server routes are the ones that opt out with `export const prerender = false`:
  `api/pdf.ts`, `api/collect.ts`, `api/insights.ts`, `api/cal-webhook.ts`.
- `build: { format: 'file' }` and `trailingSlash: 'never'` — URLs emit as `/work.html`, and
  canonical tags omit the trailing slash. Keep these in step.

Astro content collections (`src/content/`, `src/content.config.ts`) exist but are **not** the
runtime path. Published content comes from Sanity through `fetchSanity` in `src/lib/sanity.ts`.

## Architecture

`ARCHITECTURE.md` is the authoritative and current description of boundaries and invariants —
read it for anything structural. `AGENTS.md` is a file-level "where do I change X" map, and
`PLANS.md` defines the ExecPlan format expected for substantial features. Actual ExecPlan
instances live in `docs/exec-plans/`, design docs in `docs/design-docs/`, and known technical
debt (with evidence and next actions) in `docs/tech-debt-tracker.md`.

Layers: routes (`src/pages/`) own request-level fetching and page assembly; components
(`src/components/`) own presentation; `src/lib/` owns external clients and content transforms;
`src/sanity/schemaTypes/` owns the content model contract.

Non-obvious pieces:

- **The page is an ordinary scrolling document.** A WebGL page-fold effect (`Bend.tsx`) used to
  own the scroll container, which forced capture-phase scroll listeners and an element-swap dance
  in `Layout.astro`; it was removed on 2026-08-18 along with those workarounds. Bind scroll
  handlers to `window` — there is no longer a nested scroller to account for.
- **`src/lib/circuit/`** is the data-bus overlay. `geometry.ts` is pure, unit-tested routing
  maths; `engine.ts` owns DOM/SVG/lifecycle; `circuit.css` owns presentation. Geometry tokens
  in `tokens.css` must stay in px/ms/unitless — the engine reads them off computed style.
- **`src/lib/pageContent.ts`** fetches page copy as Sanity singletons by fixed document ID.
  Templates hold no hardcoded user-facing strings and there are no fallbacks, so a missing
  singleton throws rather than rendering empty markup.
- **`src/lib/embeddings.ts`** embeds the corpus locally at build time (`@huggingface/transformers`)
  for semantic related-content. No API key, no runtime service.
- **Analytics pipeline**: `api/collect.ts` writes anonymised session sequences to Netlify Blobs,
  `netlify/functions/session-insights.mts` synthesises them nightly (schedule declared in
  `netlify.toml`), `api/insights.ts` serves the token-gated report.

### Styling

Tailwind v4 via `@tailwindcss/vite`. `src/design-system/tokens.css` is the single source of
truth; `src/styles/globals.css` bridges tokens into Tailwind's `@theme inline`. Dark mode is
class-based (`.dark` on `<html>`), resolved by an inline script in `Layout.astro` before first
paint. Light and dark theme files must define the same semantic roles.

### Metadata and SEO

Centralised in `src/components/layout/Layout.astro` (OG, Twitter, JSON-LD, canonical, robots).
Crawl endpoints: `sitemap.xml.ts`, `robots.txt.ts`, `rss.xml.ts`, `llms.txt.ts`.

### Security-sensitive

`src/pages/api/pdf.ts` is an allowlisted HTTPS-only proxy for Sanity-hosted PDFs with
content-type validation and redirect blocking. Do not weaken those protections.

## Content rules

- Do not use em dashes in site content.

## Repo conventions

- Keep changes minimal and task-scoped.
- Sanity schema changes must land in **both** `src/sanity/schemaTypes/` and
  `studio-production/schemaTypes/`.
- Legacy URL handling is mirrored in two places: `src/lib/legacyRoutes.ts` and the `[[redirects]]`
  blocks in `netlify.toml`. Change both. Astro's `redirects` config is deliberately unused for
  these because it emits meta-refresh pages that outrank the Netlify rules.
- If routing/canonical behaviour changes, review `Layout.astro`, `src/lib/site.ts`, and the crawl
  endpoints together.
- If architecture or invariants change, update `ARCHITECTURE.md` in the same commit.
- Do not commit `dist/`.
