# Architecture

This repository is a personal site built with Astro and Sanity. The main goal of this document is to help a new contributor answer two questions quickly:

1. Where does a given behavior live?
2. What invariants must stay true when changing it?

Keep this file short and stable. It should describe structure and boundaries, not line-by-line implementation details.

## Bird's-Eye View

The system has two user-facing surfaces backed by the same Sanity dataset:

- Main site (`/`): portfolio, writing, projects, reports, reading list.
- Studio (`/studio`): separate visual section for aphorisms and writing experiments.

At runtime, Astro server routes fetch content from Sanity using GROQ queries. Shared layout components provide metadata, JSON-LD, theming, and shell structure. Additional server routes emit crawl/discovery artifacts (`sitemap.xml`, `robots.txt`, `rss.xml`, `llms.txt`) and a guarded PDF proxy (`/api/pdf`).

Deployment target is Netlify server output.

## Codemap

### Top-Level

- `src/pages`: route entrypoints (UI pages + API/text endpoints).
- `src/components`: main-site UI building blocks (`layout`, `features`, `theme`, `ui`).
- `src/studio`: studio-only layout, design system, and components.
- `src/lib`: integration and transformation helpers (`sanity`, `portableText`, `markdown`, `site`, `escape`).
- `src/sanity/schemaTypes`: canonical schema definitions used by embedded studio config.
- `studio-production`: standalone Sanity Studio app with duplicate schema definitions.
- `public`: static assets (images, audio, PDFs, icons, manifest).
- `tests`: route and security-focused tests.

### Runtime Entry Points

- `astro.config.ts`: production Astro config, Netlify adapter, Sanity integration, canonical site URL.
- `astro.config.dev.ts`: local dev config without Netlify adapter.
- `src/pages/index.astro`: homepage aggregation of projects/posts/reports/reading.
- `src/pages/writing/index.astro`, `src/pages/projects/index.astro`, `src/pages/reading/index.astro`: list/index pages.
- `src/pages/posts/[slug].astro`, `src/pages/projects/[slug].astro`, `src/pages/reports/[...slug].astro`, `src/pages/studio/[slug].astro`: dynamic detail routes.

### Layout and UI Composition

- `src/components/layout/Layout.astro`: main-site HTML shell, metadata, OG/Twitter tags, JSON-LD graph, robots directives, theme bootstrap.
- `src/components/layout/Header.astro` + `src/components/layout/Footer.astro`: shared nav/footer.
- `src/studio/StudioLayout.astro`: isolated studio shell with independent styles and nav.

### Content and Data Access

- `src/lib/sanity.ts`: Sanity client creation and `fetchSanity` query helper.
- `src/lib/portableText.ts`: Sanity Portable Text -> HTML/plaintext conversion.
- `src/lib/markdown.ts`: markdown -> HTML/plaintext conversion.
- `src/lib/site.ts`: canonical site constants and URL helpers used across metadata/feed/crawl endpoints.

### Crawl and Machine-Readable Endpoints

- `src/pages/sitemap.xml.ts`: static + Sanity-derived URL inventory.
- `src/pages/robots.txt.ts`: crawler policy and sitemap declaration.
- `src/pages/rss.xml.ts`: post feed.
- `src/pages/llms.txt.ts`: LLM-oriented site summary and key URLs.

### Security-Sensitive Path

- `src/pages/api/pdf.ts`: allowlisted HTTPS-only proxy for Sanity-hosted PDFs, with content-type validation and redirect blocking.

### Domain Model (Sanity)

Core document types are defined in `src/sanity/schemaTypes`:

- `post`: writing entries.
- `project`: project portfolio entries.
- `report`: long-form report entries, optional PDF file.
- `book`: reading list entries.
- `aphorism`: studio entries.
- `blockContent`: shared rich text schema.

`studio-production/schemaTypes` mirrors these for the standalone Studio app.

## Architectural Invariants

1. Sanity is the runtime source of truth for published content routes.
- Page routes query Sanity directly via `fetchSanity`; Astro content collections exist but are not the active runtime path.

2. Main site and Studio are style-isolated surfaces.
- Main site uses `src/components/layout/Layout.astro` and design-system CSS.
- Studio routes use `src/studio/StudioLayout.astro` and `src/studio/design.css`.

3. Canonical URL logic is centralized.
- Route-level canonical and absolute URL generation should use helpers/constants from `src/lib/site.ts`.

4. PDF fetching is constrained by allowlist and content checks.
- Do not bypass `src/pages/api/pdf.ts` safety checks when handling remote PDFs.

5. Build/runtime requires Sanity environment configuration.
- `SANITY_PROJECT_ID` is required by Astro config and Sanity client setup.

## Boundaries

- Route layer (`src/pages`) owns request-level data fetching and page assembly.
- Component layer (`src/components`, `src/studio/components`) owns presentation concerns.
- Integration layer (`src/lib`) owns external client setup and content transformation.
- Schema layer (`src/sanity/schemaTypes`, `studio-production/schemaTypes`) owns content model contracts with Sanity Studio.

A useful rule: if a change touches external content source behavior, start in `src/lib/sanity.ts` or schema files; if it touches metadata/crawlability, start in `Layout.astro` or crawl endpoint routes.

## Cross-Cutting Concerns

### SEO and Discoverability

Metadata, OpenGraph/Twitter cards, canonical tags, and JSON-LD are centralized in `Layout.astro`. Crawl/discovery artifacts are explicit route handlers (`sitemap`, `robots`, `rss`, `llms`).

### Security

The PDF proxy route performs host allowlisting, protocol checks, redirect blocking, and content-type enforcement. Escaping helpers in `src/lib/escape.ts` are used for attribute/XML serialization.

### Performance and Rendering Model

The site runs in Astro server output mode on Netlify. Many content routes set `export const prerender = false`, so route handlers can fetch fresh Sanity content at request time.

### Theme and UX State

Theme and accent are persisted in `localStorage` and applied early in `Layout.astro` to reduce flash-of-unstyled-theme behavior.

### Testing and CI

- Tests live in `tests/` and currently cover escape helpers, markdown safety expectation, and PDF route hardening.
- CI workflow in `.github/workflows/ci.yml` runs `npm ci`, `npm run test`, and `npm run build`.

## What To Read First (New Contributor)

1. `README.md` for setup and commands.
2. `astro.config.ts` and `package.json` for runtime/build shape.
3. `src/components/layout/Layout.astro` for global metadata/layout behavior.
4. `src/lib/sanity.ts` and `src/sanity/schemaTypes/index.ts` for content model and data access.
5. The specific route file in `src/pages` for the behavior you are changing.
