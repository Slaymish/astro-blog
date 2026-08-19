# Architecture Roadmap

Audit date: 2026-08-19. Auditor: fresh-eyes pass over `main` at `d636502`, plus the
uncommitted visitor-context work in the tree.

## Verdict up front

This is not a slop codebase. The data layer, the analytics validation modules, the
circuit geometry split and the design-token system are all better than average and
should be conformed to, not rewritten. The debt is concentrated in three places:

1. **Documentation has drifted from the code** and now asserts things that are false.
2. **A legacy content type (`project`) was never retired** when `workStory` replaced it,
   leaving a second, orphaned detail-page URL space.
3. **View-transition machinery was left behind** when the router was removed, and
   `Layout.astro` has accumulated five unrelated jobs.

## Baseline

- **Stack:** Astro 5 (`output: 'static'`, Netlify adapter), TypeScript 5.6 (`astro/tsconfigs/strict`),
  React 19 islands, Tailwind v4 via `@tailwindcss/vite`, Sanity 5 as the content source,
  Node 22, pnpm 10 (`pnpm-lock.yaml` committed, CI uses `--frozen-lockfile`).
- **Entry points:** `astro.config.ts` (prod), `astro.config.dev.ts` (dev), `src/pages/**`,
  `netlify/functions/session-insights.mts`.
- **Existing gates:**

  | Command | Status |
  | ------- | ------ |
  | `pnpm run test` (`tsx --test tests/*.test.ts`) | **exit 0** — 107 tests, 11 files |
  | `pnpm run build` (`astro check && astro build`) | **exit 1** — see pre-existing failure below |
  | `pnpm exec knip` | **exit 1** — reports findings, but see F-018: config makes it unreliable |
  | lint | **does not exist** — no ESLint, Stylelint or Prettier in the repo |
  | `.github/workflows/ci.yml` | runs install, test, build on Node 22 — no lint, no knip, no schema-drift check |

- **Known pre-existing failure (not caused by any sub-agent):**
  `src/pages/api/collect.ts:52` — `astro check` reports `ts(2345)`. Netlify's `Store.setJSON`
  returns `Promise<WriteResult>`; the local `CounterStore` interface in
  `src/lib/rateLimit.ts:22` declares `Promise<void>`. The build has been red since the
  visitor-context work was started in the working tree.

- **Traced flow (a request for `/work/gpu-share`):** build time only — `getStaticPaths` in
  `src/pages/work/[slug].astro` → `getWorkStories()` in `src/lib/workData.ts` → `fetchSanity`
  in `src/lib/sanity.ts` (GROQ, Sanity edge CDN) → `validateWorkStories` in `src/lib/work.ts`
  throws on an invalid collection → `portableTextToHtml` → `Layout.astro` assembles metadata,
  JSON-LD and the shell → HTML baked to `dist/work/gpu-share.html`. At runtime the CDN serves
  the file; the only server work is the four `prerender = false` API routes. The layering is
  real and each layer earns its place.

## Keep

| Area | Why it stands | Conform to it by |
| ---- | ------------- | ---------------- |
| `src/lib/analytics.ts`, `rateLimit.ts`, `sessionStore.ts`, `timingSafe.ts` | Untrusted input is validated once at the edge against explicit patterns; every module is pure and unit-tested without standing up a blob store; the comments explain *why*, including the trade-offs deliberately accepted | Putting new boundary validation here, not inline in a route. Any new blob key format goes in `sessionStore.ts` |
| `src/lib/workData.ts` + `src/lib/work.ts` | One GROQ projection reused by both queries; `validateWorkStories` fails the build rather than shipping a half-rendered case study | Adding fields to `workStoryFields`, not to a second projection |
| `src/lib/writingData.ts` | Single stream behind `/writing`, `/tags/[tag]` and the homepage; owns the content-slug → public-slug mapping so no caller hand-builds a `/posts/...` href | Never constructing a post href outside `postHref` |
| `src/lib/circuit/` | `geometry.ts` is pure maths with 30+ unit tests, `engine.ts` owns DOM, `circuit.css` owns presentation | Keeping geometry tokens in px/ms/unitless (the engine reads computed style) |
| `src/design-system/tokens.css` + `themes/{light,dark}.css` | One source of truth, both themes define the same semantic roles | Using a token; never a hex literal (F-013 is the current violation) |
| `src/pages/api/pdf.ts` | Host allowlist, HTTPS-only, redirect blocking, content-type enforcement, and a test file that exercises each | Not weakening any of it |
| `src/lib/pageContent.ts` | No hardcoded user-facing strings and no fallbacks, so a missing singleton throws loudly instead of rendering empty markup | Adding page copy as a singleton, not a template literal |

