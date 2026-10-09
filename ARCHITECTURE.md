# Architecture

The authoritative description of the boundaries and invariants of this site.
`README.md` covers setup and commands; `AGENTS.md` covers the working rules.
If something here changes, change this file in the same commit.

## Rendering model

`output: 'static'` with the Netlify adapter. Every content route is written to
an HTML file at build time from Sanity via `getStaticPaths`. Three consequences
catch people out:

- **Request-time inputs do not exist on a prerendered page.** Query parameters,
  headers and cookies have to be resolved in the browser. The All / Work / Writing controls on
  `/work` mirror the selected view into the URL as `?type=work|writing`.
  All is the default. History navigation restores the view; empty year
  sections disappear. Legacy tag query parameters are discarded. Topics
  appear as plain labels beneath entries, rather than index filters.
- **Publishing in Sanity needs a Netlify build hook** to reach the site.
- `build: { format: 'file' }` and `trailingSlash: 'never'`, so URLs emit as
  `/work.html` and canonicals omit the trailing slash. `publicPathFromAstro`
  maps an output filename back to its public route, and everything that builds a
  URL goes through it. Keep the two settings and that helper in step.

The only routes that run on request are the ones that opt out with
`export const prerender = false`: `api/collect.ts`, `api/recommend.ts`, `api/contact.ts`,
`api/cal-webhook.ts`, `reading/sent.astro`, `contact/sent.astro` and the private `stats.astro`.

One request-time behaviour sits above the build rather than inside it.
`netlify/edge-functions/markdown.ts` reads the `Accept` header and serves a
markdown representation to anything that asks for `text/markdown`, which is how
a prerendered page negotiates a format it cannot decide for itself.

## Layers

| Directory | Owns |
|---|---|
| `src/pages/` | Routes: page assembly, `getStaticPaths`, and the request-time handlers |
| `src/layouts/` | `Base.astro`: the document, the head, the policy hash, the shell |
| `src/components/` | Presentation. No data fetching beyond a page-copy singleton |
| `src/content/` | Everything about content: the Sanity client, queries, types, validators, the two renderers, image URLs |
| `src/client/` | Browser behaviour, all of it reached through `shell.ts` or one page-level import |
| `src/server/` | Request-time helpers: secrets, blob stores, rate limiting, the analytics contract |
| `src/site/` | Site constants, canonical helpers, metadata, escaping, the logo geometry |
| `src/styles/` | Tokens, themes, base elements, control primitives, long-form prose |
| `src/sanity/schemaTypes/` | The content model contract, imported by both Studio configs |

### Where to change X

- A page, or any API endpoint: `src/pages/*`
- The document head, metadata, or the policy: `src/layouts/Base.astro` and `src/site/seo.ts`
- A button, chip or form field: `src/styles/primitives.css` owns every variant
  and state. Astro renders them through `src/components/Button.astro` (`href`
  makes it a link) and the `.input`, `.select`, `.range`, `.chip` and `.field__*`
  classes. Do not style a control in a page's `<style>` block; add the state to
  the primitives instead.
- Colour, spacing, type: `src/styles/tokens.css` for primitives,
  `src/styles/themes.css` for the semantic roles.
- A GROQ query or a content type: `src/content/queries.ts`, `src/content/types.ts`
- A cross-document rule Studio cannot enforce: `src/content/validate.ts`
- Work story fields, and their category labels: `src/sanity/schemaTypes/workStory.ts`
  and `src/content/work.ts`
- The posts-plus-reports stream: `src/content/writing.ts`
- The combined project and writing stream on `/work` and `/tags/[tag]`:
  `src/content/feed.ts`. Entries sort by their original publication date,
  newest first, and each project appears once. Topic identity uses tagSlug.
  Missing work-story tags inherit the unique topics of linked artifacts;
  an explicit empty array opts out. Single-entry topics are retained too.
  `FeedList.astro` groups by UTC year, retaining WorkCard and writing rows.
- Site constants and canonical helpers: `src/site/config.ts`

## Page widths

