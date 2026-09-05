# Reposition hamishburke.dev from a freelance pitch to a record of what Hamish builds and thinks

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This document must be maintained in accordance with `PLANS.md` at the repository root.

## Purpose / Big Picture

Today a visitor landing on `hamishburke.dev` is sold to. The homepage headline is "Software for work that has outgrown the workaround", the hero's second button is "Discuss a project", and every single page ends with a band reading "Available for selected projects — Have a complicated problem? — Book a call". Writing, which is the most distinctive thing on the site, sits behind a navigation item that does not exist in the header at all.

After this change, a visitor lands on a page that says "I build things, and I want to understand what they're capable of", and can immediately go to three places: the things he has built independently, the things he has written, and who he is. Professional and freelance work is still there and still reachable, but as evidence of capability rather than as the site's reason for existing. Contact moves to its own page instead of shouting from the bottom of every other one.

Concretely, when this plan is complete you can start the dev server and observe all of the following, none of which is true today:

- `http://localhost:4321/` shows the new headline, a "what I'm interested in" section with three cards (Technology, Systems, Strategy), an honest "Currently" paragraph that says out loud that Hamish is a junior developer at Alphero, and links to Projects, Writing and About rather than a booking link.
- `http://localhost:4321/projects` returns a real page listing independent builds. Today it returns a redirect to `/work`.
- `http://localhost:4321/work` lists only professional and freelance delivery.
- A project page such as `http://localhost:4321/work/home-lab` shows a four-part reflection block answering "What was the question?", "What did I build?", "What did I learn?", "What would I do differently?".
- `http://localhost:4321/writing` and `http://localhost:4321/reading` are rendered in the same editorial design language as the rest of the site instead of the older tile-based one.
- `http://localhost:4321/contact` exists.
- Every page is set in Geist rather than Familjen Grotesk and Figtree.

The source brief lives outside this repository at `~/Documents/Personal/Personal Notes/Hamish Burke — Personal Website Redesign Brief.md`. Everything from it that matters is restated in this plan, so you do not need to read it.

## Progress

- [x] (2026-08-12) Research pass over the current site: routes, content model, design system, redirect handling.
- [x] (2026-08-12) Decisions taken with the site owner and recorded in the Decision Log.
- [x] (2026-08-12) This ExecPlan written.
- [x] (2026-08-12) Live singleton copy captured before any seeding, so Milestone 3 can reconcile rather than overwrite.
- [x] (2026-08-12) Milestone 1 — Typography swapped to Geist plus Instrument Serif. Both faces added to `public/fonts/` and declared in `src/design-system/fonts.css`; `--font-sans`, `--font-display` and `--font-serif` repointed in `tokens.css`; tracking retuned to `-0.035em` / `-0.025em`; the four bold `font-serif` call sites moved to `font-display`; Figtree and Familjen Grotesk deleted along with their stale preload tags in `Layout.astro`. Verified: build clean, 41/41 tests pass, Geist and Instrument Serif both report loaded in the browser, no horizontal overflow at 320, both themes checked at 1440.
- [x] (2026-08-12) Milestone 2 — Work and Projects split. `kind` plus the four reflection fields added to both schema copies; `WorkKind` and conditional validation added to `src/lib/work.ts`; projection extended with a `coalesce` default; `/projects` rebuilt as a real index; `/work` filtered to professional; reflection block and a kind-aware back link added to `/work/[slug]`; dead `bookingLabel` fields removed. Seven documents classified in Sanity (2 professional, 5 independent) with reflection answers drafted from their own case-study bodies. Verified: build clean, 44/44 tests pass, `/work` lists 2 and `/projects` lists 5 with no overlap, reflection block renders with the back link pointing at `/projects`.
  Remaining for Milestone 3: the nav still reads Home / Work / About because `siteSettings` has not been reseeded yet.
- [x] (2026-08-12) Milestone 3 — Copy and positioning rewritten. `homePage` restructured (hero links replacing the two calls to action, `interests` replacing `services`, `currently` replacing `approach`, separate projects/work/writing sections); `writingIndexPage` added; `aboutPage` copy moved off capability-selling; navigation reordered to Projects, Writing, Work, About; `src/lib/writingData.ts` added as the shared posts-plus-reports stream. All eight singletons reseeded. Verified: build clean, 44/44 tests pass, homepage renders the brief's running order, circuit routes three buses.
  Remaining for Milestone 5: the contact band still shows the availability badge and booking button.
- [x] (2026-08-12) Milestone 4 — `/writing`, `/reading`, `/tags/[tag]` and `/404` rebuilt on the editorial system. `GridTile` deleted, along with roughly 300 lines of orphaned CSS in `src/styles/globals.css` (bento grid, tile, neumorphic button, filter pill, status chip, gradient text) and the dead `--tile-*` token block in `tokens.css`. Tag filtering kept, now with correct `aria-pressed` state. Verified: filter narrows 5 entries to 3 and back; no page overflows at 320.
- [x] (2026-08-12) Milestone 5 — `/contact` added, backed by a new `contactPage` singleton. `ContactBand` reworked: availability badge removed, primary action points at `/contact`, and a `booking` prop limits the Cal.com button to `/work` and professional case studies. Verified per-page: `/`, `/projects`, `/about` and independent case studies show the contact link only; `/work` and `/work/sprint-coach` show the booking button.
- [x] (2026-08-12) Milestone 6 — `/projects` and `/contact` added to the sitemap with `/writing` promoted; `llms.txt` rewritten off lead-generation copy; `SITE_DESCRIPTION` updated; `ARCHITECTURE.md` (including new invariant 3a), `AGENTS.md`, `docs/SITE-OVERVIEW.md` and `docs/tech-debt-tracker.md` all brought current.