## Refactor / de-slop

| ID | Finding | Where | Evidence | Severity | Module |
| -- | ------- | ----- | -------- | -------- | ------ |
| F-001 | Build gate is red | `src/pages/api/collect.ts:52`, `src/lib/rateLimit.ts:22` | `pnpm run build` exits 1: `ts(2345)`, `Promise<WriteResult>` vs `Promise<void>` | **high** | M1 |
| F-002 | Cron schedule declared twice | `netlify.toml:7` and `netlify/functions/session-insights.mts:232` | Both say `0 15 * * *`; the file's own header comment claims "Schedule is declared in netlify.toml", which is only half true | medium | M1 |
| F-003 | Stale header comment describes the pre-migration design | `netlify/functions/session-insights.mts:6` | Says "reconstruct anonymised event sequences from Umami"; the code reads Netlify Blobs and never calls Umami | medium | M1 |
| F-004 | Blob store name `'session-insights'` is a bare literal in two files while every other store name is a shared constant | `netlify/functions/session-insights.mts:221`, `src/pages/api/insights.ts:30` | `SESSION_STORE` and `RATE_LIMIT_STORE` exist precisely to prevent this | low | M1 |
| F-005 | Conversion-read loop has no cap | `netlify/functions/session-insights.mts:152-162` | `MAX_SESSIONS` bounds the session loop; the conversion loop does a serial `get` per blob across 7 days with no limit | low | M1 |
| F-006 | **Two content models for the same thing.** `workStory` replaced `project`, but `project` was never retired | `src/pages/projects/[slug].astro`, `src/sanity/schemaTypes/project.ts`, `studio-production/schemaTypes/project.ts` | `dist/projects/otto.html` is generated, is absent from `dist/sitemap.xml`, and is linked from nowhere — `/projects/index.astro:10` lists `workStory` independents whose detail pages live at `/work/[slug]`. Contradicts ARCHITECTURE.md invariant 3a | **high** | M2 |
| F-007 | `projects/[slug].astro` is 315 lines of full detail page; ARCHITECTURE.md:41 says it is "redirect-only … does not serve project detail pages" | `src/pages/projects/[slug].astro` | Lines 76-143 render a hero, action bar, body, related-post callout and footer nav; lines 145-315 are page-specific CSS | **high** | M2 |
| F-008 | Dead branches inside that route | `src/pages/projects/[slug].astro:36-45` | `getStaticPaths` (lines 26-31) filters out every slug whose policy is `redirect` or `gone`, so the `redirect`/`gone` branches below can never be reached | medium | M2 |
| F-024 | **The `unlisted` route policy cannot work under `output: 'static'` and silently does not.** `/projects/otto` was meant to be noindex and is fully indexable | `src/lib/legacyRoutes.ts:6,53`, `src/pages/projects/[slug].astro:43-45` | Line 44 calls `Astro.response.headers.set('X-Robots-Tag', 'noindex, nofollow')`, which is a no-op for a prerendered page. The emitted `dist/projects/otto.html` carries Layout's default `<meta name="robots" content="index, follow, max-image-preview:large, …">`, and no `X-Robots-Tag` rule exists in `netlify.toml` either. Found while preparing M2 — this corrects F-006: `otto` was not an accidental orphan, it was a deliberate unlisted page whose unlisting has never taken effect | **high** | M2 |
| F-009 | **Vestigial view-transition machinery.** No `<ClientRouter />` or `<ViewTransitions />` exists anywhere in the repo | 5 `transition:name` sites + 2 `astro:page-load` listeners + 1 rebind guard | `grep -rn "ClientRouter\|ViewTransitions" src/` returns nothing. `astro:page-load` therefore never fires, so `src/pages/404.astro:44`, `src/pages/writing/index.astro:94` and the `window.__analyticsScrollHandler` dedupe in `Layout.astro:449-452` are all dead. Both call sites also call `init*()` directly, so **nothing is user-visibly broken** — this is dead code plus two comments that assert the opposite of the truth | medium | M3 |
| F-010 | Duplicate `transition:name="page-heading"` on two different pages | `src/pages/reading/index.astro:46`, `src/pages/writing/index.astro:19` | Latent: harmless today, a real bug the day a router is added | low | M3 |
| F-011 | **Page-header composition copy-pasted across 9 routes.** No `PageHeader` component exists | `terms`, `privacy`, `contact`, `cv`, `reading/index`, `projects/index`, `tags/[tag]`, `work/index`, `writing/index` | The `__eyebrow` rule is byte-identical in all 9 (`color: var(--color-action); font-size: var(--type-label); font-weight: 700; letter-spacing: .1em; margin: 0 0 var(--spacing-5); text-transform: uppercase;`). `padding-block: var(--hero-top-space)` appears in 13 files; the display-`h1` rule 9 times | medium | M4 |
| F-012 | `Layout.astro` does five unrelated jobs in 525 lines | `src/components/layout/Layout.astro` | Metadata + JSON-LD (1-107, 141-215), theme bootstrap (125-140), ambient-background CSS and its scroll script (224-290, 327-351), code-copy (353-376), booking-ref rewriter (378-406), and ~120 lines of analytics tracker (408-521) | medium | M5 |
| F-013 | Theme hex literals hardcoded outside the token system | `Layout.astro:138,203,204`, `ThemeToggle.astro:49,50` | `#0b0d0c` and `#f6f7f3` duplicate `--color-ink-950` and `--color-paper-100` (`tokens.css:43,56`) across 3 files. `theme-color` and `msapplication-TileColor` are pinned to the dark value regardless of resolved theme | medium | M5 |
| F-014 | The event cap is duplicated across the trust boundary | `src/lib/analytics.ts:18` (`MAX_EVENTS = 100`) and `Layout.astro:437` (`sequence.length < 100`) | Client and server independently hardcode 100; the client half is inline JS, so it is neither type-checked nor testable | medium | M5 |
| F-015 | `body?: any` declared four times for the same Portable Text shape | `posts/[slug].astro:33`, `rss.xml.ts:12`, `projects/[slug].astro:17`, `reports/[...slug].astro:20` | `src/lib/portableText.ts` owns the conversion and should own the type | low | M5 |
| F-016 | **Documentation asserts behaviour the code does not have** | `ARCHITECTURE.md` | Three false claims: (a) line 199 says 301s come from `buildLegacyRedirects()` "via `redirects` in `astro.config.ts`" — `astro.config.ts` has no `redirects` key and its own comment says the mechanism is deliberately unused; (b) line 195 says "The only on-demand route is `src/pages/api/pdf.ts`" — there are four; (c) line 18 says "Deployment target is Netlify server output" — `output: 'static'`. It also omits `src/utils/` from the Codemap entirely | **high** | M6 |
| F-017 | `docs/tech-debt-tracker.md` cites files that no longer exist | `docs/tech-debt-tracker.md` | TD-002 points at `src/components/features/HiddenContent.astro` (absent); TD-005 at `VideoPlayer.*.js` (absent); TD-008 says "current tests are limited to" three files (there are 11, 107 tests). TD-003's drift risk is currently clean — all 16 schema pairs are byte-identical — but nothing enforces it | medium | M6 |
| F-018 | `knip` cannot be used as a gate because its `entry` is misconfigured | `knip.json:3` | `entry` is only `astro.config.dev.ts`, so `src/lib/circuit/{engine,index}.ts` are reported unused when `Layout.astro:325` imports them from an inline `<script>`. Genuine hits in the same report: `src/components/motion/FadeIn.tsx` (0 importers) and `scripts/site-audit.mjs` (0 importers, no npm script) | medium | M6 |
| F-019 | Build-only packages sit in `dependencies`, inflating the production install | `package.json` | `playwright` (knip: unused), `typescript`, `@astrojs/check`, `@radix-ui/react-popover`, `@radix-ui/react-visually-hidden` (both knip: unused) are runtime deps. Meanwhile `@huggingface/transformers`, which `src/lib/embeddings.ts` genuinely needs at build time, is a devDependency | medium | M6 |
| F-020 | ~1,200 lines of superseded documentation at the repo root competing with the real docs | `AI-smell-audit.md` (28L, a chat transcript), `REDESIGN-PLAN.md` (650L, superseded by `docs/exec-plans/`), `todo.md` (20L), `ux-research-and-recommendations.md` (493L, dated March 2026) | Last touched 2026-03-22 to 2026-07-26. `PLANS.md` says ExecPlans live in `docs/exec-plans/`; `docs/visitor-context-execplan.md` is untracked, at the wrong path, and its own header names its target as `docs/exec-plans/visitor-context.md` | low | M6 |
| F-021 | `.env-example` and `.env.example` are byte-identical duplicates | repo root | `diff` exits 0 | low | M6 |
| F-022 | Two Sanity clients disagree on caching | `src/lib/sanity.ts:28` (`useCdn: true`) vs `astro.config.ts:41` (`useCdn: false`) | Low impact — the integration client serves the embedded Studio — but the contradiction is undocumented | low | M6 |
| F-023 | KaTeX CSS is loaded cross-origin, render-blocking, on every page | `Layout.astro:222` | A `<link rel=stylesheet>` to `cdn.jsdelivr.net` plus a `preconnect`, on all ~25 pages; maths appears in a small subset of posts | medium | M6 |

