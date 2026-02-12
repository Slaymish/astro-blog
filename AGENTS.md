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
- Theme/accent controls: `src/theme/*`, `src/components/theme/*`
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

## Commands

Run from repo root unless noted.

- Install: `npm ci`
- Dev: `npm run dev`
- Build: `npm run build`
- Test: `npm run test`
- Preview: `npm run preview`
- Studio dev/build: `npm run studio:dev`, `npm run studio:build`

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
- Run `npm run test` and `npm run build`

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
- Many routes are server-rendered (`output: 'server'`; many use `prerender = false`), so do not assume static behavior.
- `src/content.config.ts` exists, but published runtime content is fetched from Sanity in routes.
- CI runs Node 20 with Sanity env vars; local failures are often env/version mismatch.
