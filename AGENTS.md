# AGENTS.md

This file is a task router for coding agents working in this repository.
Use it to find the right files fast, apply changes in the right layer, and avoid common mistakes.

## Start Here

- Project setup and commands: `README.md`
- System structure and invariants: `ARCHITECTURE.md`
- Complex work planning contract: `PLANS.md`
- Design references: `docs/design-docs/*`

## Fast Repo Map

- Routes and endpoints: `src/pages/*`
- Main-site shared shell: `src/components/layout/*`
- Main-site feature components: `src/components/features/*`
- Studio (separate visual subsystem): `src/studio/*` and `src/pages/studio/*`
- Sanity client and content transforms: `src/lib/*`
- Sanity schema (embedded studio): `src/sanity/schemaTypes/*`
- Standalone production studio app: `studio-production/*`
- Static assets: `public/*`
- Tests: `tests/*`
- CI workflow: `.github/workflows/ci.yml`

## Where To Go For X

- Add or change a page route: `src/pages/...`
- Change global metadata/canonical/social cards/JSON-LD: `src/components/layout/Layout.astro`
- Change canonical domain/site identity constants: `src/lib/site.ts`
- Change crawl artifacts (`robots`, `sitemap`, `rss`, `llms`):
  - `src/pages/robots.txt.ts`
  - `src/pages/sitemap.xml.ts`
  - `src/pages/rss.xml.ts`
  - `src/pages/llms.txt.ts`
- Change PDF proxy behavior (security-sensitive): `src/pages/api/pdf.ts`
- Change Sanity data model: `src/sanity/schemaTypes/*` (and mirror in `studio-production/schemaTypes/*`)
- Change post/report text rendering: `src/lib/portableText.ts`, `src/lib/markdown.ts`
- Change theme/accent controls: `src/theme/ThemeProvider.astro`, `src/components/theme/AccentPicker.astro`
- Change Studio look/interaction: `src/studio/StudioLayout.astro`, `src/studio/design.css`, `public/studio/studio-interactions.js`

## Commands

Run from repo root unless noted.

- Install deps: `npm ci`
- Dev server: `npm run dev`
- Build: `npm run build`
- Tests: `npm run test`
- Preview (note: Netlify adapter does not support local `astro preview` behavior for server output): `npm run preview`
- Standalone studio dev: `npm run studio:dev`
- Standalone studio build: `npm run studio:build`

## Environment and Config

Required for app build/runtime:

- `SANITY_PROJECT_ID`
- `SANITY_DATASET` (default `production`)
- `SANITY_API_VERSION` (default `2024-01-01`)

Config locations:

- Production Astro config: `astro.config.ts`
- Dev Astro config: `astro.config.dev.ts`
- Netlify settings and redirects: `netlify.toml`

## Working Rules for This Repo

- Prefer minimal, targeted edits.
- Do not commit generated output from `dist/` unless explicitly asked.
- Keep `src/sanity/schemaTypes/*` and `studio-production/schemaTypes/*` in sync when schema changes.
- If you change routing/canonical behavior, re-check `Layout.astro` and crawl endpoints together.
- If architectural boundaries or invariants change, update `ARCHITECTURE.md` in the same change.
- For substantial features/refactors, create and maintain an ExecPlan per `PLANS.md`.

## Known Footguns

- `SANITY_PROJECT_ID` missing will break build/config load early.
- Main content routes are server-rendered (`prerender = false` in many pages), so avoid assumptions that routes are static.
- `src/content.config.ts` defines Astro collections but runtime content currently comes from Sanity queries in route files.
- `src/pages/api/pdf.ts` is security-sensitive; preserve allowlist and MIME checks.
