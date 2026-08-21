# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository. It is the only agent-facing routing document: `AGENTS.md` was folded into it on
2026-08-21, so do not recreate that file.

## Commands

Package manager is **pnpm** (CI and Netlify both use it; `pnpm-lock.yaml` is the committed lockfile).

```bash
pnpm install --frozen-lockfile
pnpm run dev          # Dev server on :4321 — uses astro.config.dev.ts (no Netlify adapter)
pnpm run build        # astro check && astro build — type errors fail the build
pnpm run test         # tsx --test tests/*.test.ts
pnpm run preview      # Preview the production build
pnpm run studio:dev   # Sanity Studio (separate app in studio-production/)
pnpm run studio:build
pnpm run seed:copy    # Republishes the page-copy singletons; destructive, see Footguns
```

Run a single test file: `pnpm exec tsx --test tests/circuit-geometry.test.ts`.

The glob is `tests/*.test.ts`, not `tests/**` — tests in subdirectories will not run.

`pnpm exec knip` checks for dead code and unused dependencies (config in `knip.json`); there is
no package.json script for it.

## Environment

`SANITY_PROJECT_ID` is required and validated at config load, so a missing `.env` fails
before Astro starts. Defaults: `SANITY_DATASET=production`, `SANITY_API_VERSION=2024-01-01`.

CI (`.github/workflows/ci.yml`) runs tests and the build on Node 22 and pnpm 10 with those vars
set. A failure that only reproduces locally is usually a version or env mismatch.

Config files: `astro.config.ts`, `astro.config.dev.ts`, `sanity.config.ts`,
`studio-production/sanity.config.ts`, `netlify.toml`.

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
read it for anything structural. `README.md` covers setup and the day-to-day commands.
`PLANS.md` defines the ExecPlan format expected for substantial
features and refactors. Actual ExecPlan instances live in `docs/exec-plans/`, design docs in
`docs/design-docs/`, and known technical debt (with evidence and next actions) in
`docs/tech-debt-tracker.md`.

Layers: routes (`src/pages/`) own request-level fetching and page assembly; components
(`src/components/`) own presentation; `src/lib/` owns external clients and content transforms;
`src/sanity/schemaTypes/` owns the content model contract.

### Where to change X

- New or updated page route, and all API endpoints: `src/pages/*`
- Shared layout and global metadata: `src/components/layout/*`
- Feature components: `src/components/features/*`
- Theme controls: `src/components/theme/*`; theme CSS: `src/design-system/themes/*`
- Site constants and canonical helpers: `src/lib/site.ts`
- Data access, transforms, canonical helpers: `src/lib/*`
- Content rendering and sanitisation: `src/lib/portableText.ts`, `src/lib/markdown.ts`,
  `src/lib/escape.ts`
- Page copy (no hardcoded user-facing strings): the singleton schemas plus
  `src/lib/pageContent.ts` and `scripts/seed-page-copy.ts`
- Work vs project classification and the reflection fields: `src/sanity/schemaTypes/workStory.ts`
  and `src/lib/work.ts`
- The posts-plus-reports stream shared by `/writing`, `/tags/[tag]` and the homepage:
  `src/lib/writingData.ts`
- Canonical Sanity schemas: `src/sanity/schemaTypes/*`, mirrored in
  `studio-production/schemaTypes/*`
- Astro local content definitions: `src/content.config.ts`, `src/content/*`
- Static assets: `public/*`

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

Colour tokens are used whole. No opacity modifiers and no scale gradations
(`bg-brand-primary/60` is out); if a tinted variant is needed, stop and ask for a dedicated token.

### Metadata and SEO

Centralised in `src/components/layout/Layout.astro` (OG, Twitter, JSON-LD, canonical, robots).
Crawl endpoints: `sitemap.xml.ts`, `robots.txt.ts`, `rss.xml.ts`, `llms.txt.ts`.

### Security-sensitive

`src/pages/api/pdf.ts` is an allowlisted HTTPS-only proxy for Sanity-hosted PDFs with
content-type validation and redirect blocking. Do not weaken those protections: the allowlist,
HTTPS-only, redirect blocking and PDF MIME checks all stay. Never commit secrets.

## Content rules

- Do not use em dashes in site content.
- Do not describe the site or Hamish in terms of candour: no "write-ups say what didn't
  work", "what I can talk about honestly", "what I would do differently". That formula is
  the house style of AI-written developer bios, and it was stripped from Sanity, `site.ts`
  and `llms.txt.ts` on 2026-08-21. Name the actual project instead.

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
- Reading and searching files, `pnpm run test` and `pnpm run build` need no permission.
  Dependency changes, deploy commands, writes to the production Sanity dataset, and destructive
  operations (file deletion, history rewrites) are all ask-first.

## Footguns

- `fetchSanity` reads through Sanity's edge CDN, so content written to Sanity takes up to
  ~2 minutes to reach a build. A build run immediately after a write silently produces the old
  content. Use `fetchFreshSanity` only where staleness is unacceptable (currently RSS).
- The dev server caches the Sanity client at module scope. After changing page-copy singletons,
  restart `pnpm run dev`; a browser reload is not enough.
- `pnpm run seed:copy` uses `createOrReplace` and will overwrite copy edited in Studio, with no
  undo. Reconcile Studio values into `scripts/seed-page-copy.ts` first. The `copy-*` and
  `migrate-*` scripts also commit patches straight to the production dataset and have no dry-run
  mode. All of them are blocked by a hook until the write is acknowledged (see Automated checks).
- The circuit overlay's *markup contract* has no test coverage, though its routing maths does
  (`tests/circuit-geometry.test.ts`). A bus (`data-circuit`) needs both a `data-circuit-source`
  and at least one `data-circuit-node` inside the same region or it renders nothing, silently.
  Check the page visually after moving those attributes. Its grammar is
  `docs/design-docs/circuit-design-language.md`; routing decisions depend on real element boxes,
  so moving a source or a node changes the drawing.

## Automated checks

`.claude/settings.json` wires three hooks, with scripts in `.claude/hooks/`. They enforce the
invariants above whose breakage is otherwise silent, so a warning from one is a real finding
rather than noise.

- **Before a Bash call** (`guard-destructive.sh`): blocks the two irreversible operations here.
  Scripts that write to the production Sanity dataset need `SANITY_WRITE_ACK=1` prefixed; git
  commands that throw away uncommitted work (`git checkout -- `, `git restore`,
  `git reset --hard`, `git clean -f`, `git stash drop`) need `GIT_DESTRUCTIVE_ACK=1`, and only
  fire when the tree is actually dirty. Branch switches and reads pass through untouched.
- **After an edit or write** (`check-invariants.sh`): reports Sanity schema mirror drift, a test
  file placed in a subdirectory where the glob will skip it, edits to `legacyRoutes.ts` that need
  the `netlify.toml` counterpart, edits to the routing and canonical surface, and colour tokens
  used with an opacity modifier.
- **Before the turn ends** (`verify-before-stop.sh`): when `.ts`, `.tsx` or `.astro` files under
  `src/` or `tests/` are dirty, runs `pnpm run test` and `pnpm exec astro check` (about 8s
  together) and blocks on failure. Results are cached against the tree, so an unchanged tree is
  not rechecked, and the same failure never blocks more than twice.