The default shell remains 70rem. Visual pages can opt into `Base`’s `fluid`
shell, capped at 110rem with responsive side gutters; its header and footer
share that width. The homepage uses one case study per row. Below 64rem the
cover and description stack; above it they share a 2:1 row. Writing and reading
remain between the same stories, and prose has its own line-length limits.
The homepage opening fills the first small viewport below the sticky header,
with vertically centred content. Its minimum height allows short screens and
enlarged text to grow naturally rather than clipping the introduction.
With JavaScript enabled, the opening starts with the HB mark centred.
`src/client/nameMorph.ts` separates and straightens its two pieces before
reshaping them into the initials. The other letters follow individually authored
pen routes from `src/site/nameMotion.ts`, then hand over to regular Geist HTML
type after 2.65 seconds. `src/site/namePaths.ts` contains outlines extracted from
the bundled font. Input or resizing completes the motion immediately. The
interruption listeners are installed before fonts finish loading; restored
scroll positions, fragment links and an already revealed introduction skip
the logo sequence. Hiding or leaving the page completes both opening states
so returning cannot resume a partial mark. Changes to reduced motion reveal
the introduction immediately; resizing cancels any active name relocation.
The first click, key press, tap or scroll reveals the introduction once;
`src/client/heroReveal.ts` animates the name between its two positions. A first
downward wheel gesture at the top holds scrolling once for 400ms while the
name and introduction settle. Held deltas are discarded, never replayed. The
capture listener runs before the shell's wheel smoother and is removed on
release. Keyboard, touch, reversing direction, modified gestures, nested scroll
regions, resize and reduced motion bypass or interrupt the hold. Returning to
the top or restoring a scrolled page cannot trigger another hold.
Small screens keep the stacked layout. Reduced motion
reveals immediately, and without JavaScript the complete introduction is shown.

## Invariants

**Colour is used whole.** Every colour is a semantic role from
`src/styles/themes.css`, and the roles resolve to primitives in
`src/styles/tokens.css`. No opacity modifiers, no scale gradations, no literal
hex outside `tokens.css`. If a tinted variant is needed, add a token.
The places CSS cannot reach (the `theme-color` meta tags, `site.webmanifest`
and the generated icons) resolve the canvas and text roles from the two
stylesheets through `src/site/themeColors.ts`, and `theme.ts` reads the computed
canvas colour after a switch, so no hex is copied out of `tokens.css`.
A control's resting border (field, outlined button, chip) is
`--color-stroke-control`, which clears 3:1 against every surface in both
themes; `--color-stroke-strong` does not in the light theme and is for
decoration only.

**No inline styles in rendered markup.** The Content-Security-Policy is
hash-only, and a `style` attribute cannot be hashed. A page that needs a
per-instance value sets a custom property on a class, as `PageHeader.astro` does
with its three measures. `tests/build-output.test.ts` fails on any `style`
attribute in the build, and a hook warns at edit time.

**Theme classes own the native colour scheme.** The pre-paint resolver accepts
only saved `light` and `dark` values; anything else keeps following the system.
The bundled toggle reads `--color-bg-canvas` for browser chrome rather than
maintaining another palette, and makes no inline style writes.

**One inline script, hashed.** `src/client/themeBoot.ts` is the only inline
script, and `Base.astro` hashes that exact constant into `script-src` with
`Astro.csp.insertScriptHash`. Astro does not hash the content of an
`is:inline set:html` script by itself, so that call is load-bearing; `Base.astro`
throws if `security.csp` is ever turned off. Everything else is a bundled module,
covered by `'self'`.
The same boot script marks scripting as enabled before first paint, so the
homepage can hide its introduction initially without a flash or a second inline
script. Its reveal uses class/data selectors and the Web Animations API, never
an inline style attribute.

**No syntax highlighter.** Shiki emits inline styles, so
`markdown: { syntaxHighlight: false }` is set and code blocks render as plain
`<pre><code>` on the monospace token.

**Legacy URL policy lives only in `netlify.toml`.** Every rule carries `status`
and `force = true`. There is no second copy in Astro's `redirects` config,
because that emits meta-refresh pages that outrank the Netlify rules.
`tests/redirects.test.ts` asserts every site-relative target exists in the build.
`/writing` redirects to `/work?type=writing`, retaining query parameters.
Its local HTML fallback shares `/work`'s canonical and is marked noindex,
while keeping its own generated markdown twin. No detail address changes.
RSS includes projects, posts and reports, using their existing unique URLs
and a fresh Sanity query. The sitemap lists only the canonical index.

**Combined-index copy remains in Sanity.** Optional `workIndexPage.combined`
fields supply metadata, hero and control copy. Until published, the index
composes existing work and writing prose; UI labels have short functional
defaults. Components fetch no content collections. Header reads page copy
through the same helper as the index.

