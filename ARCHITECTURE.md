# Architecture

This repository is a personal site built with Astro and Sanity. The main goal of this document is to help a new contributor answer two questions quickly:

1. Where does a given behavior live?
2. What invariants must stay true when changing it?

Keep this file short and stable. It should describe structure and boundaries, not line-by-line implementation details.

## Bird's-Eye View

The system has one user-facing surface backed by Sanity data:

- Main site (`/`): portfolio, writing, projects, reports, reading list.

At build time, routes fetch content from Sanity using GROQ queries and are prerendered to HTML. Shared layout components provide metadata, JSON-LD, theming, and shell structure. Additional routes emit crawl/discovery artifacts (`sitemap.xml`, `robots.txt`, `rss.xml`, `llms.txt`); a handful of API routes opt out of prerendering (the guarded PDF proxy, the analytics collector and report, the Cal.com webhook, the book recommendation box).

Deployment target is Netlify: static output plus those functions.

## Codemap

### Top-Level

- `src/pages`: route entrypoints (UI pages + API/text endpoints).
- `src/components`: main-site UI building blocks (`layout`, `features`, `theme`, `ui`).
- `src/lib`: integration and transformation helpers (`sanity`, `portableText`, `markdown`, `site`, `escape`), the work and writing data layers, the analytics validation modules, and `shell/` (the browser behaviour Layout boots).
- `src/sanity/schemaTypes`: canonical schema definitions used by Sanity Studio configs.
- `studio-production`: separately deployed Sanity Studio app using the root dependencies and shared schemas.
- `public`: static assets (images, audio, PDFs, icons, manifest).
- `tests`: route and security-focused tests.

### Runtime Entry Points

- `astro.config.ts`: production Astro config, Netlify adapter, Sanity integration, canonical site URL.
- `astro.config.dev.ts`: local dev config without Netlify adapter.
- `astro.config.shared.ts`: shared integrations, fonts, Markdown settings and Sanity environment validation for both configurations.
- `src/pages/index.astro`: homepage. An introduction beside one featured story (You Inc),
  two more selected stories (Sprint Coach, Home Lab), then one piece of writing and a reading
  link. The selection is explicit in `src/lib/workEditorial.ts`, not sorted by date. See
  `docs/portfolio-redesign.md`.
- `src/pages/work/index.astro`, `src/pages/writing/index.astro`, `src/pages/reading/index.astro`: list/index pages.
- `src/pages/work/[slug].astro`, `src/pages/posts/[slug].astro`, `src/pages/reports/[...slug].astro`: dynamic detail routes.
- `src/pages/projects/index.astro`: redirect-only; `/projects` is a 301 to `/work` (also declared in `netlify.toml`).

### Layout and UI Composition

- `src/components/layout/Layout.astro`: main-site HTML shell, metadata, OG/Twitter tags, JSON-LD graph, robots directives, theme bootstrap.
- `src/components/layout/Header.astro` + `src/components/layout/Footer.astro`: shared nav/footer.

### Content and Data Access

- `src/lib/sanity.ts`: Sanity client creation and `fetchSanity` query helper. Reads through Sanity's edge CDN (bounded eventual consistency, roughly two minutes); `fetchFreshSanity` bypasses it and is used only by RSS.
- `src/lib/writingData.ts`: the single posts-plus-reports stream behind `/writing` and `/tags/[tag]`. Owns the mapping from Sanity content slug to public post slug, so no caller should build a `/posts/...` href by hand.
- `src/lib/workData.ts` + `src/lib/work.ts`: the work story query, its types and
  `validateWorkStories`, which fails the build on a story that is missing its summary,
  alt text or interventions, or that duplicates an order, slug or artifact. `getStaticPaths` passes these validated stories as page props, avoiding a second fetch for each detail page.
- `src/lib/workEditorial.ts`: the homepage's featured slugs and the short introductions that
  stand in when a story has none of its own.
- `src/lib/portableText.ts`: Sanity Portable Text -> HTML/plaintext conversion.
- `src/lib/markdown.ts`: markdown -> HTML/plaintext conversion.
- `src/lib/site.ts`: canonical site constants and URL helpers used across metadata/feed/crawl endpoints.
- `src/lib/pageContent.ts`: fetches the page-copy singletons by fixed document ID for the pages that still read one (About, CV, Writing, Contact, 404). Throws a descriptive error when a document is absent rather than rendering empty markup.