Outstanding, deliberately left to Hamish:

- [ ] Review and rewrite the drafted reflection answers on the five independent projects in Studio, especially "what would I do differently".
- [ ] Decide the fate of `public/images/cats/` and `public/images/flashlight.*`: revive the interaction or delete the assets.
- [ ] Trigger a Netlify build so the reposition reaches the live site.

## Surprises & Discoveries

- Observation: The playful "cat and torch" interaction that the brief asks to preserve no longer exists in the codebase. The assets are still on disk but nothing references them.
  Evidence: `public/images/cats/cat1.png` through `cat5.png` and `public/images/flashlight.png` / `.webp` are present, but `rg -n "flashlight|images/cats" src public` returns no matches outside the asset files themselves.

- Observation: `siteSettings.header.bookingLabel` and `siteSettings.header.bookingLabelShort` are dead content fields. They are defined in the schema and populated by the seed script, but `src/components/layout/Header.astro` renders only the nav links and the theme toggle.
  Evidence: Reading `src/components/layout/Header.astro` end to end; the identifiers do not appear.

- Observation: There is no bare `/projects` redirect rule in `netlify.toml`. The redirect comes from a three-line Astro page, so freeing the route is a file deletion rather than a config edit.
  Evidence: `src/pages/projects/index.astro` contains only `return Astro.redirect('/work', 301);`. `grep -n 'from = "/projects"' netlify.toml` matches only the five slug-level rules and the four archived-slug 410 rules.

- Observation: `docs/SITE-OVERVIEW.md` documents a `/lab` route that does not exist in `src/pages/`.
  Evidence: `find src/pages -type f` lists no `lab` entry.

- Observation: `docs/tech-debt-tracker.md` is out of date about the test suite. It records `TD-001` as a live `P0` failure in `tests/markdown-safety.test.ts`, but the baseline suite is entirely green, and `src/lib/markdown.ts` now does strip script tags and `javascript:` links. The tracker was last updated 2026-02-12 and the fix evidently landed after that without the entry being moved to `Closed Debt`.
  Evidence: `pnpm run test` on an unmodified tree reports `# tests 41 / # pass 41 / # fail 0`.

- Observation: The live Sanity copy has genuinely drifted from `scripts/seed-page-copy.ts`, which confirms that running `pnpm run seed:copy` blind would destroy real edits. The homepage hero is the affected part; everything else still matches the seed. Live values as at 2026-08-12 were eyebrow "Hamish Burke / Full stack developer at Alphero • Wellington, NZ", headline "Your business evolved." with accent "Your software should too.", and lede "Custom-engineered software for complex workflows that off-the-shelf tools and AI quick-fixes can't safely handle." The seed script instead holds "Software for work that has outgrown the / workaround." Note this drifted copy is *more* sales-oriented than the seed, which strengthens the case for the reposition rather than weakening it.
  Evidence: Queried `*[_id in $ids]` against the production dataset for all six singletons and diffed against the seed script by eye. Note that `src/lib/sanity.ts` cannot be imported from a plain script because it reads `import.meta.env`, which only exists under Vite; use `@sanity/client` directly, as `scripts/seed-page-copy.ts` does.

- Observation: `tests/work.test.ts` already exists and already covers `validateWorkStories`, with a `story(overrides)` fixture builder at the top. New validator tests belong there rather than in a new file. The fixture will need `kind: 'professional'` added once `kind` becomes a required field on the `WorkStory` interface, or every existing test in the file will fail to type-check.
  Evidence: `tests/work.test.ts:11-37` defines the builder; six tests below it exercise the validator and the URL helpers.

- Observation: Content written to Sanity does not appear in a build for up to about two minutes. `fetchSanity` in `src/lib/sanity.ts` deliberately uses Sanity's edge CDN (`useCdn: true`, with the comment "bounded eventual consistency (~2 min)"); only `fetchFreshSanity`, used by the RSS route, bypasses it. A build run immediately after a content write silently produces the old content with no error.
  Evidence: Patched all seven `workStory` documents with `kind`, rebuilt at once, and got an empty `/projects` and all seven stories still on `/work`. Querying the same GROQ through a `useCdn: false` client returned the new values while a `useCdn: true` client still returned the old ones. Both agreed a couple of minutes later and the rebuild was correct.

- Observation: The reflection block gets the right emphasis for free. It reuses the `case-snapshot` class, whose last row (`.case-snapshot__result`) is styled in the action colour. That row is "What would I do differently?", which is exactly the question the brief says a portfolio normally omits.
  Evidence: Screenshot of `/work/home-lab` at 1440 in dark theme.

- Observation: A published post was missing from the site's own writing index and sitemap. `src/pages/writing/index.astro` and `src/pages/sitemap.xml.ts` both filtered with `slug.current != "gpu-share"`, but that post is built (as `/posts/building-a-private-ai-server-for-friends`, via the `publicPostSlugs` alias in `src/lib/legacyRoutes.ts`) and is the primary artifact linked from `/work/gpu-share`. The filter appears to have been meant to avoid listing the stale URL, but it dropped the entry entirely instead of listing it under its public slug. `src/lib/writingData.ts` now maps every post through `publicPostSlug()` and excludes nothing, so the post appears on `/writing` and the homepage.
  Evidence: `ls dist/posts/` shows the page is generated; the old writing query returned two posts where Sanity holds three.

