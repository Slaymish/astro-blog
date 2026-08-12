# Architecture

This repository is a personal site built with Astro and Sanity. The main goal of this document is to help a new contributor answer two questions quickly:

1. Where does a given behavior live?
2. What invariants must stay true when changing it?

Keep this file short and stable. It should describe structure and boundaries, not line-by-line implementation details.

## Bird's-Eye View

The system has one user-facing surface backed by Sanity data:

- Main site (`/`): portfolio, writing, projects, reports, reading list.

At runtime, Astro server routes fetch content from Sanity using GROQ queries. Shared layout components provide metadata, JSON-LD, theming, and shell structure. Additional server routes emit crawl/discovery artifacts (`sitemap.xml`, `robots.txt`, `rss.xml`, `llms.txt`) and a guarded PDF proxy (`/api/pdf`).

Deployment target is Netlify server output.

## Codemap

### Top-Level

- `src/pages`: route entrypoints (UI pages + API/text endpoints).
- `src/components`: main-site UI building blocks (`layout`, `features`, `theme`, `ui`).
- `src/lib`: integration and transformation helpers (`sanity`, `portableText`, `markdown`, `site`, `escape`), plus `circuit` (the data bus overlay).
- `src/sanity/schemaTypes`: canonical schema definitions used by Sanity Studio configs.
- `studio-production`: standalone Sanity Studio app with duplicate schema definitions.
- `public`: static assets (images, audio, PDFs, icons, manifest).
- `tests`: route and security-focused tests.

### Runtime Entry Points

- `astro.config.ts`: production Astro config, Netlify adapter, Sanity integration, canonical site URL.
- `astro.config.dev.ts`: local dev config without Netlify adapter.
- `src/pages/index.astro`: homepage. Hero, areas of interest, a current-state statement, then projects, professional work, and recent writing.
- `src/pages/projects/index.astro`, `src/pages/work/index.astro`, `src/pages/writing/index.astro`, `src/pages/reading/index.astro`: list/index pages.
- `src/pages/work/[slug].astro`, `src/pages/posts/[slug].astro`, `src/pages/reports/[...slug].astro`: dynamic detail routes.
- `src/pages/projects/[slug].astro`: redirect-only, retained for retired project URLs. It does not serve project detail pages.

### Layout and UI Composition

- `src/components/layout/Layout.astro`: main-site HTML shell, metadata, OG/Twitter tags, JSON-LD graph, robots directives, theme bootstrap.
- `src/components/layout/Header.astro` + `src/components/layout/Footer.astro`: shared nav/footer.
- `src/components/canvasui/Bend.tsx`: vendored Canvas UI component (shadcn registry, not an npm dependency). `Layout.astro` wraps page content in it, so **Bend owns the scroll container and the document itself does not scroll**. The header is deliberately rendered outside Bend so it never folds.

### Content and Data Access

- `src/lib/sanity.ts`: Sanity client creation and `fetchSanity` query helper. Reads through Sanity's edge CDN (bounded eventual consistency, roughly two minutes); `fetchFreshSanity` bypasses it and is used only by RSS.
- `src/lib/writingData.ts`: the single posts-plus-reports stream behind `/writing`, `/tags/[tag]`, and the homepage writing section. Owns the mapping from Sanity content slug to public post slug, so no caller should build a `/posts/...` href by hand.
- `src/lib/portableText.ts`: Sanity Portable Text -> HTML/plaintext conversion.
- `src/lib/markdown.ts`: markdown -> HTML/plaintext conversion.
- `src/lib/site.ts`: canonical site constants and URL helpers used across metadata/feed/crawl endpoints.
- `src/lib/pageContent.ts`: fetches the page-copy singletons by fixed document ID. Throws a descriptive error when a document is absent rather than rendering empty markup.

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
- `blockContent`: shared rich text schema.
- `ctaLink`: shared link object (label, destination, external flag, accessible label).

Static page copy lives in singleton documents written by fixed ID, one per page:

- `siteSettings`: header nav, footer, and contact-band copy.
- `homePage`, `aboutPage`, `cvPage`, `workIndexPage`, `projectsIndexPage`, `writingIndexPage`, `contactPage`, `notFoundPage`.