### Crawl and Machine-Readable Endpoints

- `src/pages/sitemap.xml.ts`: static + Sanity-derived URL inventory.
- `src/pages/robots.txt.ts`: crawler policy and sitemap declaration.
- `src/pages/rss.xml.ts`: post feed.
- `src/pages/llms.txt.ts`: LLM-oriented site summary and key URLs.

### Security-Sensitive Path

- `src/pages/api/pdf.ts`: allowlisted HTTPS-only proxy for Sanity-hosted PDFs, with content-type validation and redirect blocking.
- `src/pages/stats.astro`: private dashboard reading the `recommendations` store and the latest nightly report. Gated by `INSIGHTS_TOKEN` with the same constant-time compare as `/api/insights`, served `no-store` and `noindex`, and listed in neither the sitemap nor `llms.txt`.
- `src/pages/api/recommend.ts`: stores book titles from the `/reading` recommendation box in the `recommendations` blob store. Validated in `src/lib/recommendations.ts`, metered by the same rate limiter as the collector, and keeps nothing about the sender.
- `src/pages/api/collect.ts`, `api/insights.ts`, `api/cal-webhook.ts` and `netlify/functions/session-insights.mts`: the analytics pipeline. Payloads are validated in `src/lib/analytics.ts`, rate limited in `src/lib/rateLimit.ts`, and the report is token-gated with a constant-time compare (`src/lib/timingSafe.ts`).

### Domain Model (Sanity)

Core document types are defined in `src/sanity/schemaTypes`:

- `post`: writing entries.
- `workStory`: one case study, professional or independent, linking to the posts and reports it produced. The legacy `project` type was retired in August 2026; its URLs redirect.
- `report`: long-form report entries, optional PDF file.
- `book`: reading list entries.
- `blockContent`: shared rich text schema.
- `ctaLink`: shared link object (label, destination, external flag, accessible label).

Static page copy lives in singleton documents written by fixed ID, one per page:

- `siteSettings`: contact-band copy. Header and footer copy live in their components.
- `aboutPage`, `cvPage`, `writingIndexPage`, `contactPage`, `notFoundPage`.

`scripts/seed-page-copy.ts` (`pnpm run seed:copy`) replaces these documents. Reconcile Studio edits into the script before running it; re-running overwrites those edits.

Both `sanity.config.ts` and `studio-production/sanity.config.ts` import `src/sanity/schemaTypes` directly. Studio commands run from the root pnpm project; there is one dependency manifest and lockfile.

## Architectural Invariants

1. Sanity is the runtime source of truth for published content routes.
- Page routes query Sanity directly via `fetchSanity`; there are no Astro content collections.
- Sanity-backed pages, metadata, JSON-LD, and discovery outputs use bounded edge caching and are eventually consistent; RSS is the no-cache exception and bypasses the Sanity CDN.
- Page copy is split. The homepage, the `/work` header, the About project blurbs and the story introductions are written in the templates and `src/lib/workEditorial.ts`; the other pages read singleton documents, and those must exist before the site renders (no fallback defaults).

2. The main site shell is centralized.
- Main site uses `src/components/layout/Layout.astro` and shared design-system CSS.

3. Canonical URL logic is centralized.
- Route-level canonical and absolute URL generation should use helpers/constants from `src/lib/site.ts`.
- The shared public-path helper converts Astro's file-format prerender paths (`/index.html`, `/work.html`) to public routes (`/`, `/work`), keeping canonical metadata aligned with the sitemap and navigation's active state aligned with the visitor's route.

3a. One work index over one content type.
- A `workStory` carries a `kind` of `professional` or `independent`. Since September 2026 `/work` lists both, newest first, and `/projects` redirects to it; `kind` still drives the category label and whether a story ends on the booking band.
- **Every case-study detail page lives at `/work/[slug]`.** Retired `/projects/[slug]` URLs 301 there in `netlify.toml`. Do not move detail pages.
- The four reflection fields on a story (`question`, `built`, `learned`, `differently`) remain optional in the schema for existing content; the site neither queries nor renders them.