- Observation: A pre-existing schema drift, exactly the risk `TD-003` describes. `src/sanity/schemaTypes/project.ts` declared a `relatedPost` reference field that `studio-production/schemaTypes/project.ts` did not, so the standalone Studio could not edit it. Nothing in this plan caused it. Both copies are now identical, and a `diff` across every file in the two directories is a cheap check worth running before any schema commit.
  Evidence: `for f in $(ls src/sanity/schemaTypes/); do diff -q "src/sanity/schemaTypes/$f" "studio-production/schemaTypes/$f"; done` reported only `project.ts`.

- Observation: Restructuring the homepage silently killed the circuit overlay in the hero, precisely the markup-contract hazard this plan warned about. The bus `BUS_01` still had its `data-circuit-source` on the headline accent, but the only `data-circuit-node` in that region had been the capabilities strip, which the rewrite replaced with an interests section in a *different* `<section>`. A bus with a source and no reachable node draws nothing, and no test failed.
  Evidence: The hero rendered with no pipes after the rewrite; adding `data-circuit-node="start"` to the hero links restored three buses and 39 rendered paths.

## Decision Log

- Decision: `/work` and `/projects` become two real index routes, but every case-study detail page stays at `/work/[slug]`.
  Rationale: The brief asks for both routes. Moving detail pages to `/projects/[slug]` would mean issuing 301s from `/work/[slug]`, which reverses redirects that were only recently pointed the other way (the five `/projects/<slug>` to `/work/<slug>` rules in `netlify.toml`). Two index routes give the brief's information architecture at zero URL cost.
  Date/Author: 2026-08-12, agreed with Hamish.

- Decision: Which index a story appears on is controlled by a new `kind` field, not by the existing `status` field.
  Rationale: `status` (`lead` / `support`) already means "featured card or compact row" and is used for presentation within an index. Overloading it to also mean "professional or independent" would couple two unrelated axes and make it impossible to have, say, a featured independent project.
  Date/Author: 2026-08-12.

- Decision: Typography moves to Geist for both display and interface, with Instrument Serif for restrained emphasis, keeping JetBrains Mono for meta text.
  Rationale: The brief asks for "Inter / Geist / similar sans" plus an optional restrained serif, and warns against excessive monospace. Geist is a single variable file, so replacing both Familjen Grotesk (variable) and Figtree (four static weights) with it reduces the number of font files served from six to two.
  Date/Author: 2026-08-12, chosen by Hamish from a shortlist.

- Decision: The four reflection questions become dedicated schema fields rather than a body-text convention.
  Rationale: The brief's value is in the discipline. "What would I do differently?" is the question a portfolio naturally omits; making it a required field when `kind` is `independent` means it cannot be quietly skipped.
  Date/Author: 2026-08-12, chosen by Hamish.

- Decision: You Inc is classified as independent, not professional, leaving `/work` with two stories and `/projects` with five.
  Rationale: Its copy describes a product Hamish built and deployed himself rather than a client engagement, and the brief wants projects to become the strongest part of the site. A thin `/work` is the honest result and is consistent with "document the trajectory".
  Date/Author: 2026-08-12, chosen by Hamish.

- Decision: The reflection fields use a conditional `rule.custom()` in the Sanity schema rather than being left unvalidated there, in addition to the TypeScript check.
  Rationale: The plan originally put the requirement only in `validateWorkStories`, on the grounds that a plain `required()` fires even while a field is hidden. A custom rule that returns true unless `kind` is `independent` gets the best of both: editors see the error in Studio immediately, and the build still cannot pass with a gap.
  Date/Author: 2026-08-12.

