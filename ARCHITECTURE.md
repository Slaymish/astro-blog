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
- `src/pages/index.astro`: homepage. Two regions only — a fold carrying the name and three
  annotations on circuit leader lines, then one dated index of everything, newest first.
  The six repeated eyebrow/heading/link sections it replaced are gone, along with the
  `interests` and `currently` copy. Spec: `docs/design/specs/design-landing-datasheet-index.md`.
- `src/pages/projects/index.astro`, `src/pages/work/index.astro`, `src/pages/writing/index.astro`, `src/pages/reading/index.astro`: list/index pages.
- `src/pages/work/[slug].astro`, `src/pages/posts/[slug].astro`, `src/pages/reports/[...slug].astro`: dynamic detail routes.
- `src/pages/projects/[slug].astro`: redirect-only, retained for retired project URLs. It does not serve project detail pages.

### Layout and UI Composition

- `src/components/layout/Layout.astro`: main-site HTML shell, metadata, OG/Twitter tags, JSON-LD graph, robots directives, theme bootstrap.
- `src/components/layout/Header.astro` + `src/components/layout/Footer.astro`: shared nav/footer.

### Content and Data Access

- `src/lib/sanity.ts`: Sanity client creation and `fetchSanity` query helper. Reads through Sanity's edge CDN (bounded eventual consistency, roughly two minutes); `fetchFreshSanity` bypasses it and is used only by RSS.
- `src/lib/writingData.ts`: the single posts-plus-reports stream behind `/writing` and `/tags/[tag]`. Owns the mapping from Sanity content slug to public post slug, so no caller should build a `/posts/...` href by hand.
- `src/lib/homeIndex.ts`: flattens work stories and writing into the homepage's one dated
  stream. Owns two rules that carry the design: which rows expand to show a diagram, and
  the suppression of any write-up already represented by a story that claims it as an
  artifact. Also derives the fold's project count, which is never authored in the CMS.
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

### Circuit (Pipework Overlay)

`src/lib/circuit` wires DOM elements together with pipework. The visual grammar is
`docs/design-docs/circuit-design-language.md` and is the authority; this section covers structure and
invariants only.

- **Topology is three runs.** A *trunk* leaves the source's baseline and elbows down to a *lane*; the
  lane carries it to a *rail* that runs the full height of the region in the page gutter. Branches
  tap whichever run is nearest — the lane if the node sits under it (a drop) or over it (a rise), the
  rail otherwise. Routing to the rail unconditionally is what previously made a bus travel 900px to
  the gutter and back to reach a node beside its own source. When a node sits to the right of the
  source, the lane runs out past its own feed, is capped there, and the trunk tees into it.
- **One radius, guaranteed.** `--circuit-radius` is never reduced to fit. `relaxLegs` rewrites any
  polyline that would produce a leg shorter than `--circuit-min-leg` so a full sweep always fits.
  Corners are true circular arcs (`A`), not quadratics. Do not reintroduce a per-corner radius cap:
  that is what produced seven different rendered radii on one page.
- **Geometry is snapped onto the device pixel grid** by a `Snap` the engine supplies, which corrects
  for the overlay's own fractional offset. Even stroke weights centre on whole pixels and the 1px
  tick centres on a half pixel. Every weight must stay even or exactly 1px for this to hold.
- **Both ends land on what they serve**, and what a run meets decides how it is finished — the
  `Attach` contract in `geometry.ts`. A `box` takes a cap plate set outside its face. A `rule` is
  already a line in the layout, so the run meets its leading end and takes a port, and the rule reads
  as reaching out to the bus. `text` has no edge, so the run arrives along the node's baseline and
  travels it for `--circuit-text-run`. Attachment is declared explicitly with `data-circuit-attach`;
  it is never inferred from `data-circuit-flash`, which is presentational.
- **A run never crosses what it serves.** The lane is lifted clear of the first node below the
  source, and a stub off the lane that would pass through another node's box falls back to a rail
  tap. `obstacles` in `RouteOptions` carries those boxes.
- The **rail centres in the page gutter** and sits no further out than one lane. `--page-gutter`'s
  floor is therefore set by the pipework, not the type.
- `geometry.ts` is pure routing maths in region-local pixels and is unit tested. `engine.ts` owns the
  DOM, SVG, and lifecycle. `circuit.css` owns presentation; geometry and timing tokens live in
  `tokens.css`, colours in the theme files. Every geometry token must stay in px, ms, or unitless —
  the engine reads them off computed style, so relative units would resolve against the wrong box.
- Authored regions opt in through markup (`data-circuit`, `data-circuit-source`, `data-circuit-node`,
  `data-circuit-attach`, `data-circuit-lane`) and `Layout.astro` boots the engine once per page. The
  layout also supplies one quiet gutter rail to non-home pages so the motif remains site-wide without
  route-specific decoration. Nodes dispatch a bubbling `circuit:arrive` event.
- **Motion is CSS, not JavaScript.** One capsule per route rides `offset-path` with `offset-distance`
  and `offset-rotate`, as an HTML span in a sibling overlay rather than an SVG child (the broadest
  support for the feature). Capsules exist only where `CSS.supports('offset-path', …)` passes, so the
  un-enhanced baseline is a complete drawing with no motion. An `IntersectionObserver` toggles
  `is-circuit-live`, which flips `animation-play-state`; there is no `requestAnimationFrame` loop in
  the motif at all. `prefers-reduced-motion` hides the capsule layer entirely in CSS.
- Two invariants worth knowing before changing it. **Coordinates are measured against the overlay,
  not the region**, because as an out-of-flow child the overlay fills the region's padding box and
  would otherwise be offset by it, and because region-local geometry stays correct under any
  ancestor transform. **A branch's approach resolves per layout** from where the node actually sits, so one
  markup contract works at every breakpoint.
- Density thins rather than the section: internal pages get the rail and its caps only, the label is
  not drawn below `80rem`, and the pipe is 4px at every width. The previous 3px / 1.5px mobile weight
  override is gone because a 1.5px stroke cannot render crisply at any device pixel ratio.

### Testing and CI

- Tests live in `tests/` and currently cover escape helpers, markdown safety expectation, PDF route hardening, and circuit routing geometry.
- CI workflow in `.github/workflows/ci.yml` runs `pnpm install --frozen-lockfile`, `pnpm run test`, and `pnpm run build` on Node 22.

## What To Read First (New Contributor)

1. `README.md` for setup and commands.
2. `astro.config.ts` and `package.json` for runtime/build shape.
3. `src/components/layout/Layout.astro` for global metadata/layout behavior.
4. `src/lib/sanity.ts` and `src/sanity/schemaTypes/index.ts` for content model and data access.
5. The specific route file in `src/pages` for the behavior you are changing.
