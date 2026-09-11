# Rewrite audit: hamishburke.dev

Written 11 September 2026 against commit `71b362d` on `main`. This is the first half of the
rewrite work: what is wrong with the current app, what is worth keeping, and what any
rewrite is bound by. The second half, the ExecPlan another agent can follow, is
`docs/exec-plans/2026-09-11-site-rewrite.md` and follows `PLANS.md`.

## Scope and method

Every file under `src/`, `tests/`, `scripts/`, `netlify/`, `.claude/` and the four config
files was read in full. The dependency manifest, the last local build in `dist/`
(21 August, so slightly behind `main`), the public asset tree and the repo docs were
inspected. `pnpm run test` passes 100 of 100. `pnpm exec knip` reports one unused export
and four unused exported types, all in `src/lib/work.ts`, and nothing else.

| Measure | Value |
|---|---|
| Source lines (`src`, `tests`, `scripts`, `netlify`) | 10 936 |
| Runtime dependencies | 28 |
| `public/` on disk | 24 MB |
| `public/` referenced by any template | about 10 MB |
| Largest client JS chunk in `dist/_astro` | 5.0 MB (`pane2`, Sanity Studio) |
| Largest image served | 5.0 MB (`/images/headshot.jpg`, 3264 x 4896) |

## The findings that matter most

1. The Sanity Studio is bundled into the public site at `/cms` through `@sanity/astro`'s
   `studioBasePath`. It ships 6.3 MB of JavaScript in `dist/_astro`, drags `sanity`,
   `react`, `react-dom` and `styled-components` into the site's runtime dependencies, and
   cannot work anyway: the site's CSP `connect-src` does not allow `*.api.sanity.io`. A
   separate Studio already exists in `studio-production/`. This is pure cost.
2. Images are served raw from `public/` with no responsive variants. The About portrait is
   a 5 MB JPEG loaded eagerly. The homepage hero is a 2462 px PNG with `fetchpriority=high`
   sent to phones at full size. Astro's image pipeline (`astro:assets`, stable
   `image.layout`) is installed and unused.
3. The KaTeX stylesheet is fetched from jsDelivr on every page, render-blocking, from a
   third-party origin, and there is no maths pipeline in the repo to use it. It is the only
   reason `cdn.jsdelivr.net` is in the CSP and the preconnect list.
4. The default Open Graph image, the Apple touch icon and two manifest icons point at
   `/apple-touch-icon.png` and `/favicon.ico`, neither of which exists. Every page without
   an explicit image (which is every page) has a broken `og:image`.
5. The RSS feed excludes the GPU-share post instead of aliasing it, and the tag fallback in
   `RelatedPosts.astro` links the content slug rather than the public one. Both are symptoms
   of a slug alias (`gpu-share` to `building-a-private-ai-server-for-friends`) that leaks
   into seven files instead of being fixed in the data.
6. Article pages and the rest of the site are two visual systems. `posts/[slug].astro`,
   `reports/[...slug].astro`, `ParallaxHero`, `RelatedPosts`, `TableOfContents` and
   `Breadcrumb` use the pre-redesign Tailwind utility vocabulary (`--text-muted`,
   `--accent`, `--surface`, pill tags, a "Related Posts" card). Everything else uses the
   September 2026 editorial style. A visitor moving from `/work` to a post sees the seam.
7. Content decisions live in templates. The homepage hard-codes the hero image path, the
   featured article slug and its blurb, and a per-slug label. `work/[slug].astro` hard-codes
   the You Inc narrative, the "Try demo" label and two per-project evidence sections.
   `WorkGraphic.astro` hand-builds one diagram per project with measured figures ("7.26 GB",
   "1h 45m") baked into markup and overrides the CMS alt text. Nothing here is editable in
   Studio.
8. The CSP carries `script-src 'unsafe-inline' blob:` and `style-src 'unsafe-inline'`, which
   removes most of what a CSP is for. Astro 7.3 has a stable `security.csp` that emits
   hashes for inline scripts and styles.
9. Around 14 MB of `public/` is unreferenced but deployed on every build: `audio/` (5.2 MB,
   including a Wagner remix), `images/tiles/` (7.4 MB), `images/cats/`, `flashlight.*`,
   `astro.svg`, `logo.png`, three PDFs under `public/reports/` (report PDFs actually come
   from Sanity), and `freelance_pricing_guide.pdf` at the repo root.
