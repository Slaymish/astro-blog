# AGENTS.md

Guidance for any coding agent (Claude Code, opencode, Codex, …) working with code in this
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
pnpm run seed:books   # Writes the /reading notes, statuses and order; destructive, see Footguns
```

Run a single test file: `pnpm exec tsx --test tests/work.test.ts`.

The glob is `tests/*.test.ts`, not `tests/**` — tests in subdirectories will not run.

`pnpm exec knip` checks for dead code and unused dependencies (config in `knip.json`); there is
no package.json script for it. The shell entry point is explicitly listed in `knip.json` because Knip does not follow
imports made from an Astro `<script>` block.

## Environment

`INSIGHTS_TOKEN` gates both `/api/insights` and the private `/stats` page; without it they
return 503 rather than falling open. It is set in Netlify, not in the committed `.env`.

`SANITY_PROJECT_ID` is required and validated at config load, so a missing `.env` fails
before Astro starts. The id is public (`qnuj1c4o`, also in `netlify.toml` and CI). Defaults:
`SANITY_DATASET=production`, `SANITY_API_VERSION=2024-01-01`.

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
  `api/pdf.ts`, `api/collect.ts`, `api/insights.ts`, `api/cal-webhook.ts`, `api/recommend.ts`,
  and the private `stats.astro` page.
- `build: { format: 'file' }` and `trailingSlash: 'never'` — URLs emit as `/work.html`, and
  canonical tags omit the trailing slash. Keep these in step.

All published content comes from Sanity through `fetchSanity` in `src/lib/sanity.ts`. There are
no Astro content collections; the markdown copies that used to sit in `src/content/` were
removed on 2026-09-05 because nothing read them.

## Architecture

`ARCHITECTURE.md` is the authoritative description of boundaries and invariants — read it for
anything structural. `README.md` covers setup and the day-to-day commands. `PLANS.md` defines
the ExecPlan format for substantial features; instances live in `docs/exec-plans/`, finished
ones under `completed/`. `docs/portfolio-redesign.md` is the short note on the current
homepage and work pages (September 2026).

Layers: routes (`src/pages/`) own request-level fetching and page assembly; components
(`src/components/`) own presentation; `src/lib/` owns external clients and content transforms;
`src/sanity/schemaTypes/` owns the content model contract.

### Where to change X

- New or updated page route, and all API endpoints: `src/pages/*`
- Shared layout and global metadata: `src/components/layout/*`
- Feature components: `src/components/features/*`
- Theme controls: `src/components/theme/*`; theme CSS: `src/design-system/themes/*`
- Buttons, chips and form fields: `src/design-system/primitives.css` owns every variant and
  state; Astro pages render them through `src/components/ui/Button.astro` (`href` makes it a
  link) and the `.input`, `.select`, `.range`, `.chip` and `.field__*` classes. Do not style a
  control in a page's `<style>` block; add the state to the primitives instead.
- Site constants and canonical helpers: `src/lib/site.ts`
- Data access, transforms, canonical helpers: `src/lib/*`
- Content rendering and sanitisation: `src/lib/portableText.ts`, `src/lib/markdown.ts`,
  `src/lib/escape.ts`
- Page copy lives in two places, and that is the current state rather than a rule. The
  homepage, the `/work` index header, the two project blurbs on `/about` and the per-story
  introductions are written in their templates and in `src/lib/workEditorial.ts`. The About
  hero and background, CV, Writing, Contact and 404 pages read singleton documents through
  `src/lib/pageContent.ts` (seeded by `scripts/seed-page-copy.ts`), which throws when a
  singleton is missing rather than rendering empty markup.
- Book notes on `/reading`: `scripts/seed-book-notes.ts`; the route sorts by the book's
  `order` field within each status group, then by title. Books with the same `sharedNote`
  key render as one card (stacked covers, the first book's note). The recommendation box
  under the queue posts to `api/recommend.ts`, validated in `src/lib/recommendations.ts`
  and written to the `recommendations` blob store, one blob per title, nothing about the
  sender.
- Reading those recommendations back, and the nightly session report: `src/pages/stats.astro`,
  gated by `INSIGHTS_TOKEN` as `/stats?token=...`. Page views and events are deliberately not
  there; Umami Cloud owns those dashboards and a second copy would only drift.
- Work stories, their validation and hrefs: `src/sanity/schemaTypes/workStory.ts` and
  `src/lib/work.ts`; the curated homepage selection: `src/lib/workEditorial.ts`
- The posts-plus-reports stream shared by `/writing`, `/tags/[tag]` and the homepage:
  `src/lib/writingData.ts`
- Shared Sanity schemas: `src/sanity/schemaTypes/*`, imported by both Studio configs.
- Static assets: `public/*`

Non-obvious pieces:

- **The page is an ordinary scrolling document.** A WebGL page-fold effect used to own the
  scroll container and forced capture-phase listeners; it went on 2026-08-18. Bind scroll
  handlers to `window`. The decorative circuit overlay and the ambient background went with
  the September 2026 redesign, so `Layout.astro` now boots one shell module
  (`src/lib/shell/index.ts`: booking-ref rewriter, analytics beacon, code-copy buttons).
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
- All site copy is written with the `hamish-voice` skill in clean mode (Hamish's own
  register, spelling corrected). That covers page intros, book notes, blurbs, and anything
  else a visitor reads.
- Do not describe the site or Hamish in terms of candour: no "write-ups say what didn't
  work", "what I can talk about honestly", "what I would do differently". That formula is
  the house style of AI-written developer bios, and it was stripped from Sanity, `site.ts`
  and `llms.txt.ts` on 2026-08-21. Name the actual project instead. The same goes for
  section headings: "A decision I changed my mind about" is the formula; "Taking the SaaS
  layer out of You Inc" is the content.
- The work story schema still carries four legacy reflection fields (question, built,
  learned, differently). They are optional and nothing renders them; do not build a section
  around them.

## Repo conventions

- Keep changes minimal and task-scoped.
- Sanity schemas live only in `src/sanity/schemaTypes/`. Both Studio configs import them;
  do not recreate a schema mirror or a separate Studio dependency tree.
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
  undo and no dry-run mode. Reconcile Studio values into `scripts/seed-page-copy.ts` first. It
  is blocked by a hook until the write is acknowledged (see Automated checks).
- `pnpm run seed:books` patches every book's note, status and order from
  `scripts/seed-book-notes.ts`, so a note edited in Studio is lost on the next run. The notes
  there are the vault's `Reading List and thoughts.md` with spelling corrected; update the
  script from the vault, not the other way round. Same hook, same acknowledgement.

## Automated checks

`.claude/settings.json` wires three hooks, with scripts in `.claude/hooks/`. They enforce the
invariants above whose breakage is otherwise silent, so a warning from one is a real finding
rather than noise.

- **Before a Bash call** (`guard-destructive.sh`): blocks the two irreversible operations here.
  Scripts that write to the production Sanity dataset need `SANITY_WRITE_ACK=1` prefixed; git
  commands that throw away uncommitted work (`git checkout -- `, `git restore`,
  `git reset --hard`, `git clean -f`, `git stash drop`) need `GIT_DESTRUCTIVE_ACK=1`, and only
  fire when the tree is actually dirty. Branch switches and reads pass through untouched.
- **After an edit or write** (`check-invariants.sh`): reports a test
  file placed in a subdirectory where the glob will skip it, edits to `legacyRoutes.ts` that need
  the `netlify.toml` counterpart, edits to the routing and canonical surface, and colour tokens
  used with an opacity modifier.
- **Before the turn ends** (`verify-before-stop.sh`): when `.ts`, `.tsx` or `.astro` files under
  `src/` or `tests/` are dirty, runs `pnpm run test` and `pnpm exec astro check` (about 8s
  together) and blocks on failure. Results are cached against the tree, so an unchanged tree is
  not rechecked, and the same failure never blocks more than twice.
