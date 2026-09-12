# AGENTS.md

Guidance for any coding agent (Claude Code, opencode, Codex, …) working with code
in this repository. It is the only agent-facing routing document: `CLAUDE.md` is
a symlink to it, and `AGENTS.md` was folded into it on 2026-08-21, so do not
recreate either as a separate file.

## Commands

Package manager is **pnpm** (CI and Netlify both use it; `pnpm-lock.yaml` is the
committed lockfile, at `lockfileVersion: '9.0'`).

```bash
pnpm install --frozen-lockfile
pnpm run dev          # dev server on :4321
pnpm run build        # astro check && astro build && the markdown twins - type errors fail the build
pnpm run test         # tsx --test tests/*.test.ts
pnpm run preview      # serve the production build
pnpm run check        # astro check && knip
pnpm run icons        # regenerate favicon, app icons and og-default.png
pnpm run migrate      # dataset migration; destructive, see Footguns
pnpm run studio:dev   # Sanity Studio (the studio/ workspace)
pnpm run studio:build
pnpm run studio:deploy
```

Run a single test file: `pnpm exec tsx --test tests/work.test.ts`.

The glob is `tests/*.test.ts`, not `tests/**` - tests in subdirectories will not
run. `tests/build-output.test.ts` and `tests/redirects.test.ts` read `dist/` and
skip themselves when there is no build, so run `pnpm run test` again after
building to get the whole suite.

`pnpm exec knip` checks for dead code and unused dependencies (config in
`knip.json`); `pnpm run check` runs it alongside `astro check`.

## Environment

`SANITY_PROJECT_ID` is required and validated at config load through
`astro:env`, so a missing `.env` fails before Astro starts. The id is public
(`qnuj1c4o`, also in `netlify.toml` and CI). Defaults: `SANITY_DATASET=production`,
`SANITY_API_VERSION=2024-01-01`.

`INSIGHTS_TOKEN` gates the private `/stats` page; without it the page returns
503 rather than falling open. `CAL_WEBHOOK_SECRET` and `RATE_LIMIT_SALT` gate the
webhook and the rate limiter. All three are set in Netlify, read through
`src/server/secrets.ts` from `process.env` rather than `astro:env/server` so the
route tests can import the modules under `tsx`.

`SANITY_API_TOKEN` is only for the local migration script, and needs write access.

CI (`.github/workflows/ci.yml`) runs the tests, the build, the tests again, knip
and the Studio build on Node 22 and pnpm 10 with the three Sanity variables set.
A failure that only reproduces locally is usually a version or env mismatch.

Config files: `astro.config.ts`, `sanity.config.ts` (in `studio/`), `netlify.toml`.

## Rendering model (read this before touching a route)

`output: 'static'` with the Netlify adapter; every content route is baked to HTML
at build time from Sanity. `build: { format: 'file' }` and
`trailingSlash: 'never'`. Request-time inputs do not exist on a prerendered page.
The only server routes are the ones exporting `prerender = false`:
`api/collect.ts`, `api/recommend.ts`, `api/cal-webhook.ts`, `reading/sent.astro`
and `stats.astro`.

Content negotiation is the one request-time behaviour above the build:
`netlify/edge-functions/markdown.ts` serves the `.md` twin that
`scripts/build-markdown.ts` wrote beside each page when a request asks for
`text/markdown`, and passes everything else through untouched.

`ARCHITECTURE.md` is the authoritative description of the layers and the
invariants. Read it before anything structural; the short version is below.

## Architecture

Routes (`src/pages/`) own fetching and page assembly; components
(`src/components/`) own presentation; `src/content/` owns everything about
content (client, queries, types, validators, renderers, image URLs);
`src/client/` owns browser behaviour; `src/server/` owns request-time helpers;
`src/site/` owns constants and metadata; `src/styles/` owns the design system;
`src/sanity/schemaTypes/` owns the content model contract.

`PLANS.md` defines the ExecPlan format for substantial features; instances live
in `docs/exec-plans/`, finished ones under `completed/`.

## Content rules

- Every visitor-facing sentence except `/privacy` and `/terms` lives in Sanity.
  The legal pages stay in templates because they are versioned with the code and
  edited about once a year. If you find yourself hard-coding a sentence in a
  template, add a field instead.
- Do not use em dashes in site content.
- All site copy is written with the `hamish-voice` skill in clean mode (Hamish's
  own register, spelling corrected). That covers page intros, book notes, blurbs,
  and anything else a visitor reads.
- Do not describe the site or Hamish in terms of candour: no "write-ups say what
  didn't work", "what I can talk about honestly", "what I would do differently".
  That formula is the house style of AI-written developer bios, and it was
  stripped from Sanity and `llms.txt.ts` on 2026-08-21. Name the actual project
  instead. The same goes for section headings: "A decision I changed my mind
  about" is the formula; "Taking the SaaS layer out of You Inc" is the content.
- UK English.

## Repo conventions

- Keep changes minimal and task-scoped.
- Colour is used whole: only the semantic roles from `src/styles/themes.css`, no
  opacity modifiers, no scale gradations, and no literal hex outside
  `src/styles/tokens.css`. If a tinted variant is needed, stop and ask for a
  token.
- No `style` attribute in any `.astro` template. The policy is hash-only and
  cannot hash one. Use a class, or a custom property set on a class.