10. Legacy URL policy is held in three places (`netlify.toml`, `src/lib/legacyRoutes.ts`,
    and branches inside the post and report routes) and the route-level branches can never
    execute in a static build because `getStaticPaths` never emits those slugs. Two
    redirect-only pages (`projects/index.astro`, `tools/index.astro`) emit the meta-refresh
    HTML that `AGENTS.md` says to avoid, and `netlify.toml` masks them with `force = true`.

## Performance

The rendering model is right: static output, CDN-served HTML, five on-demand routes. The
weight is in what gets shipped around that model.

**JavaScript.** The Studio bundle (finding 1) dominates. Below it: `motion` (Framer Motion) is imported for a 150 ms opacity fade on four numbers in
`GpuCalculator.tsx`, which is the only React island on the site. PDF.js 3.11 is vendored as
1.3 MB of blocking classic `<script>` tags in the body of report pages; it is a 2023 release.
The shell module (`src/lib/shell`) is small and well-structured, but the scroll listener runs
its milestone loop on every scroll event with no threshold check on the scroll position
first.

**Images.** No `<Image>` or `<Picture>`, no `srcset`, no AVIF or WebP for the PNG and JPEG
sources. `public/images/work/youinc-demo-dashboard.png` and
`public/images/posts/status_screenshot.png` (554 KB) are PNG screenshots that would be a
fifth of the size as WebP. Portable Text images from Sanity are emitted at a fixed
`width(1200)` with no `srcset` and no `width`/`height` attributes, so they shift layout.
Sanity book covers are the one place `urlFor` is used well (cropped to 144 x 216).

**CSS.** Three token vocabularies coexist: the legacy roles (`--bg`, `--surface`, `--text`,
`--accent`, `--border`), the redesign roles (`--color-bg-canvas`, `--color-text-primary`,
`--color-action`, `--color-stroke-subtle`), and the Tailwind `@theme inline` bridge that
mints a third set (`--color-primary`, `--color-muted`, `--color-signal`). Both theme files
define all of the first two. `base.css` and `globals.css` each define focus rings (different
offsets), reduced-motion resets and heading styles. `tailwind.config.cjs` is a dead Tailwind
v3 config. The shared layout CSS chunk is 54 KB before compression, large for a site with
this little UI.

**Build.** `@huggingface/transformers` downloads and runs `all-MiniLM-L6-v2` on every Netlify
build to relate roughly a dozen documents, adds a network dependency to the build, and falls
back silently to tag matching if it fails. For a corpus this size the same result comes from
a hand-curated `related[]` reference field in Sanity, or from tag overlap alone.

**Caching.** The `/api/*` header rule in `netlify.toml` sets `Cache-Control: no-store` on
everything under `/api/`, which overrides the PDF proxy's own `public, max-age=3600` header.
Every PDF view therefore re-streams up to 20 MiB through a function. The `Cache-Control`
headers set inside `sitemap.xml.ts`, `robots.txt.ts` and `llms.txt.ts` are ignored: those
routes are prerendered, so the `/*` rule applies.

**Third-party.** Cloudflare sits in front of Netlify with Rocket Loader enabled (see
`docs/production-smoke-2026-09-08.md`). It rewrites script types and defers the theme boot,
which is why `data-cfasync="false"` is sprinkled through the templates. Rocket Loader should
be off for this site; the workaround attributes exist only because it is on.

## User experience

**Information architecture.** The header offers Work, Writing, About and an Email mailto.
`/contact`, `/cv`, `/reading` and `/terms` are reachable only through body links or the
footer (`/terms` from nowhere except `/privacy`). The active-nav check lights nothing on
`/posts/*`, `/reports/*`, `/tags/*` or `/reading`. The writing filter chips and the
`/tags/[tag]` pages do the same job two ways; the chips carry no URL state so a filtered
view cannot be linked.

