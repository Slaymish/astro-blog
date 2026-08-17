# Site Overview

Last updated: 2026-08-12

A general orientation document for the current state of hamishburke.dev: what
the site is, how it is built, and how it is structured. For architectural
boundaries and invariants, see `ARCHITECTURE.md`; for a file-level "where do I
change X" map, see `AGENTS.md`.

## What the site is

Hamish Burke's personal site. As of the August 2026 reposition it is framed
around what he builds, writes, and is currently trying to understand, rather
than as a freelance pitch: independent projects and writing lead, and
professional/client delivery sits behind them as evidence of capability. It
also carries engineering reports, a reading list, and a CV. Content is authored
in Sanity Studio and rendered as a fully static, prerendered Astro site deployed
to Netlify.

The reposition is specified in `docs/exec-plans/2026-08-12-site-redesign.md`.

## Stack

| Layer | Choice |
|---|---|
| Framework | Astro 5 (`output: 'static'`, `build: { format: 'file' }`) |
| UI islands | React 19 (via `@astrojs/react`), used selectively — most pages are plain Astro/HTML |
| CMS | Sanity (headless), queried with GROQ via `@sanity/client` |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`, CSS-based `@theme`), custom design tokens in `src/design-system/` |
| Content transforms | Sanity Portable Text → HTML/plaintext, Markdown → HTML/plaintext, MDX for local content |
| Hosting | Netlify (`@astrojs/netlify` adapter), static output + a handful of on-demand functions |
| Package manager | pnpm (CI/Netlify both pin to it) |
| Language | TypeScript throughout |
| Testing | Node's built-in test runner via `tsx --test`, in `tests/*.test.ts` |
| Local semantic search | `@huggingface/transformers`, embeddings computed at build time (no external API) |
| Analytics | Umami Cloud (client beacons) + a first-party session collector backed by Netlify Blobs |

Two content sources coexist by design: Astro content collections
(`src/content/`, `src/content.config.ts`) exist in the repo but are **not**
the runtime path — all published content is fetched live from Sanity through
`fetchSanity()` in `src/lib/sanity.ts`.

## Site structure (sitemap)

### Primary nav (from Sanity `siteSettings`, editable — not hardcoded)

- `/projects` — Independent builds
- `/writing` — Writing
- `/work` — Professional and client delivery
- `/about` — About
- `/contact` — Contact

### Content routes

| Route | Purpose | Source type |
|---|---|---|
| `/` | Homepage: hero, interests, current state, projects, work, recent writing | mixed |
| `/projects` | Independent project index (`kind == 'independent'`) | `workStory` |
| `/work` | Professional/client index (`kind == 'professional'`) | `workStory` |
| `/work/[slug]` | Individual case study, **for both kinds** | `workStory` |
| `/writing` | Writing index, posts and reports in one stream | `post`, `report` |
| `/posts/[slug]` | Individual post | `post` |
| `/reading` | Reading list, grouped by status | `book` |
| `/reports/[...slug]` | Long-form report, optional embedded PDF | `report` |
| `/tags/[tag]` | Writing filtered by tag | `post`, `report` |
| `/about` | About page copy | `aboutPage` singleton |
| `/contact` | Contact page | `contactPage` singleton |
| `/cv` | CV page, links out to a PDF | `cvPage` singleton |
| `/privacy`, `/terms` | Static legal pages | static |
| `/404` | Not-found page | `notFoundPage` singleton |

Note that independent projects are listed on `/projects` but their detail pages
canonically live at `/work/[slug]`. See `ARCHITECTURE.md` invariant 3a for why.

### Legacy routes (kept for old links, not in primary nav)

- `/projects/[slug]` and `/tools` redirect (`301`) to `/work` or the successor
  slug. Retired slugs are served real `301`/`410` responses via `netlify.toml`,
  cross-checked against `src/lib/legacyRoutes.ts` (`projectSuccessors`,
  `archivedProjects`, `archivedReports`, etc.) so there is one source of truth
  for what happened to each old URL. `/projects` itself is now a real page.

### Crawl / machine-readable endpoints

- `/sitemap.xml` — Sanity-derived URL inventory (posts, work stories, reports, tags)
- `/robots.txt` — crawler policy
- `/rss.xml` — post feed (the one route that bypasses the Sanity CDN cache)
- `/llms.txt` — LLM-oriented site summary and key URLs

### API routes (the only non-prerendered pages, `prerender = false`)

- `/api/pdf` — allowlisted, HTTPS-only proxy for Sanity-hosted PDFs (content-type
  validation, redirect blocking; security-sensitive, do not weaken)
- `/api/collect` — first-party session-sequence collector, writes anonymised
  event batches to Netlify Blobs (no IP/UA/referrer/cookie stored)
- `/api/insights` — token-gated endpoint serving the nightly session-insights
  report synthesised from `/api/collect` data
- `/api/cal-webhook` — Cal.com booking webhook; records a *completed* booking
  as an analytics event (no attendee data stored, just the page path + nonce
  that was attached to the booking link)

## Content model (Sanity)

Defined in `src/sanity/schemaTypes/` (mirrored in `studio-production/schemaTypes/`
for the standalone Studio app — both must change together):

- `post` — writing entries
- `workStory` — case studies (the current "work" content type)
- `project` — legacy project entries, mostly superseded by `workStory`
- `report` — long-form reports, optional PDF
- `book` — reading list entries
- `blockContent` — shared rich text schema
- `ctaLink` — shared link object (label, destination, external flag, a11y label)

`workStory` carries a `kind` (`professional` or `independent`) that decides which
index it appears on, and independent stories must additionally answer four
reflection questions (`question`, `built`, `learned`, `differently`).

Static page copy is stored as fixed-ID singleton documents (no hardcoded
strings, no fallbacks — a missing singleton throws rather than rendering
empty markup): `siteSettings`, `homePage`, `aboutPage`, `cvPage`,
`workIndexPage`, `projectsIndexPage`, `writingIndexPage`, `contactPage`,
`notFoundPage`. Seeded/re-seeded via `pnpm run seed:copy` — which uses
`createOrReplace` and will overwrite Studio edits, so reconcile first.

## Rendering model

Everything is baked to HTML at build time (`output: 'static'`); Netlify serves
it from the CDN with no function invocation per request except the four API
routes above. Consequences:

- No request-time inputs (query params, headers, cookies) on pages — anything
  needing them resolves client-side.
- Publishing in Sanity only reaches the live site once a Netlify build hook fires.
- Dynamic routes enumerate their pages via `getStaticPaths` against Sanity at build time.

## Notable non-obvious pieces

- **`src/lib/circuit/`**: a decorative "data bus" SVG overlay threading
  through page gutters, present site-wide via `Layout.astro`. Pure geometry
  in `geometry.ts` (unit tested), DOM/lifecycle in `engine.ts`, presentation
  in `circuit.css`.
- **Theming**: light/dark via `.dark` class on `<html>`, resolved pre-paint by
  an inline script to avoid a flash of the wrong theme; both theme files
  define the same semantic roles.
- **Analytics is homegrown for querying**: Umami Cloud holds the dashboards,
  but its query API is paid, so a parallel first-party pipeline
  (`/api/collect` → nightly Netlify scheduled function → `/api/insights`)
  exists purely to synthesise session-sequence reports without that cost.

## Where the deeper docs live

- `ARCHITECTURE.md` — authoritative structural boundaries and invariants
- `AGENTS.md` — file-level "where do I change X" map
- `PLANS.md` — ExecPlan format for substantial features
- `docs/exec-plans/` — actual ExecPlan instances
- `docs/design-docs/` — design docs (theme guide, studio style guide, etc.)
- `docs/tech-debt-tracker.md` — known technical debt with evidence and next actions
