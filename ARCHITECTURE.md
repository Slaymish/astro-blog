# Architecture

The authoritative description of the boundaries and invariants of this site.
`README.md` covers setup and commands; `AGENTS.md` covers the working rules.
If something here changes, change this file in the same commit.

## Rendering model

`output: 'static'` with the Netlify adapter. Every content route is written to
an HTML file at build time from Sanity via `getStaticPaths`. Three consequences
catch people out:

- **Request-time inputs do not exist on a prerendered page.** Query parameters,
  headers and cookies have to be resolved in the browser. The tag filter on
  `/writing` does exactly that, and mirrors its state into the URL itself.
- **Publishing in Sanity needs a Netlify build hook** to reach the site.
- `build: { format: 'file' }` and `trailingSlash: 'never'`, so URLs emit as
  `/work.html` and canonicals omit the trailing slash. `publicPathFromAstro`
  maps an output filename back to its public route, and everything that builds a
  URL goes through it. Keep the two settings and that helper in step.

The only routes that run on request are the ones that opt out with
`export const prerender = false`: `api/collect.ts`, `api/recommend.ts`,
`api/cal-webhook.ts`, `reading/sent.astro` and the private `stats.astro`.

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
- The posts-plus-reports stream shared by `/writing`, `/tags/[tag]` and the
  homepage: `src/content/writing.ts`
- Site constants and canonical helpers: `src/site/config.ts`

## Invariants

**Colour is used whole.** Every colour is a semantic role from
`src/styles/themes.css`, and the roles resolve to primitives in
`src/styles/tokens.css`. No opacity modifiers, no scale gradations, no literal
hex outside `tokens.css`. If a tinted variant is needed, add a token.

**No inline styles in rendered markup.** The Content-Security-Policy is
hash-only, and a `style` attribute cannot be hashed. A page that needs a
per-instance value sets a custom property on a class, as `PageHeader.astro` does
with its three measures. `tests/build-output.test.ts` fails on any `style`
attribute in the build, and a hook warns at edit time.

**One inline script, hashed.** `src/client/themeBoot.ts` is the only inline
script, and `Base.astro` hashes that exact constant into `script-src` with
`Astro.csp.insertScriptHash`. Astro does not hash the content of an
`is:inline set:html` script by itself, so that call is load-bearing; `Base.astro`
throws if `security.csp` is ever turned off. Everything else is a bundled module,
covered by `'self'`.

**No syntax highlighter.** Shiki emits inline styles, so
`markdown: { syntaxHighlight: false }` is set and code blocks render as plain
`<pre><code>` on the monospace token.

**Legacy URL policy lives only in `netlify.toml`.** Every rule carries `status`
and `force = true`. There is no second copy in Astro's `redirects` config,
because that emits meta-refresh pages that outrank the Netlify rules.
`tests/redirects.test.ts` asserts every site-relative target exists in the build.

**One JSON-LD graph per page.** `src/site/seo.ts` builds it; no page adds its
own. It always contains a `Person` and a `WebSite`, then either an article node
or a `WebPage`, then a `BreadcrumbList` when the page passes crumbs.

**Locale is `en-NZ` everywhere.** Date formatting, `og:locale` (`en_NZ`),
JSON-LD `inLanguage`, `<html lang>`, and the RSS `<language>`.

**Content validation fails the build.** `getWorkStories`, `getPosts` and
`getReports` run the validators in `src/content/validate.ts` and throw on a
non-empty result, so a story with no cover alt text never reaches production.

## Non-obvious pieces

- **The page is an ordinary scrolling document.** A WebGL page-fold effect once
  owned the scroll container and forced capture-phase listeners; it was removed
  on 2026-08-18. Bind scroll handlers to `window`.
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
- **`pdfjs-dist` comes from npm** and fetches report PDFs straight from the
  Sanity CDN, which sends CORS headers for this origin. Its worker is imported
  with `?url`, so it is a hashed asset under `/_astro` and satisfies
  `worker-src 'self'`.

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
  `RATE_LIMIT_SALT` are set in Netlify and read through `src/server/secrets.ts`.