- Markdown twins are generated, never written by hand. If a page needs
  different markdown, change the page; `scripts/build-markdown.ts` converts
  whatever `<main>` renders.
- Sanity schemas live only in `src/sanity/schemaTypes/`. Both Studio configs
  import them; do not recreate a schema mirror or a separate Studio dependency
  tree. React exists only under `studio/`.
- Legacy URL policy lives only in `netlify.toml`. Astro's `redirects` config is
  deliberately unused because it emits meta-refresh pages that outrank the
  Netlify rules.
- If routing or canonical behaviour changes, review `src/layouts/Base.astro`,
  `src/site/seo.ts`, `src/site/config.ts` and the four crawl endpoints together.
- If architecture or invariants change, update `ARCHITECTURE.md` in the same
  commit.
- Do not commit `dist/`.
- Reading and searching files, `pnpm run test` and `pnpm run build` need no
  permission. Dependency changes, deploy commands, writes to the production
  Sanity dataset, and destructive operations (file deletion, history rewrites)
  are all ask-first.

## Footguns

- `fetchSanity` reads through Sanity's edge CDN, so content written to Sanity
  takes up to about two minutes to reach a build. A build run immediately after a
  write silently produces the old content. Use `fetchFreshSanity` only where
  staleness is unacceptable (currently RSS).
- A content write needs a **second deploy, several minutes later**. The build
  hook is configured in Sanity as well as Netlify, so the write itself fires a
  deploy within seconds; that one always races the CDN purge and you do not get
  to choose when it runs. Two things make this worse than it sounds:
  - The CDN purges **per query**, and queries purge independently, so the racing
    build can bake some documents fresh and others stale. Output that is *partly*
    right is the tell. On 2026-09-12 one write across nine documents produced a
    deploy where `/about` had new copy while `/` and `/work` had old copy.
  - **The purge is regional, so checking from your machine proves nothing.** Also
    on 2026-09-12, `apicdn` served the new `aboutPage` from Wellington at
    03:31:45; the deploy that ran 03:32:00-03:33:31 still baked the old value,
    confirmed against the deploy permalink rather than the apex domain. A local
    `curl` says only that your nearest edge node has purged.
  Do not try to verify the race away. Wait several minutes after the write, then
  trigger a build (`netlify api createSiteBuild --data '{"site_id":"..."}'`, or
  the dashboard's Trigger deploy) and check more than one page. To tell a stale
  build from a stale edge cache, fetch the deploy permalink
  (`https://<deploy-id>--<site>.netlify.app/<path>`).
- Publishing in Studio does not deploy the site. A Netlify build hook has to
  fire, and it is configured in Netlify and Sanity, not in this repository.
- `pnpm run migrate subtractive` unsets the legacy fields on every work story and
  post and deletes the retired `project`, `aphorism` and `projectsIndexPage`
  documents. Only the pre-rewrite export under `.sanity-backups/` can restore
  what it removes, and restoring it replaces the whole dataset. `additive` is
  re-runnable and harmless to the live site. Read `--dry-run` output first; a
  hook blocks the write until the command carries `SANITY_WRITE_ACK=1`.
- The dev server caches the Sanity client at module scope. After changing
  page-copy singletons, restart `pnpm run dev`; a browser reload is not enough.
- `netlify/functions/session-insights.mts` calls Anthropic at 15:00 UTC nightly.
  Its schedule is in its own `config` export, not in `netlify.toml`. If you
  change the model or the request shape, check the installed SDK accepts the
  parameters rather than assuming; the current call uses `thinking: { type:
  'adaptive' }`, `betas` and `fallbacks`.
- The markdown twins only exist after a build, and the Netlify CLI does not run
  edge functions in this repo (`netlify dev` and `netlify serve` both fall back
  to a plain static server that never invokes them). Content negotiation
  therefore cannot be exercised locally; confirm it on a deploy preview with
  `curl -sI <url> -H 'Accept: text/markdown'`.
- Astro does not hash the content of an `is:inline set:html` script. `Base.astro`
  calls `Astro.csp.insertScriptHash` for the theme resolver, and removing that
  call silently drops the hash and the browser blocks the script.

## Automated checks

`.claude/settings.json` wires three hooks, with scripts in `.claude/hooks/`.
They enforce the invariants whose breakage is otherwise silent, so a warning
from one is a real finding rather than noise.

- **Before a Bash call** (`guard-destructive.sh`): blocks the two irreversible
  operations here. Scripts that write to the production Sanity dataset need
  `SANITY_WRITE_ACK=1` prefixed (a `--dry-run` passes through); git commands that
  throw away uncommitted work (`git checkout -- `, `git restore`,
  `git reset --hard`, `git clean -f`, `git stash drop`) need
  `GIT_DESTRUCTIVE_ACK=1`, and only fire when the tree is actually dirty. Branch
  switches and reads pass through untouched.
- **After an edit or write** (`check-invariants.sh`): reports a test file placed
  in a subdirectory where the glob will skip it, edits to the routing and
  canonical surface, a literal hex colour outside `tokens.css`, and a `style`
  attribute in an `.astro` template.
- **Before the turn ends** (`verify-before-stop.sh`): when `.ts`, `.tsx` or
  `.astro` files under `src/` or `tests/` are dirty, runs `pnpm run test` and
  `pnpm exec astro check` (about 8s together) and blocks on failure. Results are
  cached against the tree, so an unchanged tree is not rechecked, and the same
  failure never blocks more than twice.