**Visual consistency.** Finding 6 above. Concretely: post heroes use `en-US` long dates
("September 11, 2026") while `/writing` uses `en-NZ` short dates; reports render a hidden
`ScholarlyArticle` microdata block and a `BlogPosting` JSON-LD block for the same document;
`.prose p:first-of-type` styles the first paragraph inside every blockquote and list item as
a muted lede, not just the article's opener; the "Enjoyed this post? Subscribe via RSS" box
and the "Related Posts" card are the only bordered cards left on the site.

**Layout.** Posts use `fullWidth` with a two-column grid reserved for a table of contents
that only renders at 1024 px and only when there are three or more headings, so most posts
show a 68ch article beside an empty 270 px column. The `todo.md` note about a clipped TOC is
this. `main { contain: layout }` in `globals.css` will also defeat any future sticky sidebar.

**Theme.** `<html class="dark">` is hard-coded and corrected by an inline script; there is no
`<meta name="color-scheme">`, and `theme-color` is only right after JavaScript runs. The
manifest still carries the old palette (`#10b981`, `#262626`), the name "Hamish's Blog" and a
description mentioning mathematics.

**Metadata.** `/stats` passes `robots="noindex, nofollow"` but the layout also emits
`<meta name="googlebot" content="index, follow">` on every page, so the private page carries
contradictory directives. `hreflang="en"` and `x-default` both point at the page itself,
which is noise on a single-language site. `X-UA-Compatible` is obsolete. `inLanguage` is
`en-US` in JSON-LD, `en_NZ` in `og:locale` and `en-us` in RSS. The `Person` node is emitted
twice with different `jobTitle` values ("Software developer" in the layout, "Web Developer" on
`/about`) and different images. Report pages carry two `BreadcrumbList` blocks. The `post`
schema has a `coverImage` field that nothing renders and nothing uses for `og:image`.

**Forms and fallbacks.** The recommendation box on `/reading` works only with JavaScript: it
is `novalidate`, posts JSON via `fetch`, and a native submit would send form-encoded data
and receive a 400. The post back-link depends on a `?from=` query parameter resolved by an
inline script and only recognises `/work/*` sources. The 404 page's "Go back" button relies on
`history.length`.

**Accessibility.** `Breadcrumb` and `TableOfContents` put `role="list"` and `role="listitem"`
on real `<ol>`/`<li>` elements (the same class of override the smoke test removed from the
nav). `WorkGraphic` wraps real text content in `role="img"` with an `aria-label`, so screen
readers get the label and lose the text, or the reverse depending on the browser. The global
`a:hover { opacity: .8 }` in `globals.css` is fought by a dozen `opacity: 1` and `!important`
overrides. Reduced-motion is handled twice with slightly different rules.

**Copy ownership.** Finding 7. In addition, `scripts/seed-page-copy.ts` still seeds `/projects`
links which `about.astro` filters out at render time, and the 404 suggestions include
`/projects`, which redirects. The seed scripts are destructive (`createOrReplace`) with no
dry-run, and the repo hook exists only to stop them being run by accident.

## Security and privacy

What is good, and should survive the rewrite as-is: the PDF proxy's allowlist, HTTPS-only,
redirect blocking, MIME check and streamed size cap; HMAC verification on the Cal.com
webhook; constant-time token comparison; the salted, rotating rate-limit keys; the
collector's refusal to store IP, agent, referrer or cookie; and the unit tests around all
of it.

**CSP.** Finding 8. `X-Frame-Options: DENY` is redundant beside `frame-ancestors 'none'`.
`Cross-Origin-Resource-Policy` is absent. `blob:` in `script-src` exists for PDF.js workers
and could be scoped to `worker-src` alone.

**Embedded Studio.** Finding 1 again, from the other side: an authenticated admin UI is
mounted on the public origin for no reason, and although the CSP happens to break it, the
route and its bundle are still published.

**Token in the query string.** `/stats?token=` and `/api/insights?token=` accept the secret as
a URL parameter. It lands in browser history and any request log. The `/stats` page then
loads the Umami script and jsDelivr stylesheet with that URL as the document location
(`Referrer-Policy` trims it to the origin, but the exposure is still avoidable). A cookie set
once, or Netlify's own access control, would remove it.

**PDF proxy amplification.** `/api/pdf` is unauthenticated, unmetered and will stream up to
20 MiB per request from Sanity through a function. A loop against it costs bandwidth and
function minutes. The proxy exists only so PDF.js can fetch same-origin; allowing
`https://cdn.sanity.io` in `connect-src` and fetching directly would delete the route, the
tests and the exposure together.

