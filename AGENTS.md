# AGENTS.md

Use this file to route coding-agent work in this repo.

## Start Here

- Setup and daily commands: `README.md`
- Architecture boundaries/invariants: `ARCHITECTURE.md`
- Large-task planning protocol: `PLANS.md`
- Design docs: `docs/design-docs/*`

## Fast Map

- Routes and endpoints: `src/pages/*`
- Shared layout + global metadata: `src/components/layout/*`
- Feature components: `src/components/features/*`
- Theme controls: `src/components/theme/*`; theme CSS: `src/design-system/themes/*`
- Data access + transforms + canonical helpers: `src/lib/*`
- Astro local content definitions: `src/content.config.ts`, `src/content/*`
- Canonical Sanity schemas: `src/sanity/schemaTypes/*`
- Standalone studio + mirrored schemas: `studio-production/*`, `studio-production/schemaTypes/*`
- Static assets: `public/*`
- Tests: `tests/*`
- CI: `.github/workflows/ci.yml`

## Where To Change X

- New/updated page route: `src/pages/...`
- Canonical/OG/Twitter/JSON-LD behavior: `src/components/layout/Layout.astro`
- Site constants/canonical helpers: `src/lib/site.ts`
- Crawl files: `src/pages/robots.txt.ts`, `src/pages/sitemap.xml.ts`, `src/pages/rss.xml.ts`, `src/pages/llms.txt.ts`
- PDF proxy (security-sensitive): `src/pages/api/pdf.ts`
- Content rendering/sanitization: `src/lib/portableText.ts`, `src/lib/markdown.ts`, `src/lib/escape.ts`
- Sanity schema updates: change both `src/sanity/schemaTypes/*` and `studio-production/schemaTypes/*`
- Page copy (no hardcoded user-facing strings): the singleton schemas plus `src/lib/pageContent.ts` and `scripts/seed-page-copy.ts`
- Work vs project classification and the reflection fields: `src/sanity/schemaTypes/workStory.ts` and `src/lib/work.ts`
- The posts-plus-reports stream shared by `/writing`, `/tags/[tag]` and the homepage: `src/lib/writingData.ts`

## Commands

Run from repo root unless noted.

- Install: `pnpm install --frozen-lockfile`
- Dev: `pnpm run dev`
- Build: `pnpm run build`
- Test: `pnpm run test`
- Preview: `pnpm run preview`
- Studio dev/build: `pnpm run studio:dev`, `pnpm run studio:build`

## Environment + Config

Required env vars:

- `SANITY_PROJECT_ID`
- `SANITY_DATASET` (default `production`)
- `SANITY_API_VERSION` (default `2024-01-01`)

Key config files:

- `astro.config.ts`, `astro.config.dev.ts`
- `sanity.config.ts`, `studio-production/sanity.config.ts`
- `netlify.toml`
- `.github/workflows/ci.yml`

## Safety Rules

Allowed without asking:

- Read/search files
- Run `pnpm run test` and `pnpm run build`

Ask first:

- Dependency changes
- Deploy commands
- Destructive operations (file deletion, history rewrites)

Never:

- Commit secrets
- Weaken protections in `src/pages/api/pdf.ts` (allowlist, HTTPS-only, redirect blocking, PDF MIME checks)

## Repo-Specific Rules

- Keep edits minimal and task-scoped.
- Do not commit `dist/` unless explicitly requested.
- Keep mirrored schemas in sync across both schema directories.
- If routing/canonical behavior changes, review `Layout.astro`, `src/lib/site.ts`, and crawl endpoints together.
- If architecture/invariants change, update `ARCHITECTURE.md` in the same change.
- Use an ExecPlan for substantial features/refactors per `PLANS.md`.

## Footguns

- Missing `SANITY_PROJECT_ID` fails config load early.
- `fetchSanity` reads through Sanity's edge CDN, so content written to Sanity takes up to ~2 minutes to reach a build. A build run immediately after a write silently produces the old content. Use `fetchFreshSanity` only where staleness is unacceptable (currently RSS).
- The dev server caches the Sanity client at module scope. After changing page-copy singletons, restart `pnpm run dev`; a browser reload is not enough.
- `pnpm run seed:copy` uses `createOrReplace` and will overwrite copy edited in Studio. Reconcile Studio values into `scripts/seed-page-copy.ts` before running it.
- The circuit overlay is a markup contract with no test coverage. A bus (`data-circuit`) needs both a `data-circuit-source` and at least one `data-circuit-node` inside the same region or it renders nothing, silently. Check the page visually after moving those attributes.
- Content routes are prerendered (`output: 'static'`; only `src/pages/api/*` opts out with `prerender = false`), so request-time inputs such as query params are unavailable on pages and must be resolved client-side.
- Publishing in Sanity only reaches the live site once a Netlify build runs.
- `src/content.config.ts` exists, but published runtime content is fetched from Sanity in routes.
- CI runs Node 22 and pnpm 10 with Sanity env vars; local failures are often env/version mismatch.