### Found during execution

| ID | Finding | Where | Evidence | Severity | Module |
| -- | ------- | ----- | -------- | -------- | ------ |
| N-5 | **Dangling reference to a deregistered Sanity type.** Fixed inline by the orchestrator | `src/sanity/schemaTypes/workStory.ts:3`, `studio-production/schemaTypes/workStory.ts:3` | `artifactTypes` still listed `{ type: 'project' }` after M2 removed that type from both barrels. Sanity Studio reports an unregistered reference target; `astro check` and `pnpm run build` both stay green, so **no gate could catch it**. Changed to `[{ type: 'post' }, { type: 'report' }]` in both copies, re-verified byte-identical | **high** | done |
| N-6 | `ArtifactType` still admits `'project'` and maps it to a URL space that serves nothing | `src/lib/work.ts:7`, `artifactHref`, `tests/work.test.ts:129` | Latent, not broken — zero `/projects/<slug>` links exist in the built output. With `project` gone, `artifactHref`'s `` `${artifact.type}s` `` pluralisation covers only `reports` | medium | M6 |
| N-7 | Retiring the schema type does not unpublish the `otto` document in Sanity | Sanity dataset `production` | It is now unreachable and un-editable rather than deleted. Needs a manual unpublish by the repo owner — not something any module can do from the repo | low | manual |
| N-8 | A **fifth** `transition:name` site the audit missed | `src/pages/writing/index.astro:46` | `transition:name={`title-${entry.href}`}` on every list row. Removed by M3 with the other four | low | done |
| N-9 | Stale exec-plan instruction now unfollowable | `docs/exec-plans/2026-08-12-site-redesign.md:284` | Tells a future implementer to keep the `astro:page-load` re-initialisation "which is what makes it survive Astro's client-side view transitions". The router is gone, so the instruction cannot be followed and the claim is false | low | M6 |
| N-10 | Page-header measures have no design tokens | `PageHeader.astro` call sites | `12ch`/`14ch`/`16ch` headline and `36rem`-`44rem` intro measures are hand-tuned per page; `tokens.css` has no measure scale. M4 correctly declined to invent one | low | backlog |
| N-11 | `terms.astro` and `privacy.astro` are near-identical shells | both files | Their `<style>` blocks differ by exactly one rule (`.legal-page strong`) and their header markup is the same. A shared legal-page layout would remove ~14 more duplicated rules. The largest remaining duplication in the route files | low | backlog |
| N-12 | The eyebrow rule still appears five more times | `terms`, `privacy`, `tags/[tag]`, `.about__label`, `.cv__eyebrow` | The last two are section labels rather than page eyebrows; a `SectionLabel` component or a token would close it | low | backlog |
| N-13 | **Orchestration lesson: parallel modules with disjoint source files still race on build artefacts** | `dist/`, `.netlify/build` | Two concurrent `astro build` runs corrupted a `.netlify/build` chunk and wiped `dist/` mid-comparison. Disjoint *source* ownership is not sufficient isolation when both agents run the same build command in one working tree. Future parallel waves need either a git worktree per agent or a serialised gate step | medium | process |
| N-14 | **A conditionally-rendered *bundled* `<script>` silently corrupts Astro's chunk assignment for the whole page** | `Layout.astro`, discovered mid-M5 | Shipping code-copy as `{article && <script>}` hoisted the script unconditionally but reshuffled chunk assignment, **dropping the circuit overlay's JS from all 18 non-article pages**. `astro check`, the test suite and every page-count gate stayed green throughout. Found only by inspecting `dist/`. Fixed by booting everything from one `initShell()`. **This is the strongest argument in the audit for a built-output smoke assertion in CI** | **medium** | M6 |
| N-15 | Visitor nonce can be shorter than the server accepts | `src/lib/shell/visitorNonce.ts` | `Math.random().toString(36).slice(2, 10)` yields fewer than 4 characters when the mantissa is short. `NONCE_PATTERN` in `analytics.ts` requires 4-32, so those rare visitors are silently unjoinable to their booking. `.padEnd(8, '0')` fixes it; not changed by M5 because it alters minted values | low | M6 |
| N-16 | A *third* Portable Text type alias | `src/lib/pageContent.ts:4` | Declares `PortableTextBlock = unknown` locally. Importing `PortableTextBody` would let `portableTextToHtml`'s parameter narrow and delete the one remaining cast in `portableText.ts` | low | M6 |
| N-17 | Astro inlines the 3.7 KB shell chunk into every page rather than emitting a cacheable file | build output | Re-downloaded per page and keeps each page hash-dependent. `vite.build.assetsInlineLimit: 0` in `astro.config.ts` would externalise it | low | M6 |
| N-18 | `netlify.toml`'s CSP comment is now stale in its specifics | `netlify.toml` | It says `'unsafe-inline'` is kept "because the theme resolver, the booking-ref rewriter and the analytics tracker are all inline scripts". After M5 the rewriter and tracker are bundled. Accurate list: the pre-paint theme resolver, the `ThemeToggle` wiring, and the module chunk Astro inlines. `'unsafe-inline'` is still required, but hand-written inline script dropped from 6 blocks / 10,554 bytes to 2 blocks / 2,879 bytes, so the stated fix (Astro `experimental.csp` hash mode) is now cheaper | low | M6 |
| N-1 | **`RATE_LIMIT_SALT` silently defaults to an empty string**, weakening the collector's privacy promise | `src/pages/api/collect.ts:50` | `process.env.RATE_LIMIT_SALT ?? ''`. Unset, the counter key is an unsalted SHA-256 of `:<window>:<ip>`, brute-forceable across the IPv4 space. `rateLimit.ts`'s header promises "the raw address is never written anywhere"; an unsalted digest of it is close to writing it. Nothing warns, and the variable is absent from `.env.example`. Raised by M1, which correctly declined to change behaviour outside its outcome | **medium** | M6 |
| N-2 | Body-size cap counts UTF-16 code units, not bytes | `src/pages/api/collect.ts:31` | `raw.length > MAX_BODY_BYTES` — a multi-byte body reaches roughly 3x the intended 8 KB before rejection. Still finite, so not an unbounded read | low | M6 |
| N-3 | `netlify/functions/session-insights.mts` has no test at all | `tests/` | The glob is `tests/*.test.ts`, so nothing under `netlify/` is reachable by the runner even if a test were written. `toSequence`, `recentDays` and `prune` are the testable parts | low | M6 |
| N-4 | ExecPlan naming convention is inconsistent | `docs/exec-plans/` | Existing plans are date-prefixed (`2026-08-12-site-redesign.md`); the newly moved `visitor-context.md` is not | low | M6 |