**Visitor nonce.** `visitorNonce.ts` mints a `Math.random()` identifier and keeps it in
`localStorage` with no expiry. It is disclosed in `/privacy`, but it is a persistent
first-party identifier for a site whose stated posture is not to identify browsers. A
session-scoped value (`sessionStorage`) would join a booking to the session that made it,
which is all the pipeline needs.

**Portable Text links.** `markdown.ts` strips `javascript:` and `data:` hrefs;
`portableText.ts` relies on `@portabletext/to-html`'s default link renderer, which escapes
HTML but does not check the protocol. Content is author-only so the risk is low, but the two
renderers should have the same policy.

**Environment handling.** `SANITY_PROJECT_ID` is resolved through three different fallback
chains in `astro.config.shared.ts`, `src/lib/sanity.ts` and `src/pages/api/pdf.ts` (the last
with a hard-coded default). `INSIGHTS_TOKEN`, `CAL_WEBHOOK_SECRET`, `RATE_LIMIT_SALT`,
`ANTHROPIC_API_KEY` and `SANITY_API_TOKEN` are undeclared in `src/env.d.ts`. Astro's
`astro:env` schema would give one typed, validated definition.

**Nightly synthesis.** `netlify/functions/session-insights.mts` sends up to 200 sessions of
up to 100 events each to the Anthropic API. The prompt size is bounded but large. The
request options it passes (`betas`, `fallbacks`, `thinking`) should be re-verified against
the installed SDK version during the rewrite rather than carried over on trust.

## Code quality

**Two content paths for posts.** `post.body` (Portable Text) and `post.markdownBody`
(markdown) each need a renderer, a plain-text extractor, and a heading-id strategy
(`github-slugger` for one, `rehype-slug` for the other). The GPU calculator is spliced in
by searching rendered HTML for a `{{interactive}}` placeholder (`utils/split-html.ts`).
Picking one body format and giving the calculator a proper Portable Text block type removes
four files.

**Slug aliasing.** `publicPostSlug`/`contentPostSlug` appear in `writingData.ts`, `work.ts`,
`embeddings.ts`, `sitemap.xml.ts`, `posts/[slug].astro`, and are missing where they should be
in `rss.xml.ts` and `RelatedPosts.astro`. Renaming the slug in Sanity and adding one
redirect rule ends this.

**Ghost `project` documents.** Five published work stories still reference a `project`
document type that was removed from the schema in August 2026. The work page reads
`liveUrl` and `githubUrl` off those unreachable documents. Studio cannot edit them. The data
needs migrating onto `workStory` before any rewrite, or the rewrite inherits the ghost.

**Schema fields nothing renders.** On `workStory`: `status`, `service`, `metric`, the four
reflection fields, and `problem`/`interventions` outside a fallback branch. `kind`'s help
text still describes `/projects`. `post.coverImage` is never read. The `graphic.kind` enum
couples the CMS to one bespoke component per project in `WorkGraphic.astro` (415 lines).

**Layout.astro** is 295 lines carrying SEO, two JSON-LD blocks, theme boot, fonts, KaTeX,
Umami, global CSS and the shell import. `THEME_COLORS` duplicates two token values on
purpose and is passed through `define:vars` into two separate inline scripts.

**Dependencies.** `sanity`, `react`, `react-dom`, `styled-components`, `@sanity/vision`,
`@astrojs/check`, `typescript` and `sharp` sit in `dependencies`; `@huggingface/transformers`
(a build-time dependency) sits in `devDependencies`. `fontaine` generates fallback metrics
that Astro 7's stable `fonts` config now does natively. `@netlify/functions` is needed only
for the `Config` type. `studio-production/package.json` is a symlink to the root manifest.

**Tests.** The 100 tests are almost entirely around the API and analytics libraries, which is
where the risk was. Nothing exercises rendering: no test loads built HTML and checks
canonical URLs, `og:image` resolvability, internal links, JSON-LD validity or the
RSS/sitemap slug set. Such a test would have caught findings 4 and 5.
`tests/pdf-viewer.test.ts` extracts an inline script from an `.astro` file with a regex and
runs it in a VM, which is inventive and brittle. `tests/view-transitions.test.ts` asserts the
absence of a feature by scanning source text.

