# AGENTS.md

This file routes coding-agent work in this repository.
Use it to find the right files quickly, apply changes in the correct layer, and avoid common mistakes.

## Start Here

- Project setup and commands: `README.md`
- System structure and invariants: `ARCHITECTURE.md`
- Complex work planning contract: `PLANS.md`
- Design references: `docs/design-docs/*`

## Fast Repo Map

- Routes and endpoints (site + API + crawl artifacts): `src/pages/*`
- Main-site shared shell and metadata surface: `src/components/layout/*`
- Main-site feature components: `src/components/features/*`
- Theme/accent UI: `src/components/theme/*`, `src/theme/*`
- Sanity client, canonical helpers, and content transforms: `src/lib/*`
- Astro content collections (local content definitions): `src/content.config.ts`, `src/content/*`
- Canonical Sanity schemas: `src/sanity/schemaTypes/*`
- Standalone production studio app and mirrored schemas: `studio-production/*`, `studio-production/schemaTypes/*`
- Static assets: `public/*`
- Tests: `tests/*`
- CI workflow: `.github/workflows/ci.yml`

## Where To Go For X

- Add or change a page route: `src/pages/...`
- Change global metadata/canonical/OG/Twitter/JSON-LD: `src/components/layout/Layout.astro`
- Change canonical domain/site identity constants/helpers: `src/lib/site.ts`
- Change crawl artifacts: `src/pages/robots.txt.ts`, `src/pages/sitemap.xml.ts`, `src/pages/rss.xml.ts`, `src/pages/llms.txt.ts`
- Change PDF proxy behavior (security-sensitive): `src/pages/api/pdf.ts`
- Change post/report text rendering and sanitization: `src/lib/portableText.ts`, `src/lib/markdown.ts`, `src/lib/escape.ts`
- Change theme/accent controls: `src/theme/ThemeProvider.astro`, `src/components/theme/AccentPicker.astro`
- Change Sanity data model: update both `src/sanity/schemaTypes/*` and `studio-production/schemaTypes/*`
- Change standalone studio behavior/config: `studio-production/*`

## Commands

Run from repo root unless noted.

- Install deps: `npm ci`
- Dev server (Astro, dev config): `npm run dev`
- Dev server (Astro default): `npm run start`
- Build: `npm run build`
- Tests: `npm run test`
- Preview build: `npm run preview`
- Standalone studio dev: `npm run studio:dev`
- Standalone studio build: `npm run studio:build`
- Asset/reference update utilities: `npm run convert:webp`, `npm run update:references`, `npm run convert:all`

## Environment and Config

Required for app build/runtime:

- `SANITY_PROJECT_ID`
- `SANITY_DATASET` (default `production`)
- `SANITY_API_VERSION` (default `2024-01-01`)

Config locations:

- Production Astro config: `astro.config.ts`
- Dev Astro config: `astro.config.dev.ts`
- Root Sanity config: `sanity.config.ts`
- Standalone studio config: `studio-production/sanity.config.ts`
- Netlify settings and redirects: `netlify.toml`
- CI pipeline: `.github/workflows/ci.yml`

## Safety and Permissions

Allowed without asking:

- Read/list/search files
- Run targeted checks and tests (`npm run test`)
- Run local builds (`npm run build`)

Ask first:

- Add/update/remove dependencies
- Run deploy commands (for example `studio-production` deploy scripts)
- Delete files, rewrite git history, or run destructive cleanup

Never:

- Commit secrets or credentials
- Bypass PDF proxy allowlist, HTTPS enforcement, redirect blocking, timeout controls, or MIME validation in `src/pages/api/pdf.ts`

## Working Rules for This Repo

- Prefer minimal, targeted edits.
- Do not commit generated output from `dist/` unless explicitly asked.
- Keep `src/sanity/schemaTypes/*` and `studio-production/schemaTypes/*` in sync when schema changes.
- If you change routing/canonical behavior, re-check `src/components/layout/Layout.astro`, `src/lib/site.ts`, and crawl endpoints together.
- If architectural boundaries or invariants change, update `ARCHITECTURE.md` in the same change.
- For substantial features/refactors, create and maintain an ExecPlan per `PLANS.md`.

## Known Footguns

- `SANITY_PROJECT_ID` missing fails config loading early in both Astro configs.
- Main content routes are server-rendered (`output: 'server'`; many routes use `prerender = false`), so avoid static-only assumptions.
- `src/content.config.ts` defines Astro collections, but runtime published routes query Sanity directly via `src/lib/sanity.ts`.
- `src/pages/api/pdf.ts` is security-sensitive; preserve host allowlist, HTTPS-only rule, redirect blocking, and `application/pdf` content checks.
- CI runs on Node 20 with Sanity env vars set in `.github/workflows/ci.yml`; local mismatches are often env/version related.

## Done Criteria for Agent Changes

- Changes are limited to files relevant to the task.
- Commands/tests relevant to the change are run or explicitly deferred.
- Schema changes are mirrored across both schema directories when required.
- Risks, assumptions, and follow-ups are called out clearly.