**Shared copy lives in Site Settings.** The header, footer, new-tab note,
contact band, the labels on work stories, posts and reports, and the PDF
viewer's controls all read `siteSettings`, so no visible string or accessible
name is written in a component. Routes stay in code; only labels move.
`getSiteSettings` runs `validateSiteSettings` and fails the build on an empty
label. A work story link carries a `kind`; the work card finds the source code
link by `kind === 'source'`, never by its label.

**One icon registry.** Every icon is a path list in `src/components/icons.ts`
rendered by `Icon.astro`. The logo and its temporary homepage name morph are
the only other SVGs.

**One JSON-LD graph per page.** `src/site/seo.ts` builds it; no page adds its
own. It always contains a `Person`, a `WebSite` and a page node with stable URL
identifiers. Detail pages add a separate content entity connected to its page;
collections describe their visible entries in order. Topics share identifiers
with tag pages. Routes supply rendered text, citations, actual images and PDF
resources from published content; metadata must not invent credentials, ratings
or extracted PDF text. The author's image is an optimised portrait, not an app
icon. `serializeJsonLd` escapes markup delimiters before embedding the graph.
Breadcrumbs connect to the page when supplied. Public content entities declare
free access; the generic page node makes no access claim about private routes.

**Locale is `en-NZ` everywhere.** Date formatting, `og:locale` (`en_NZ`),
JSON-LD `inLanguage`, `<html lang>`, and the RSS `<language>`.

**Markdown twins are derived, never authored.** `scripts/build-markdown.ts`
runs after `astro build` and converts each page's `<main>` into a `.md` file
beside it, so `/about.html` gains `/about.md`. Nothing writes markdown by hand:
a twin cannot drift from its page, and `/privacy` and `/terms` need no second
copy of text the templates own. `Base.astro` advertises the twin and
`netlify/edge-functions/markdown.ts` resolves it, both through the same mapping,
which `tests/build-output.test.ts` asserts they agree on.

**Content validation fails the build.** `getWorkStories`, `getPosts`,
`getReports` and `getSiteSettings` run the validators in `src/content/validate.ts` and throw on a
non-empty result, so a story with no cover alt text never reaches production.

**A link that opens a new tab says so.** Every `target="_blank"` link carries
`aria-describedby` pointing at `NEW_TAB_NOTE_ID` (`src/site/config.ts`), the
hidden note `Footer.astro` renders once per page. `Button` with `external` and
the Portable Text renderer do this for you; a hand-written link has to add it.
`tests/build-output.test.ts` fails the build output on any link that does not.

**The sticky header never covers focus.** `html` carries a `scroll-padding-top`
of `--site-header-height`, so focus and fragment links land below the header.
If the header grows, change that token with it.

## Non-obvious pieces

- **The page is an ordinary scrolling document.** A WebGL page-fold effect once
  owned the scroll container and forced capture-phase listeners; it was removed
  on 2026-08-18. Bind scroll handlers to `window`.
  `src/client/wheelScroll.ts`, initialised through the shell, eases coarse
  vertical wheel steps over 140ms using the native window scroll position.
  Small or fractional pixel deltas and horizontal gestures remain native;
  device detection is a conservative heuristic. Touch, keyboard, modified
  wheel events, nested scroll regions and reduced motion bypass smoothing.
  Other input or an external scroll-position change cancels pending motion.
  Hiding the tab also cancels pending movement before it can resume on return.
- **`src/content/images.ts` derives its image builder from the asset URL**, not
  from the Sanity client, because the client imports `astro:env/server` and the
  test runner cannot resolve that. A Sanity asset URL carries its project and
  dataset, so hotspot and crop still work.
- **`src/content/writing.ts` and `src/content/related.ts` import the query layer
  lazily**, for the same reason: their pure helpers have to stay importable
  under `tsx`.
- **The recommendation form works without JavaScript.** `/api/recommend` answers
  a form-encoded body with a 303 to `/reading/sent`, and a JSON body with JSON.
  Astro's `security.checkOrigin` rejects a form post from another origin, which
  is what stops a third-party page submitting it.
- **Email notifications use Resend at request time.** `src/server/email.ts`
  reads `RESEND_API_KEY` and `NOTIFICATION_FROM` through the secrets helper and
  sends plain-text notifications to `CONTACT_EMAIL`. Recommendations are stored
  before sending; a delivery failure keeps the blob and returns an error to the
  visitor. Retrying can create another recommendation. Neither endpoint claims
  success when Netlify Blobs is unavailable, including local development.