**Docs drift.** `docs/exec-plans/visitor-context.md` references `Bend.tsx`,
`src/lib/circuit/`, `studio-production/schemaTypes/` and `SITE-OVERVIEW.md`, none of which
exist. `README.md` still describes an "embedded CMS". `todo.md` sits at the root. The Sanity
publish webhook that the docs call mandatory is configured outside the repo and nowhere
recorded.

**Small things.** `Footer.astro` finds the LinkedIn URL by substring search over
`SOCIAL_PROFILES`. The Umami website id is hard-coded in `Layout.astro` and
`cal-webhook.ts`. `Logo.astro` uses `#ff3d3d` and `#3dd8ff`; `WorkGraphic.astro` uses
`#c5c1b8`, `#efece4`, `#111713` and `rgb(7 9 8 / 88%)`; `PDFViewer.astro` uses `#ef4444`. All
break the tokens-only colour rule. `posts/[slug].astro` has an `Astro.redirect("/404")`
branch that cannot run under `getStaticPaths`. `utils/` holds three files that belong in
`lib/`.

## Worth keeping

Not everything should be rebuilt from nothing. These parts are good and a rewrite should
carry them over, adjusting names only where the new structure demands it.

- The rendering model: `output: 'static'`, Netlify adapter, five on-demand routes, `format:
  'file'` with `trailingSlash: 'never'`, redirects in `netlify.toml` rather than Astro config.
- `src/lib/analytics.ts`, `rateLimit.ts`, `sessionStore.ts`, `recommendations.ts`,
  `timingSafe.ts`, `escape.ts` and their tests. Pure, validated, well-explained.
- The API routes' shape: validate first, meter the protected resource, fail closed on
  missing secrets, never surface analytics failures to the visitor.
- The design tokens palette in `tokens.css` (the ink, paper, line and signal values), the
  three self-hosted typefaces, `primitives.css`, and `Button.astro` as the one control.
- The September 2026 editorial pages: `index.astro`, `work/index.astro`, `WorkCard.astro`,
  `PageHeader.astro`, `writing/index.astro`, `reading/index.astro`, `about.astro`, the legal
  pages. Their copy and layout are the target register; their code is the reference for the
  article pages.
- `validateWorkStories` failing the build on bad content.
- The `.claude/` hooks and `PLANS.md` discipline.
- The pre-paint theme resolver's logic (stored choice wins, otherwise system, keep following
  system until an explicit toggle).

## What any rewrite must preserve

These are facts, not design choices. The plan has to carry every one of them or state why
it drops one.

**Public URLs that return 200 today.** `/`, `/work`, `/work/{you-inc, sprint-coach,
home-lab, brontehf, gpu-share, health-agent, wildfire-pyspark}`, `/writing`, `/posts/[slug]`
(including `/posts/building-a-private-ai-server-for-friends`), `/reports/[slug]`,
`/tags/[tag]`, `/reading`, `/about`, `/cv`, `/cv.pdf`, `/contact`, `/privacy`, `/terms`,
`/rss.xml`, `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/site.webmanifest`, `/HB_logo.svg`,
`/410.html`. Private: `/stats`. API: `/api/pdf` (GET), `/api/collect` (POST),
`/api/insights` (GET), `/api/cal-webhook` (POST), `/api/recommend` (POST).

**Redirects (all `force = true`, all in `netlify.toml`).** 301: `/projects` to `/work`;
`/projects/{sprint-coach, brontehf, you-inc, gpu-share, health-agent}` to the matching
`/work/` URL; `/posts/gpu-share` to `/posts/building-a-private-ai-server-for-friends`;
`http://hamishburke.dev/*` and `https://www.hamishburke.dev/*` to `https://hamishburke.dev/:splat`.
410 to `/410.html`: `/projects/{bedroom-layout-designer, drop-eta, otto,
piano-improvisation-helper, wiki-router}` and
`/reports/a-survey-of-nosql-databases-and-polyglot-persistence-patterns`. `/tools` redirects
to `/work` from an Astro page only and should become a Netlify rule.