- Decision: The first-pass reflection answers were drafted by condensing each project's existing summary, problem, result and body copy, and are to be corrected by Hamish in Studio.
  Rationale: Three of the four questions were already answered somewhere in the existing case-study text, so drafting them is restatement rather than invention. "What would I do differently" was not answered anywhere; those drafts are inferences from the limitations each case study already admits (for example GPUShare's broken post-split installer and incomplete upload sandboxing) and need his voice. Nothing reaches the live site without a Netlify build hook he controls.
  Date/Author: 2026-08-12, chosen by Hamish.

- Decision: `/now`, `/uses` and `/experiments` from the brief's sitemap are deferred.
  Rationale: Hamish elected to build `/contact` only. `/now` in particular is cheap to add later because the singleton pattern is already established; the navigation should be laid out so it can be inserted without rebalancing.
  Date/Author: 2026-08-12, chosen by Hamish.

- Decision: The freelance framing is softened rather than removed.
  Rationale: The brief states the site "should still make freelance/client work possible, but that should be evidence of capability, not the central identity". Removing the booking path entirely would overshoot.
  Date/Author: 2026-08-12, chosen by Hamish.

## Outcomes & Retrospective

All six milestones are complete and every acceptance condition in this plan has been observed in a browser against the dev server. `pnpm run build` reports 0 errors and 0 warnings, `pnpm run test` reports 44 of 44 passing (up from 41; three of the new tests cover the conditional reflection validation), and no page overflows horizontally across ten routes at five viewport widths.

What the site does now that it did not before: the homepage leads with "I build things, and I want to understand what they're capable of", states plainly that Hamish is a junior developer at Alphero, and routes visitors to Projects, Writing and About rather than a booking link. `/projects` exists as a real page listing five independent builds, each of which answers four reflection questions on its detail page. `/writing` is a first-class section on the same design language as the rest of the site rather than a tile grid. `/contact` exists, and the booking call to action now appears on exactly two kinds of page instead of all of them.

Three things worth carrying forward.

The **first** is that the riskiest part of this work was never the code. It was Sanity: singletons with no fallbacks mean schema, seed data and template must move together, `createOrReplace` will silently eat Studio edits, and the CDN makes a build run immediately after a write produce stale output with no error at all. Capturing every singleton to a file before touching the seed script was the single most useful precaution taken, and it caught three genuine drifts that would otherwise have been destroyed.

The **second** is that the circuit overlay is a markup contract with no test behind it, and it broke exactly as predicted during the homepage rewrite: a bus lost its only node, drew nothing, and no check failed. The prediction was in the plan and it still took a screenshot to notice. Anything with a data-attribute contract and no assertion needs a visual check, not a build.

The **third** is scope discovery. Three real defects surfaced that had nothing to do with the brief: a published post missing from both the writing index and the sitemap, a schema field the standalone Studio could not edit, and a tech-debt entry claiming a `P0` failure that had been fixed months earlier. All three were cheap to fix while already in the relevant file. The lesson is that the audit is worth doing even when the task is a redesign.

What was deliberately not done: `/now`, `/uses` and `/experiments` from the brief's sitemap; the BUILD / LEARN / THINK / OBSERVE buckets for writing, which need a schema field and a backfill; and the decision on the orphaned cat-and-torch assets. The reflection answers currently in Sanity are first drafts derived from Hamish's own case-study copy and need his voice before the site is deployed.

## Context and Orientation

This section assumes you have never seen this repository.

### What the site is and how it is built

`hamishburke.dev` is a personal website: case studies, technical writing, long-form reports, a reading list and a CV. It is an **Astro** site (Astro is a web framework that renders pages to HTML) configured with `output: 'static'`, which means every page is turned into a plain HTML file at build time and served from Netlify's CDN. The package manager is **pnpm**, not npm; the committed lockfile is `pnpm-lock.yaml` and both CI and Netlify use pnpm.

The commands you will need, all run from the repository root `/Users/hamish/Documents/Personal/astro-blog`:

    pnpm run dev          # dev server on http://localhost:4321
    pnpm run build        # runs `astro check` then `astro build`; type errors fail the build
    pnpm run test         # runs `tsx --test tests/*.test.ts`
    pnpm run seed:copy    # publishes the page-copy documents into Sanity
    pnpm exec knip        # reports unused files, exports and dependencies

There is no package.json script for `knip`; it is invoked through `pnpm exec` as shown.

Note that the test glob is `tests/*.test.ts` and not `tests/**/*.test.ts`. A test file placed in a subdirectory of `tests/` will silently never run.

### Where content comes from

Published content is **not** in this repository. It lives in **Sanity**, a hosted content management system, and is fetched over the network at build time using a query language called **GROQ**. The client and the fetch helper are in `src/lib/sanity.ts`, exposing a function `fetchSanity`.

An environment variable `SANITY_PROJECT_ID` is required. It is validated in `astro.config.ts`, so a missing `.env` file causes an immediate, clear failure before Astro starts. `SANITY_DATASET` defaults to `production` and `SANITY_API_VERSION` defaults to `2024-01-01`.

There is a decoy: `src/content/` and `src/content.config.ts` define Astro "content collections" (a built-in local-file content system). These are **not** the runtime path and no page reads them. Do not add content there.

Two kinds of Sanity documents matter here.

**Content documents** have many instances: `post` (writing entries), `workStory` (case studies), `report` (long-form reports), `book` (reading list entries), and a legacy `project` type that `workStory` superseded. Their schemas are in `src/sanity/schemaTypes/`.

**Page-copy singletons** have exactly one instance each, addressed by a fixed document ID rather than by a slug: `siteSettings`, `homePage`, `aboutPage`, `cvPage`, `workIndexPage` and `notFoundPage`. They exist so that no user-facing string is hardcoded in a template. They are read through `src/lib/pageContent.ts`, which exposes one getter per singleton (`getHomePage`, `getSiteSettings`, and so on) built on a private `fetchSingleton` helper.

The single most important thing to understand about the singletons: **there are no fallback values**. `fetchSingleton` throws a descriptive error if the document is absent, and templates read fields directly. Therefore, if you add a required field to a singleton's schema and read it in a template, the build will fail until that field has an actual value in the Sanity dataset. Schema, seed data and template must move together.

The seed script is `scripts/seed-page-copy.ts`, run via `pnpm run seed:copy`. It requires a second environment variable `SANITY_API_TOKEN` with write access. **It uses `createOrReplace`**, which means running it overwrites whatever is currently in the dataset, including any copy edited by hand in Sanity Studio since the last seed. Before running it against the production dataset, read the current values out of Studio and fold any that you want to keep back into the script.

There is a second copy of every schema definition in `studio-production/schemaTypes/`. That directory is a standalone Sanity Studio application. The two copies are not shared through a module; they are duplicates, and keeping them in step is a manual discipline. This is logged as `TD-003` in `docs/tech-debt-tracker.md`. **Every schema edit in this plan must be made twice.**

### Routing, redirects and why they are fiddly

Because the site is statically built, dynamic routes enumerate their pages at build time through Astro's `getStaticPaths` function, querying Sanity for the list of slugs.

Retired URLs are handled in two places that must be kept consistent, and the reason is worth knowing. Astro's own `redirects` configuration option emits HTML pages containing a meta-refresh tag, which search engines treat as weaker than a real HTTP redirect and which can outrank the destination. So real `301` and `410` responses are declared as `[[redirects]]` blocks in `netlify.toml`, and `src/lib/legacyRoutes.ts` holds the same information as exported data (`projectSuccessors`, `archivedProjects`, `archivedReports`, `publicPostSlugs`) so there is one source to check the Netlify rules against. If you change one, change the other.

Also note `build: { format: 'file' }` and `trailingSlash: 'never'` in `astro.config.ts`. Pages are emitted as `/work.html` and canonical URLs never carry a trailing slash.

### The design system

Styling is Tailwind CSS v4 wired in through `@tailwindcss/vite`, but most of the site is written as plain scoped CSS inside `.astro` files using custom properties rather than Tailwind utility classes.

`src/design-system/tokens.css` is the single source of truth for design tokens. `src/design-system/themes/light.css` and `themes/dark.css` map colour primitives onto semantic roles (`--color-text-primary`, `--color-action`, `--color-stroke-subtle` and so on); both files must define the same set of roles. Dark mode is a `.dark` class on the `<html>` element, resolved before first paint by an inline script in `src/components/layout/Layout.astro`. `src/styles/globals.css` bridges the tokens into Tailwind's `@theme inline` block so utility classes can reach them.

The themes also define a set of shorter aliases for the older pages: `--text`, `--text-muted`, `--accent`, `--border`, `--surface` are aliases onto the semantic roles above. Seeing `var(--text)` in a file is a reliable signal that the file belongs to the older generation.

**The site has two visual generations, and this matters for the work.** The pages `/`, `/work`, `/work/[slug]`, `/about` and `/cv` use the current editorial language: an eyebrow line in the action colour, a very large fluid heading, a secondary-colour intro paragraph, and content separated by thin horizontal rules with generous whitespace. The pages `/writing`, `/reading`, `/tags/[tag]` and `/404` are still written with Tailwind utility classes, the `var(--text)` aliases, and a neumorphic tile component `src/components/ui/GridTile.astro`. Milestone 4 closes that gap.

### Two non-obvious mechanisms you must not break

**Bend.** `src/components/canvasui/Bend.tsx` is a vendored component copied from a shadcn registry; it is not an npm dependency. `Layout.astro` wraps all page content in it. The consequence is that **Bend owns the scroll container and the document itself does not scroll**. The header is rendered outside Bend on purpose so it never folds. Anything that binds to scroll must use capture-phase event listeners, because Bend swaps the scrolling element when its canvas activates.

**The circuit overlay.** `src/lib/circuit/` draws a decorative "data bus": pipes that leave a source element, turn onto a shared vertical spine running down the page gutter, and branch off to reach other elements, with packets of light travelling along them. It is the site's one genuinely distinctive visual element and the brief explicitly asks to keep something like it.

It is split into `geometry.ts` (pure routing mathematics, unit tested in `tests/circuit-geometry.test.ts`), `engine.ts` (all DOM, SVG and lifecycle handling) and `src/design-system/circuit.css` (presentation). Regions opt in through HTML data attributes: `data-circuit` names a bus on a section, `data-circuit-source` marks the element a bus originates from, `data-circuit-node` marks an element a branch should reach, and `data-circuit-rail` marks an element a branch travels over.

Two hazards. First, the geometry tokens in `tokens.css` (everything prefixed `--circuit-`) must stay in `px`, `ms` or unitless values, because the engine reads them off computed style and relative units would resolve against the wrong box. Second, and more relevant to this plan, **the tests cover the routing mathematics but not the markup contract**. If you move or drop a `data-circuit-source` attribute while restructuring the homepage, no test will fail; the overlay will just route to the wrong place or not render. You have to look at it.

One more consequence: the page gutter token `--page-gutter` has a floor set by the circuit spine rather than by the typography, because the spine runs down the middle of the gutter and must stay clear of the screen edge on narrow viewports. Do not reduce it.

### Current shape of the pieces you will change

`src/pages/index.astro` reads `getWorkStories()` and `getHomePage()`, then renders four sections: a hero (eyebrow, split headline with a coloured accent span, lede, two buttons, and a three-item capabilities strip), a "Selected work" section listing `WorkCard` components for stories whose status is `lead`, an "approach" section, and the shared `ContactBand`. The hero's accent span carries `data-circuit-source` and is the origin of the homepage's main bus.

`src/pages/work/index.astro` reads `getWorkStories()` and `getWorkIndexPage()` and splits the stories into a "Lead work" section of featured cards and a "Technical studies" section of compact rows.

`src/pages/work/[slug].astro` renders a case study: hero with descriptor and summary, links out to "artifacts" (the underlying project, post or report documents that a story references), an editorial graphic, and the Portable Text body converted to HTML by `src/lib/portableText.ts`.

`src/lib/work.ts` holds the `WorkStory` TypeScript interface and a `validateWorkStories(stories)` function that returns an array of human-readable error strings. `src/lib/workData.ts` holds the GROQ projection `workStoryFields` and the two fetchers `getWorkStories` and `getWorkStory`, both of which run the validator and throw if it returns anything. This validator is the right place to enforce new content rules, because both read paths go through it.

`src/components/work/ContactBand.astro` renders the availability label, a heading, a Cal.com booking button and an email address. It is included at the bottom of `/`, `/work`, `/work/[slug]` and `/about`.

## Plan of Work

The work is six milestones. They are ordered so that each one leaves the site in a working, buildable state.

There is one ordering constraint worth stating up front. Instrument Serif ships a single weight, 400. The Tailwind class `font-serif` resolves through `src/styles/globals.css` to the `--font-serif` token, which is currently just an alias for the display face, and it is used at bold weights in four places: `src/pages/writing/index.astro`, `src/pages/reading/index.astro`, `src/pages/404.astro` and `src/components/ui/GridTile.astro`. If `--font-serif` becomes a real serif while those call sites still ask for `font-bold`, the browser will synthesise a fake bold and those headings will look wrong. Milestone 1 therefore changes those four call sites to use the display face explicitly, even though Milestone 4 will later rewrite three of those files and delete the fourth. This is deliberate belt-and-braces: it keeps every intermediate state shippable.

### Milestone 1 — Typography

Fonts are self-hosted. The `.woff2` files live in `public/fonts/` and are declared as explicit `@font-face` rules in `src/design-system/fonts.css`. The rules are written out longhand rather than using `@import` so that the `FontaineTransform` Vite plugin configured in `astro.config.ts` can parse them and generate metric-matched local fallback fonts, which is what stops text jumping when the web font finishes loading. Because the plugin reads the CSS, adding a face needs no configuration change: drop the file in `public/fonts/` and add the rule.

Obtain Geist (variable, weight range 400 to 700) and Instrument Serif (400) as `.woff2`, in both a latin and a latin-extended subset, matching the naming convention already in the directory. The existing files came from the `@fontsource` packages; installing `@fontsource-variable/geist` and `@fontsource/instrument-serif` transiently and copying the files out is the established route, and neither package should end up in `package.json` because the files are committed instead.

Add the `@font-face` blocks to `src/design-system/fonts.css`, copying the `unicode-range` values verbatim from the existing Figtree blocks — the latin and latin-extended ranges are the same for every face.

In `src/design-system/tokens.css`, point `--font-sans` and `--font-display` at Geist and `--font-serif` at Instrument Serif. `--font-serif` currently carries the comment "compatibility alias"; it becomes a real token, so delete the comment. Leave `--font-mono` on JetBrains Mono.

Retune `--tracking-display` and `--tracking-heading`. They are currently `-0.045em` and `-0.03em` and the comment above them states they are tuned to Familjen Grotesk and must be revisited if the display face changes. Geist has different optical proportions; set them by eye against the homepage hero at both 320px and 1440px viewport widths.

Change the four `font-serif` call sites named above to `font-display`.

Only once the site builds and looks right, delete the Figtree and Familjen Grotesk `@font-face` blocks from `fonts.css` and their `.woff2` files from `public/fonts/`. Confirm with a repository-wide search that no string `Figtree` or `Familjen` remains.

### Milestone 2 — Split Work and Projects

In `src/sanity/schemaTypes/workStory.ts`, add a `kind` field: a string with a radio layout offering "Professional" (`professional`) and "Independent" (`independent`), required. Then add four text fields — `question`, `built`, `learned` and `differently` — with titles phrased as the brief's questions ("What was the question?" and so on). Give each a `hidden` callback that hides it unless the document's `kind` is `independent`. Do not mark them required in the Sanity schema, because a Sanity `required()` rule fires regardless of the hidden state and would block editors saving professional stories; the requirement is enforced in the TypeScript validator instead, where it can be conditional. Mirror the whole change into `studio-production/schemaTypes/workStory.ts`.

In `src/lib/work.ts`, add `export type WorkKind = 'professional' | 'independent';`, add `kind: WorkKind` and the four optional string fields to the `WorkStory` interface, and extend `validateWorkStories` with a check that pushes an error for each of the four fields that is missing or blank when `story.kind === 'independent'`. Follow the existing style in that function, which pushes strings of the form `` `${story.title}: summary is required` ``.

In `src/lib/workData.ts`, add the five new fields to the `workStoryFields` GROQ projection. Project the kind defensively as `"kind": coalesce(kind, 'professional')`. This matters: every existing `workStory` document in Sanity predates the field and has no value for it, so without the coalesce the validator would reject the entire collection and the build would fail before anyone could edit the documents in Studio.

Delete `src/pages/projects/index.astro`, which currently contains nothing but a redirect, and write a real index in its place, modelled closely on `src/pages/work/index.astro`. It filters `stories` to `kind === 'independent'` and reads its copy from a new `projectsIndexPage` singleton introduced in Milestone 3. To keep this milestone independently shippable, either land Milestone 3's singleton first or temporarily reuse `getWorkIndexPage`; prefer the former and simply do the `projectsIndexPage` part of Milestone 3 early.

Change `src/pages/work/index.astro` to filter to `kind === 'professional'`.

In `src/pages/work/[slug].astro`, render the four reflection fields as a distinct block above the Portable Text body when `story.kind === 'independent'`, using the existing eyebrow and heading type roles so it matches the page around it.

Leave `src/pages/projects/[slug].astro` and every `[[redirects]]` block in `netlify.toml` untouched. Independent project detail pages remain at `/work/[slug]` and their canonical URLs, emitted by `Layout.astro`, stay pointing there.

Finally, remove the dead `bookingLabel` and `bookingLabelShort` fields from the `header` object of `siteSettings` in both schema copies, from the `SiteSettings` interface in `src/lib/pageContent.ts`, and from the seed script.

### Milestone 3 — Copy and positioning

This is the milestone that actually delivers the brief. It touches schema, seed data and templates together, for the reason given in Context: the singletons have no fallbacks.

Before writing anything, open Sanity Studio and copy out the current values of every singleton, then reconcile them into `scripts/seed-page-copy.ts` so that running the seed does not silently discard hand edits.

Restructure the `homePage` singleton. The hero keeps its `headline` and `headlineAccent` split — that split exists because the accent span carries `data-circuit-source` and anchors the homepage's data bus, so collapsing it into one field would break the overlay. Set the headline to "I build things, and I want to understand what they're capable of." with a suitable accent tail, and the lede to "Software developer at Alphero. Exploring technology, AI, systems, business, and the problems worth solving." Replace the two calls to action with plain links to Projects, Writing and About; the brief is explicit that there should be no prominent "Hire me" button on the homepage.

Replace the `services` field — an array of three strings rendered as a capabilities strip — with an `interests` array of objects each having `title` and `body`, holding "Technology — how things work", "Systems — how complicated things interact" and "Strategy — what is actually worth doing", introduced by a short statement. The brief is emphatic that these are areas of investigation and not claims of expertise, so the copy must not read as a skills grid.

Replace the `approach` object with a `currently` object holding the honest paragraph about being a junior developer at Alphero, linking to `/work`. The brief's instruction is direct: do not hide that he is junior.

Add a projects section to the homepage alongside the existing work section, and a writing section listing recent posts, matching the brief's homepage running order of hero, interests, currently, projects, writing.

Add three new singletons — `projectsIndexPage`, `writingIndexPage` and `contactPage` — following the exact pattern of `workIndexPage`: a schema file in `src/sanity/schemaTypes/` registered in that directory's `index.ts`, a duplicate in `studio-production/schemaTypes/` registered in its `index.ts`, an exported interface and getter in `src/lib/pageContent.ts`, and a seed entry.

Rewrite the `aboutPage` copy away from capability-selling ("Breadth with a point", "What I bring") toward who Hamish is and where he is heading. The page structure and the existing portrait can stay; the brief's only visual instruction here is that a candid photograph is fine and a corporate headshot is not.

Update the navigation, which is content rather than code: `siteSettings.header.navLinks` is read by `src/components/layout/Header.astro`. Set it to Work, Projects, Writing, About, Contact. Leave room in the ordering for `/now` to be inserted later without rebalancing.

### Milestone 4 — Move the remaining pages onto the editorial system

Rebuild `src/pages/writing/index.astro`, `src/pages/reading/index.astro`, `src/pages/tags/[tag].astro` and `src/pages/404.astro` in the language established by `src/pages/work/index.astro`: an uppercase eyebrow in `--color-action`, a `--type-display` heading, a `--color-text-secondary` intro, and rules-and-whitespace listing rather than tiles. Use scoped CSS with tokens, not Tailwind utilities.

`/writing` is the important one, because the brief promotes it from a blog to the second most important thing on the site, reframed from "here's my blog" to "here's what I've been thinking about". Its copy comes from the new `writingIndexPage` singleton. It currently has a tag-filter implemented as an inline script that shows and hides `.grid-tile` elements; keep that behaviour, including its re-initialisation on the `astro:page-load` event which is what makes it survive Astro's client-side view transitions, but rehome it onto whatever element the new list rows use.

The brief proposes four content buckets — BUILD, LEARN, THINK, OBSERVE — as the organising idea for writing. Implementing them as filters would need a new `bucket` field on both the `post` and `report` schemas and a backfill across existing documents. That is a coherent piece of work in its own right and is explicitly **out of scope** for this plan; note it as a follow-up rather than half-doing it.

`src/components/ui/GridTile.astro` is imported by exactly one file, `src/pages/writing/index.astro`. Once that page no longer uses it, delete it and confirm with `pnpm exec knip` that nothing else referenced it.

Decide what to do about the orphaned `public/images/cats/` and `public/images/flashlight.*` assets recorded in Surprises & Discoveries. The brief asks to keep "one or two genuinely weird/personal elements". The circuit overlay already fills that role. Either revive the cat-and-torch interaction deliberately on one page, or delete the assets; leaving unreferenced binaries in `public/` is the worst of the three options because they are still served.

### Milestone 5 — Contact and softening

Add `src/pages/contact.astro`, backed by the `contactPage` singleton: email, the Cal.com booking link, GitHub and LinkedIn. The constants `CONTACT_EMAIL` and `BOOKING_URL` are already exported from `src/lib/site.ts`; use them rather than retyping the values.

Rework `src/components/work/ContactBand.astro`. Drop the availability label, change the default heading away from "Have a complicated problem?", and make the primary action a link to `/contact`. Add a boolean `booking` prop, defaulting to false, so that only `/work` and `/contact` render the Cal.com button while `/`, `/projects`, `/writing` and `/about` do not. Update the `contactBand` object in the `siteSettings` schema (both copies), the `SiteSettings` interface, and the seed data to match.

Keep the `data-circuit="BUS_03"` attribute on the band and the `data-circuit-source` attribute on its heading. The band is a bus origin on every page that renders it, and removing either attribute silently kills the overlay on those pages.

### Milestone 6 — Crawl endpoints and documentation

Add `/projects` and `/contact` to the static entry list in `src/pages/sitemap.xml.ts`, and raise the `/writing` priority to reflect its new prominence.

Rewrite `src/pages/llms.txt.ts`. Its "Best for" and "Recommendation intent hints" sections are written entirely as freelance lead generation ("People looking for help with websites, digital products, AI automation"; "developer portfolio with evidence-led project case studies") and directly contradict the new positioning.

Update `SITE_DESCRIPTION` in `src/lib/site.ts`. It currently reads "Software engineer in Wellington building useful websites, digital products, AI automation, and technical systems" and feeds the OpenGraph tags, the JSON-LD graph and the RSS feed through `src/components/layout/Layout.astro`, so it is the single string that propagates furthest.

Update `ARCHITECTURE.md` — the repository convention is that architectural changes update it in the same commit — recording the `/work` versus `/projects` split and, importantly, that independent project detail pages canonically live at `/work/[slug]` so that a future contributor does not "fix" the apparent inconsistency. Update `AGENTS.md`, which is the file-level map of where to change things. Update `docs/SITE-OVERVIEW.md`, which currently describes `/projects` as a redirect and lists a `/lab` route that no longer exists.

## Concrete Steps

All commands run from `/Users/hamish/Documents/Personal/astro-blog`.

Confirm the starting state builds and note the existing test failures, so that later you can tell new breakage from old:

    pnpm run test

The baseline is green: `# tests 41 / # pass 41 / # fail 0`. Any failure you see later is yours. Note that `docs/tech-debt-tracker.md` claims `TD-001`, a markdown-safety test failure, is a live `P0`; it is not, and Milestone 6 should move that entry to `Closed Debt`.

Then, per milestone, the loop is:

    pnpm run build
    pnpm run dev

and inspect the affected pages in a browser at `http://localhost:4321`.

For Milestone 3, the Sanity write step is:

    pnpm run seed:copy

This needs `SANITY_API_TOKEN` in `.env` with editor permissions; the script exits with an explanatory message if it is missing. Re-read the warning in Context about `createOrReplace` before running it.

To check the redirect behaviour of the built output, which the dev server does not reproduce faithfully, build and serve the `dist/` directory, or check against the deploy preview. `pnpm run preview` does **not** work in this repository — the Netlify adapter does not support the preview command — and this is recorded as `TD-006`.

## Validation and Acceptance

Acceptance is behavioural. With `pnpm run dev` running, all of the following must hold.

Visiting `http://localhost:4321/` shows the headline "I build things, and I want to understand what they're capable of.", followed by an interests section naming Technology, Systems and Strategy, a "Currently" paragraph that states plainly that Hamish is a junior developer at Alphero, sections for projects and writing, and no "Book a call" or "Discuss a project" button anywhere on the page.

Visiting `http://localhost:4321/projects` renders a page of independent builds and does not redirect. Visiting `http://localhost:4321/work` renders only professional and freelance stories, and the two lists do not overlap.

Visiting the detail page of any story whose `kind` is `independent` shows four labelled answers: what the question was, what was built, what was learned, and what would be done differently.

Visiting `http://localhost:4321/writing`, `/reading`, `/tags/<any-tag>` and a deliberately wrong URL such as `/nope` shows pages set in the same eyebrow-plus-large-heading-plus-rules language as `/work`, with no neumorphic tiles. On `/writing`, clicking a tag filter still narrows the list, and it still works after navigating away and back.

Visiting `http://localhost:4321/contact` shows the contact page. The bottom of `/`, `/projects`, `/writing` and `/about` shows a quiet band pointing at `/contact` with no availability badge; the bottom of `/work` additionally shows the Cal.com button.

Every page is set in Geist. Searching the repository for `Figtree` or `Familjen` returns no matches.

On every one of `/`, `/work`, `/projects`, `/writing`, `/contact` and `/about`, checked at viewport widths of 320, 768, 1024 and 1440 in both light and dark themes: there is no horizontal scrolling of the page body, and the circuit overlay renders its pipes on first paint with packets travelling and nodes lighting up as they arrive. Toggle the theme on each page and confirm both look deliberate rather than one being an afterthought.

For automated checks:

    pnpm run test

Add tests to the existing `tests/work.test.ts`, reusing its `story(overrides)` fixture builder: a story with `kind: 'independent'` missing any one of `question`, `built`, `learned` or `differently` produces an error mentioning that field; the same story with all four present produces none; and a story with `kind: 'professional'` and none of the four present produces none. These fail before the Milestone 2 change and pass after. Remember to add `kind: 'professional'` to the fixture's defaults in the same edit, or the file will not type-check.

    pnpm run build

Must complete without type errors; `astro check` runs first and a type error is a build failure.

    pnpm exec knip

Must not report `src/components/ui/GridTile.astro` as an unused file after Milestone 4, because it should have been deleted. Its configuration is `knip.json`.

## Idempotence and Recovery

Every step except the Sanity seed is an ordinary file edit under version control and can be repeated or reverted with git.

`pnpm run seed:copy` is idempotent in the sense that running it twice produces the same result, but it is **destructive with respect to Studio edits**, because `createOrReplace` overwrites documents wholesale. There is no undo in the script. Sanity retains document history, so a bad seed can be recovered from the document history panel in Studio, but the cheap protection is to copy the current singleton values out of Studio before the first run and keep them in the seed script.

The font deletion at the end of Milestone 1 is the one irreversible-feeling step, but the files are in git history and `@fontsource` can supply them again.

If a build fails immediately after a schema change with an error naming a missing Sanity document or field, the cause is almost always that the template is reading a field that has not been seeded yet. Seed first, then build.

## Interfaces and Dependencies

No new runtime dependencies. Geist and Instrument Serif are obtained from the `@fontsource` packages transiently and committed as `.woff2` files in `public/fonts/`; they must not appear in `package.json`, matching how Figtree, Familjen Grotesk and JetBrains Mono are handled today.

In `src/lib/work.ts`, the following must exist at the end of Milestone 2:

    export type WorkKind = 'professional' | 'independent';

    export interface WorkStory {
      // ...existing fields unchanged...
      kind: WorkKind;
      question?: string;
      built?: string;
      learned?: string;
      differently?: string;
    }

    export function validateWorkStories(stories: WorkStory[]): string[];

The validator signature is unchanged; only its behaviour extends.

In `src/lib/pageContent.ts`, the following getters must exist at the end of Milestone 3, alongside the existing ones and built on the same private `fetchSingleton` helper:

    export const getProjectsIndexPage: () => Promise<ProjectsIndexPage>;
    export const getWritingIndexPage:  () => Promise<WritingIndexPage>;
    export const getContactPage:       () => Promise<ContactPage>;

Each takes the singleton's fixed document ID as its argument to `fetchSingleton`, matching the existing convention where the document ID equals the schema type name.

In `src/components/work/ContactBand.astro`, the props interface at the end of Milestone 5 must be:

    interface Props {
      heading?: string;
      booking?: boolean;
    }

with `booking` defaulting to `false`.