Not counted as debt, but flagged for the record: `netlify.toml` keeps `script-src 'unsafe-inline'`
because three inline scripts must run before the bundle. The file already names the fix
(Astro's `experimental.csp` hash mode). Left as-is deliberately — M5 shrinks the inline surface,
which is the prerequisite.

## Add

| Guardrail | Why it is needed now | Module |
| --------- | -------------------- | ------ |
| Schema-drift check in CI | TD-003's risk already materialised once (recorded 2026-08-12). The check is a 3-line `diff` loop and is currently run by hand or not at all | M6 |
| A usable dead-code gate | `knip` exists but its output cannot be trusted (F-018), so nothing catches the next `FadeIn.tsx` | M6 |
| Any linter at all | No ESLint, Stylelint or Prettier. The inline `<script>` blocks in `Layout.astro` are the largest unlinted, untype-checked surface in the repo | M5 (typed extraction), M6 (config) |
| Tests for the client tracker | `src/lib/analytics.ts` validates the payload server-side and is well tested; the client half that *produces* that payload has no test and no types | M5 |
| A rendered `/410.html` check | `netlify.toml` points five rules at `/410.html`. It exists in `dist/` today, but nothing asserts it, and losing it would silently turn 410s into Netlify's default body | M6 |

## Modules

### M1 — Land the visitor-context work and restore the build gate

- **Outcome:** `pnpm run build` exits 0 with the visitor-context analytics pipeline intact;
  every blob store name and the cron schedule each have exactly one source of truth.
- **Owns:** `src/pages/api/{collect,insights,cal-webhook}.ts`, `src/lib/{rateLimit,sessionStore,analytics,timingSafe}.ts`,
  `netlify/functions/session-insights.mts`, `netlify.toml`, `tests/{analytics,cal-webhook,insights-route,rate-limit,session-store,timing-safe}.test.ts`,
  `docs/visitor-context-execplan.md` → `docs/exec-plans/visitor-context.md`
- **Ambient context:** `CLAUDE.md` (analytics pipeline section), `ARCHITECTURE.md`, the Keep row for the analytics libs
- **Depends on:** none
- **Findings:** F-001, F-002, F-003, F-004, F-005
- **Gate:** `pnpm run test`, `pnpm run build`
- **Status:** **verified** 2026-08-19 — re-run by the orchestrator: 108 tests pass (was 107), `astro check` 0 errors, build exits 0

### M2 — Retire the legacy `project` content type

- **Outcome:** one content model behind `/work` and `/projects`, matching ARCHITECTURE.md
  invariant 3a. No orphaned, unlinked detail page is emitted. Existing `/projects/*` and
  `/work/*` URLs keep answering exactly as they do today.
- **Owns:** `src/pages/projects/[slug].astro`, `src/pages/projects/index.astro`,
  `src/sanity/schemaTypes/{project,index}.ts`, `studio-production/schemaTypes/{project,index}.ts`,
  `src/pages/sitemap.xml.ts`, the `relatedProject` join in `src/pages/posts/[slug].astro`
- **Ambient context:** `ARCHITECTURE.md` invariant 3a, `src/lib/legacyRoutes.ts`, the `[[redirects]]`
  blocks in `netlify.toml`, `src/lib/work.ts`
- **Depends on:** M1 (needs a green build to verify against)
- **Findings:** F-006, F-007, F-008, F-024
- **Gate:** `pnpm run test`, `pnpm run build`, plus `test ! -f dist/projects/otto.html` and
  `diff <(ls src/sanity/schemaTypes) <(ls studio-production/schemaTypes)`
- **Status:** **verified** 2026-08-19 — orchestrator re-ran all five gates from a clean `dist/`:
  110 tests pass (was 108), build exits 0, `dist/projects/` absent entirely, all seven `/work/*`
  pages intact, all 16 schema pairs byte-identical. N-5 fixed inline by the orchestrator.
- **Decision made (2026-08-19, Hamish):** `/projects/otto` answers **410 Gone**. This also retires
  the `unlisted` action entirely (F-024), since `otto` was its only user and the mechanism is
  inoperable under static output. Add the slug to
  `archivedProjects` in `src/lib/legacyRoutes.ts` *and* a `[[redirects]]` block in `netlify.toml`
  pointing at `/410.html` with `force = true` — the two are mirrored by repo convention.

### M3 — Resolve the view-transitions decision

- **Outcome:** the repo either has working view transitions or has no trace of them. No
  listener bound to an event that never fires, no comment asserting a router that is not there.
- **Owns:** `src/pages/404.astro`, `src/pages/writing/index.astro`, `src/pages/reading/index.astro`,
  `src/pages/reports/[...slug].astro`, `src/components/features/ParallaxHero.astro`
- **Ambient context:** `ARCHITECTURE.md`, the removed-`Bend.tsx` note in `CLAUDE.md`
- **Depends on:** M1, M2 (both edit `src/pages/posts/[slug].astro`)
- **Findings:** F-009, F-010
- **Gate:** `pnpm run test`, `pnpm run build`, and `grep -rn "astro:page-load\|transition:name" src/`
  returns either nothing or only sites covered by a `<ClientRouter />`
- **Status:** **verified** 2026-08-19 — orchestrator re-ran from a clean `dist/`: 113 tests pass
  (was 110), build exits 0, zero transition artefacts tree-wide in `dist/`. The grep gate returns
  exactly one match, `Layout.astro:450`, a comment in M5's file — M3 correctly reported this as a
  gate it could not fully satisfy rather than claiming success. **M5 must close it.**
- **Decision evidence (found by M3, not assumed):** `git log -S ClientRouter` shows `003cb99`
  deliberately removed the router, and `REDESIGN-PLAN.md:251` records the standing instruction
  to do so. This was a completed removal that left litter, not a half-finished installation.
- **Note:** the `Layout.astro:449-452` half of F-009 belongs to M5 — M3 must not touch `Layout.astro`.

### M4 — Extract the page-header pattern

- **Outcome:** one `PageHeader` component owns eyebrow/heading/intro composition; the nine
  route files stop each carrying their own copy of the same rules. Rendered output is unchanged.
- **Owns:** a new `src/components/layout/PageHeader.astro`, and the header markup and
  `<style>` blocks of `terms`, `privacy`, `contact`, `cv`, `reading/index`, `projects/index`,
  `tags/[tag]`, `work/index`, `writing/index`
- **Ambient context:** `src/design-system/tokens.css`, `~/.claude/rules/web/coding-style.md`,
  the Keep row for the token system
- **Depends on:** M3 (both touch `writing/index.astro` and `reading/index.astro`)
- **Findings:** F-011
- **Gate:** `pnpm run test`, `pnpm run build`, plus a before/after diff of the built HTML for
  all nine pages showing no visual-structural change
- **Status:** **verified** 2026-08-19 (jointly with M5, from a clean `dist/` and `.netlify/`):
  125 tests pass, build exits 0, all artefacts present. Converted 7 of 11 candidate pages;
  `terms`, `privacy`, `tags/[tag]` and `404` deliberately left alone (see M4 summary) because
  forcing them through would have added four variant axes for four pages.

### M5 — Break up `Layout.astro`

- **Outcome:** `Layout.astro` owns the document shell and metadata only. The analytics tracker
  is a typed, tested module that shares its constants with `src/lib/analytics.ts` instead of
  duplicating them. No theme hex literal survives outside `tokens.css`.
- **Owns:** `src/components/layout/Layout.astro`, `src/components/theme/ThemeToggle.astro`,
  `src/lib/analytics.ts` (adding shared constants only), new modules under `src/lib/` or
  `src/components/layout/`, `src/lib/portableText.ts` (exporting the body type),
  `src/pages/{posts/[slug],reports/[...slug],rss.xml}.ts?` type annotations, `tests/analytics.test.ts`
- **Ambient context:** `src/lib/analytics.ts` (the server-side contract the client must satisfy),
  `netlify.toml` CSP block, `src/design-system/tokens.css`
- **Depends on:** M1 (shares `src/lib/analytics.ts`), M3 (shares `Layout.astro`)
- **Findings:** F-012, F-013, F-014, F-015, and the `Layout.astro` half of F-009 (**closing this
  also unblocks M3's grep gate — it is the last remaining match in `src/`**)
- **Gate:** `pnpm run test` (with new tests covering the tracker's payload shape against
  `cleanEvents`), `pnpm run build`
- **Status:** **verified** 2026-08-19 — orchestrator re-ran from a clean tree: 125 tests pass
  (was 113), build exits 0, `Layout.astro` 525 → 343 lines. All four grep gates clean: zero
  view-transition matches (**M3's gate now closed**), theme literals only in `tokens.css` and
  `src/lib/shell/theme.ts`, zero `body?: any` in pages. Built-output audit confirms the circuit
  chunk is reachable and `sendBeacon`, `/api/collect`, `metadata[ref]`, `ambient-shift-x`,
  `code-copy-btn` and the `data-cfasync` theme resolver all survive on every page sampled.

### M6 — Make the documentation and the toolchain true

- **Outcome:** every claim in `ARCHITECTURE.md` is checkable against the code; the debt tracker
  cites only files that exist; `knip` is trustworthy enough to gate on; CI catches schema drift.
- **Owns:** `ARCHITECTURE.md`, `AGENTS.md`, `docs/SITE-OVERVIEW.md`, `docs/tech-debt-tracker.md`,
  `README.md`, `knip.json`, `package.json` (dependency placement only), `.github/workflows/ci.yml`,
  `.env-example`, `.env.example`, `scripts/site-audit.mjs`, `src/components/motion/FadeIn.tsx`,
  the four stale root markdown files, `CLAUDE.md`, plus `src/pages/api/collect.ts` and
  `package.json`'s `test` script for N-1 to N-3, and `src/lib/work.ts` + `tests/work.test.ts` for N-6
- **Ambient context:** this roadmap, `CLAUDE.md`, `PLANS.md`, the verified module summaries from M1-M5
- **Depends on:** M1, M2, M3, M4, M5 — documentation is written last, against the architecture
  that then exists
- **Findings:** F-016, F-017, F-018, F-019, F-020, F-021, F-022, F-023, N-1, N-2, N-3, N-4, N-9,
  N-14, N-15, N-16, N-17, N-18 (N-6 was closed by M5)
- **Also add:** `src/components/layout/PageHeader.astro` to the ARCHITECTURE.md Codemap (M4).
- **Also fix:** `CLAUDE.md:73-74` still says the nightly schedule is declared in `netlify.toml`;
  M1 moved it to the function's `config` export, so that line is now false.
- **Gate:** `pnpm run test`, `pnpm run build`, `pnpm exec knip` **exit 0**, and the new CI
  schema-drift step exit 0
- **Status:** pending

## Execution sequence

1. **M1** — alone. It fixes the red build, so nothing downstream can be verified until it lands.
2. **M2** — alone. *(Revised 2026-08-19: M2 and M3 were planned in parallel, but both need to
   edit `src/pages/posts/[slug].astro` — M2 for the `relatedProject` join, M3 for the
   `titleTransitionName` prop at line 144. Two agents in one file clobber each other, so they
   are now sequential. M2 also deletes `projects/[slug].astro`, removing one of M3's sites.)*
3. **M3** — alone, after M2 so `posts/[slug].astro` has settled.
4. **M4** and **M5** — parallel. M4 owns route `<style>` blocks, M5 owns `Layout.astro` and
   `src/lib`. The only shared risk is `writing/index.astro`, which M4 owns exclusively.
5. **M6** — alone, last.

## Deliberately out of scope

- Rewriting `src/lib/circuit/` (1,253 lines). It is well tested and well documented, and its
  design authority (`docs/design-docs/circuit-design-language.md`) is current. Nothing found.
- Adopting Astro content collections or removing them (TD-007). A real decision, but a feature
  decision rather than debt removal.
- The `'unsafe-inline'` CSP. M5 is the prerequisite; closing it is a follow-up.
- `npm audit` backlog (TD-004). Needs a staged upgrade pass with its own regression budget.