**Sanity.** Project `qnuj1c4o`, dataset `production`, API version `2024-01-01`, read through
the CDN except for RSS. Document types: `post`, `report`, `book`, `workStory`, and the
singletons `siteSettings`, `aboutPage`, `cvPage`, `writingIndexPage`, `contactPage`,
`notFoundPage` (each with `_id` equal to its type name), plus the `blockContent` and
`ctaLink` object types. Field-level shapes are in `src/sanity/schemaTypes/*.ts`. The five
ghost `project` references described above exist in the dataset. Any schema change must be
reflected in `studio-production/sanity.config.ts`, which imports the same files.

**Environment.** Build: `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_VERSION` (set in
`netlify.toml` and CI). Runtime on Netlify only: `INSIGHTS_TOKEN`, `CAL_WEBHOOK_SECRET`,
`RATE_LIMIT_SALT`, `ANTHROPIC_API_KEY`. Local scripts only: `SANITY_API_TOKEN`. None are
committed.

**External services.** Netlify hosting with Blobs stores `sessions`, `session-insights`,
`rate-limits`, `recommendations` and a scheduled function at `0 15 * * *` UTC. Sanity.
Umami Cloud, website id `3b77a67f-19f6-4f3c-a7ab-8af0d58bfbc6`, script from `cloud.umami.is`,
collection to `gateway.umami.is`. Cal.com at `https://cal.com/hamishburke/30min`, echoing
`metadata[ref]` on `BOOKING_CREATED`. Cloudflare in front of Netlify. Anthropic API from the
nightly function. A Netlify build hook that Sanity publishes must trigger (configured outside
the repo).

**Site constants.** `SITE_URL https://hamishburke.dev`, name and author "Hamish Burke",
`CONTACT_EMAIL hamishapps@gmail.com`, Twitter `@Slaymishh`, GitHub `Slaymish`, LinkedIn
`hamish-burke-2301669a`, Instagram `hamishburke.studio`, Wellington, New Zealand,
`Pacific/Auckland`.

**Security invariants.** The PDF proxy constraints (or an equivalent that removes the proxy).
Token gating with constant-time compare on `/stats` and `/api/insights`. HMAC-SHA256
verification of `x-cal-signature-256`. Rate limiting on every anonymous write. No IP, agent,
referrer or cookie stored by the collector or the recommendation box. `noindex` on `/stats`,
absent from sitemap and `llms.txt`. Security headers at least as strict as today's.

**Content rules (from `AGENTS.md`).** No em dashes in site copy. All copy in the
`hamish-voice` register. No candour framing ("what I'd do differently"). UK English. Colour
tokens used whole, no opacity modifiers.

**Fonts.** Geist variable (latin, latin-ext), Instrument Serif 400, JetBrains Mono 400 and
500, self-hosted from `public/fonts/`, Geist preloaded.

**Repo tooling.** pnpm 10, Node 22, `pnpm run build` runs `astro check` first, tests under
`tests/*.test.ts` with `tsx --test`, knip, the three `.claude/hooks/` scripts, CI on push and
PR, Studio built in CI.

## Decisions the plan has to make

These are the choices that shape the rewrite. Each has a defensible answer either way; the
plan must pick one and say why.

- **Stack shape.** Keep Astro 7 + Sanity + Netlify and cut, or change any of the three.
- **Where copy lives.** All in Sanity (including the homepage and the You Inc narrative),
  all in templates, or a stated line between them.
- **Work graphics.** Keep hand-built diagrams as code, move the figures they show into
  `workStory` fields and render from data, or replace them with images.
- **Post body format.** Portable Text only, markdown only, or keep both.
- **The analytics pipeline.** Keep the collector, webhook, nightly synthesis and `/stats`, or
  keep only Umami and delete around 900 lines and four Blobs stores.
- **PDF delivery.** Keep the proxy, or allow `cdn.sanity.io` in `connect-src` and delete it.
- **Related content.** Build-time embeddings, tag overlap, or a curated reference field.
- **Embedded Studio.** Remove `studioBasePath` (and the React dependency chain with it) and
  keep only `studio-production/`.
- **Article pages.** Redesign to the editorial system, and whether the TOC survives.
- **Data cleanup before code.** Migrate ghost `project` references onto `workStory`, rename
  the `gpu-share` post slug, drop unused `workStory` fields.