`scripts/seed-page-copy.ts` (`npm run seed:copy`) publishes the initial copy for these and is safe to re-run.

`studio-production/schemaTypes` mirrors these for the standalone Sanity Studio app.

## Architectural Invariants

1. Sanity is the runtime source of truth for published content routes.
- Page routes query Sanity directly via `fetchSanity`; Astro content collections exist but are not the active runtime path.
- Sanity-backed pages, metadata, JSON-LD, and discovery outputs use bounded edge caching and are eventually consistent; RSS is the no-cache exception and bypasses the Sanity CDN.
- This includes static page copy: templates hold no hardcoded user-facing strings and there are no fallback defaults, so the copy singletons must exist before the site renders.

2. The main site shell is centralized.
- Main site uses `src/components/layout/Layout.astro` and shared design-system CSS.

3. Canonical URL logic is centralized.
- Route-level canonical and absolute URL generation should use helpers/constants from `src/lib/site.ts`.

3a. `/work` and `/projects` are two indexes over one content type, not two content types.
- A `workStory` carries a `kind` of `professional` or `independent`. `/work` lists the former, `/projects` the latter, and `status` (`lead`/`support`) independently controls presentation within an index.
- **Every case-study detail page canonically lives at `/work/[slug]`, including independent projects.** This is deliberate: splitting detail URLs would mean issuing 301s from `/work/[slug]`, reversing redirects that already point `/projects/[slug]` at `/work/[slug]` in `netlify.toml`. Do not "fix" the apparent inconsistency.
- An independent story must answer all four reflection questions (`question`, `built`, `learned`, `differently`). This is enforced conditionally in the Sanity schema for editor feedback and in `validateWorkStories` in `src/lib/work.ts` for the build.

4. PDF fetching is constrained by allowlist and content checks.
- Do not bypass `src/pages/api/pdf.ts` safety checks when handling remote PDFs.

5. Build/runtime requires Sanity environment configuration.
- `SANITY_PROJECT_ID` is required by Astro config and Sanity client setup.

## Boundaries

- Route layer (`src/pages`) owns request-level data fetching and page assembly.
- Component layer (`src/components`) owns presentation concerns.
- Integration layer (`src/lib`) owns external client setup and content transformation.
- Schema layer (`src/sanity/schemaTypes`, `studio-production/schemaTypes`) owns content model contracts with Sanity Studio.

A useful rule: if a change touches external content source behavior, start in `src/lib/sanity.ts` or schema files; if it touches metadata/crawlability, start in `Layout.astro` or crawl endpoint routes.

## Cross-Cutting Concerns

### SEO and Discoverability

Metadata, OpenGraph/Twitter cards, canonical tags, and JSON-LD are centralized in `Layout.astro`. Crawl/discovery artifacts are explicit route handlers (`sitemap`, `robots`, `rss`, `llms`).

### Security

The PDF proxy route performs host allowlisting, protocol checks, redirect blocking, and content-type enforcement. Escaping helpers in `src/lib/escape.ts` are used for attribute/XML serialization.

### Performance and Rendering Model

The site is prerendered. `output: 'static'` with the Netlify adapter bakes every content route to HTML at build time, so pages are served from the CDN with no function invocation and no Sanity round trip per request.

- The only on-demand route is `src/pages/api/pdf.ts`, which keeps `export const prerender = false`.
- Dynamic routes (`posts/[slug]`, `work/[slug]`, `projects/[slug]`, `reports/[...slug]`, `tags/[tag]`) enumerate their pages via `getStaticPaths` from Sanity.
- **Publishing in Sanity must trigger a Netlify build hook.** Without it, published content will not appear until the next deploy.
- Because pages are prerendered, request-time inputs are unavailable. Anything depending on query params must be resolved on the client — see the back-link script in `posts/[slug].astro`.
- Retired URLs are build-time redirects: 301s come from `buildLegacyRedirects()` in `src/lib/legacyRoutes.ts` via `redirects` in `astro.config.ts`; 410s are declared in `netlify.toml`.