4. PDF fetching is constrained by allowlist and content checks.
- Do not bypass `src/pages/api/pdf.ts` safety checks when handling remote PDFs.

5. Build/runtime requires Sanity environment configuration.
- `SANITY_PROJECT_ID` is required by Astro config and Sanity client setup.

## Boundaries

- Route layer (`src/pages`) owns request-level data fetching and page assembly.
- Component layer (`src/components`) owns presentation concerns.
- Integration layer (`src/lib`) owns external client setup and content transformation.
- Schema layer (`src/sanity/schemaTypes`) owns content model contracts with Sanity Studio.

A useful rule: if a change touches external content source behavior, start in `src/lib/sanity.ts` or schema files; if it touches metadata/crawlability, start in `Layout.astro` or crawl endpoint routes.

## Cross-Cutting Concerns

### SEO and Discoverability

Metadata, OpenGraph/Twitter cards, canonical tags, and JSON-LD are centralized in `Layout.astro`. Crawl/discovery artifacts are explicit route handlers (`sitemap`, `robots`, `rss`, `llms`).

### Security

The PDF proxy route performs host allowlisting, protocol checks, redirect blocking, and content-type enforcement. Escaping helpers in `src/lib/escape.ts` are used for attribute/XML serialization.

### Performance and Rendering Model

The site is prerendered. `output: 'static'` with the Netlify adapter bakes every content route to HTML at build time, so pages are served from the CDN with no function invocation and no Sanity round trip per request.

- The on-demand routes are the ones that set `export const prerender = false`: the PDF proxy, the analytics collector and report, the Cal.com webhook, the recommendation box, and the private `/stats` page.
- Dynamic routes (`posts/[slug]`, `work/[slug]`, `reports/[...slug]`, `tags/[tag]`) enumerate their pages via `getStaticPaths` from Sanity.
- **Publishing in Sanity must trigger a Netlify build hook.** Without it, published content will not appear until the next deploy.
- Because pages are prerendered, request-time inputs are unavailable. Anything depending on query params must be resolved on the client — see the back-link script in `posts/[slug].astro`.
- Retired URLs are Netlify redirects declared in `netlify.toml` (301s and 410s, `force = true`). `src/lib/legacyRoutes.ts` mirrors the same mapping so templates build the public href for a post; the two must be changed together.

### Theme and UX State

Light and dark themes live in `src/design-system/themes/`, and each defines the same set of semantic roles so the two are interchangeable. Interactive controls are defined once in `src/design-system/primitives.css` (buttons with primary, secondary, ghost and icon variants; chips; text, select and range fields; field messages), with every hover, press, focus, disabled, busy, pressed and invalid state, and Astro pages render them through `src/components/ui/Button.astro`. Pages do not style controls locally. An inline script in `Layout.astro` resolves the theme before first paint to avoid a flash: a stored `localStorage` choice wins, otherwise the system preference applies. The site keeps following the system until the visitor explicitly toggles, tracked via `data-theme-source` on the root element.

### Testing and CI

- Tests live in `tests/` and cover the escape helpers, markdown safety, the PDF route, the analytics validation and rate limiting, the insights and webhook routes, work story validation and the view-transition helpers.
- `pnpm exec knip` checks unused files, exports and dependencies. `knip.json` explicitly includes `src/lib/shell/index.ts` because the analyzer does not follow its import inside Layout's Astro script block.
- CI workflow in `.github/workflows/ci.yml` runs `pnpm install --frozen-lockfile`, `pnpm run test`, and `pnpm run build` on Node 22.

## What To Read First (New Contributor)

1. `README.md` for setup and commands.
2. `astro.config.ts` and `package.json` for runtime/build shape.
3. `src/components/layout/Layout.astro` for global metadata/layout behavior.
4. `src/lib/sanity.ts` and `src/sanity/schemaTypes/index.ts` for content model and data access.
5. The specific route file in `src/pages` for the behavior you are changing.

The Studio package manifest is a symlink to the root manifest because the Sanity CLI
requires a manifest in its project directory. Dependency versions and installation remain
owned by the root `package.json` and `pnpm-lock.yaml`.