- **The contact band has an optional email callback form.** Its copy is
  `siteSettings.contactBand.form` in Sanity. Without that object the band keeps
  its existing links. `ContactForm.astro` posts to `/api/contact`, with browser
  enhancement from `src/client/contactForm.ts` through the shell. The contact
  page renders the same optional form directly, without repeating the band. Native form
  posts redirect to `/contact/sent`; JSON posts return JSON. The visitor's email
  is sent as the notification's reply address and is not stored in Blobs.
  Both submission endpoints bound request bodies, reject foreign Origin headers,
  and use separate hourly rate counters. No extra blob store is needed.
- **`/stats` authenticates by cookie, not by query string.** A one-time
  `?token=` is compared in constant time and exchanged for an HttpOnly, Secure,
  SameSite=Strict cookie via a 303, so the secret lands in one URL rather than in
  every request and every log line after it. `src/server/statsAuth.ts` is the
  whole decision and is unit-tested.
- **Analytics**: `api/collect.ts` writes anonymised session sequences to Netlify
  Blobs, `netlify/functions/session-insights.mts` synthesises them nightly (the
  schedule is in that file's own `config` export, not in `netlify.toml`), and
  `/stats` renders the result. The visitor nonce lives in `sessionStorage` for
  the life of one tab, which is enough to join a booking to the session that
  produced it without a persistent identifier.
- **Content negotiation happens at the edge, not in a route.** The edge
  function passes anything that is not a markdown request straight through, so
  HTML keeps the headers `netlify.toml` sets and the site does not depend on the
  function succeeding. Only the markdown branch sets `Vary: Accept`, because
  only it varies. Its path config lives in its own `config` export, like the
  scheduled function's schedule. Local development disables the adapter's Edge Functions emulator in
  `astro.config.ts`, avoiding its Deno runtime requirement. The wiring
  can only be confirmed on a deploy preview; the branch logic is unit-tested
  against a stubbed context in `tests/markdown-negotiation.test.ts`.
- **The teaser videos are static files, and they do not autoplay themselves.**
  `public/media/thecity-teaser.mp4` and `public/media/youinc-teaser.mp4` back
  two homepage features, keyed by slug in `src/pages/index.astro`. They are served
  from the origin because `media-src 'self'` permits that and nothing else; a
  clip on the Sanity CDN would be blocked. The markup carries no `autoplay`
  attribute on purpose, since that fires before `prefers-reduced-motion` can be
  read — `src/client/videoTeaser.ts` starts playback, pauses it offscreen, and
  reveals the pause control that ships `hidden`. The posters live in
  `src/assets/` instead, so the build hashes and optimises it.
- **`pdfjs-dist` comes from npm** and fetches report PDFs straight from the
  Sanity CDN, which sends CORS headers for this origin. Its worker is imported
  with `?url`, so it is a hashed asset under `/_astro` and satisfies
  `worker-src 'self'`. Its 100% zoom fits the page to the container width;
  larger scales grow the canvas inside a keyboard-focusable scroll region.
  Viewer shortcuts stay within the viewer and preserve browser modifier keys.
- **The GPU calculator compares one currency at a time.** Regional presets
  select the electricity tariff and its currency (NZD, USD or EUR). Cloud
  output-token prices start in USD and use the dated ECB snapshot in
  `src/client/gpuCalculator.ts`; its source and date are displayed beside the
  estimate. Custom tariffs keep the selected currency. The comparison reports
  the percentage by which local cost is lower or higher than cloud cost.
- **Mobile navigation remains a native disclosure.** `src/client/navigation.ts`
  is reached through the shell entry point and adds Escape, outside-pointer and
  link dismissal, updates the summary label, and closes it at the desktop
  breakpoint. Without JavaScript, the native details/summary control still works.

## Blob stores

Four named Netlify Blobs stores, whose names must not change because data
already sits in them: `sessions`, `session-insights`, `rate-limits` and
`recommendations`. `src/server/blobs.ts` resolves them together and returns
`null` when `getStore` throws, which is what happens outside Netlify.

## Security-sensitive

- The full Content-Security-Policy is a per-page `<meta>` element emitted by
  Astro's `security.csp`. The HTTP header in `netlify.toml` carries only
  `frame-ancestors 'none'`, which a meta element cannot express. A header that
  also named `script-src` would be enforced alongside the meta policy and would
  block the hashed theme script.
- `src/server/timingSafe.ts` is the only string comparison used for a secret.
- Never commit secrets. `INSIGHTS_TOKEN`, `CAL_WEBHOOK_SECRET` and
  `RATE_LIMIT_SALT`, `RESEND_API_KEY` and `NOTIFICATION_FROM` are set in Netlify and read through `src/server/secrets.ts`.