### Theme and UX State

Light and dark themes live in `src/design-system/themes/`, and each defines the same set of semantic roles so the two are interchangeable. An inline script in `Layout.astro` resolves the theme before first paint to avoid a flash: a stored `localStorage` choice wins, otherwise the system preference applies. The site keeps following the system until the visitor explicitly toggles, tracked via `data-theme-source` on the root element.

### Circuit (Data Bus Overlay)

`src/lib/circuit` wires DOM elements together with pipework: a trunk leaves a source, turns onto a shared spine in the page gutter, and each node branches off that spine at its own junction. Packets travel those routes and the node they reach acknowledges arrival.

- A run is drawn as a **wall plus a bore** on identical path data — the wall's two visible edges give the pipe its section, and packets travel the bore so light reads as being inside it. Routes also report their **fittings** (a union either side of a sweep, a tee at each split) so the run looks assembled rather than drawn. `spaceFittings` keeps the meaningful joints and drops any union that would crowd one.
- **Both ends land on what they serve**, and what a run meets decides how it is finished — the `Attach` contract in `geometry.ts`. A `box` is a face to butt into: the run ends on the edge and takes a flange plate set outside it. A `rule` is a divider that is already a run in its own right, so the branch tees into it with bands laid across the rule rather than capping against it. `text` has no edge, so the run turns onto the node's baseline and travels it for `--circuit-text-run` before stopping, becoming the rule the text has not got. The source is a text end and taps its own baseline the same way. A node's attachment is read off `data-circuit-attach`, defaulting from the flash it already declares.
- The **spine centres in the page gutter** and sits no further out than one lane. `--page-gutter`'s floor is therefore set by the pipework, not the type: it has to stay wide enough to seat a run clear of the screen edge on tablet and mobile, where a media query also steps the whole kit down a size.
- `geometry.ts` is pure routing maths in region-local pixels and is unit tested. `engine.ts` owns the DOM, SVG, and lifecycle. `circuit.css` owns presentation; geometry and timing tokens live in `tokens.css`, colours in the theme files. Every geometry token must stay in px, ms, or unitless — the engine reads them off computed style, so relative units would resolve against the wrong box.
- Authored regions opt in through markup (`data-circuit`, `data-circuit-source`, `data-circuit-node`, `data-circuit-rail`) and `Layout.astro` boots the engine once per page. The layout also supplies one low-opacity, slow-heartbeat gutter bus to non-home pages so the motif remains site-wide without route-specific decoration. Nodes dispatch a bubbling `circuit:arrive` event.
- Two invariants worth knowing before changing it. **Coordinates are measured against the overlay, not the region**, because as an out-of-flow child the overlay fills the region's padding box and would otherwise be offset by it — and because region-local geometry stays correct under Bend's transforms. **A node's approach edge resolves per layout** from where the node actually sits, so one markup contract works at every breakpoint.
- Because Bend swaps the scroll container when its canvas activates, the engine listens for scroll in the capture phase rather than binding to a node that may be replaced. Pipes render on the first geometry pass rather than tracing in as regions enter the viewport, so the structural layer does not pop in after page load. Touch does not create free-standing viewport pulses: every packet remains attached to a route authored by the region. Dense regions may opt out decoratively on mobile with `data-circuit-mobile="off"`. Under `prefers-reduced-motion` the persistent pipes and fittings still render — they are structure — but packets, lamps, and the idle heartbeat do not run.

### Testing and CI

- Tests live in `tests/` and currently cover escape helpers, markdown safety expectation, PDF route hardening, and circuit routing geometry.
- CI workflow in `.github/workflows/ci.yml` runs `pnpm install --frozen-lockfile`, `pnpm run test`, and `pnpm run build` on Node 22.

## What To Read First (New Contributor)

1. `README.md` for setup and commands.
2. `astro.config.ts` and `package.json` for runtime/build shape.
3. `src/components/layout/Layout.astro` for global metadata/layout behavior.
4. `src/lib/sanity.ts` and `src/sanity/schemaTypes/index.ts` for content model and data access.
5. The specific route file in `src/pages` for the behavior you are changing.
