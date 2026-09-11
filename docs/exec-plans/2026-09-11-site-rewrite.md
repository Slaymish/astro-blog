# Rewrite hamishburke.dev on Astro 7, Sanity and Netlify with a smaller, faster, CMS-owned site


This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

`PLANS.md` at the repository root defines the format of this document. Maintain this file in accordance with it. The audit that motivated every decision here is `docs/rewrite-audit-2026-09-11.md`; the facts it established are repeated below wherever this plan depends on them, so the plan stands alone.


## Purpose / Big Picture


After this plan is executed, hamishburke.dev is the same site a visitor knows today (the same URLs, the same content, the same look on the pages redesigned in September 2026) but it ships a fraction of the bytes, every visitor-facing word is editable in Sanity Studio, the article pages match the rest of the site, the Content Security Policy no longer allows inline scripts, and the codebase is about half its current size with no client-side framework, no Tailwind, no embedded CMS bundle and no dead assets.

You can see it working by running `pnpm run build` and then `pnpm run preview`, opening http://localhost:4321/, and observing: the homepage loads with no JavaScript bundle larger than 20 KB; the browser console shows no CSP violations; `/work/you-inc`, `/posts/building-a-private-ai-server-for-friends` and `/reports/home-lab-architectural-study` render in one visual system; `/reading` accepts a book recommendation with JavaScript disabled; and `pnpm run test` reports every test passing, including a new suite that opens every built HTML file and checks its canonical URL, its Open Graph image and every internal link.


## Progress


- [x] Milestone 0: done. Worktree `../astro-blog-rewrite` on branch `rewrite`; dataset exported to `.sanity-backups/production-2026-09-11-pre-rewrite.tar.gz` (3.9 MB, 39 documents, 19 assets); `scripts/migrate-2026-09.ts` written with a schema-length pre-check. Hamish replaced the expired token on 2026-09-11; the dry run printed 16 mutations matching this plan and the additive write committed as transaction `8HIgLScqRYc44ukgLEuNVW` (5 images uploaded, 1 reused). Every acceptance query passes: the marker is in the renamed post, 7 stories have `introduction`/`cover`/`links`, `homePage.featured[0]` is `you-inc`, `wildfire-pyspark.kind` is `research`, `aboutPage.largeCopy` survived the lift, both post covers have alt text, and no document still uses the `gpu-share` post slug.
- [x] Milestone 1: done. `studio-production` renamed to `studio` with a real manifest; root manifests, `astro.config.ts`, `netlify.toml`, `tsconfig.json`, `knip.json`, `src/env.d.ts` written; `astro.config.dev.ts`, `astro.config.shared.ts`, `tailwind.config.cjs`, root `sanity.config.ts`, `todo.md` and the four dead scripts removed; old tree moved to `legacy-src/`/`legacy-tests/`. `pnpm install` clean, React absent from the root, `sanity --version` prints `@sanity/cli/8.9.1`.
- [x] Milestone 2: done. `tokens.css`, `themes.css`, `base.css`, `primitives.css`, `prose.css`, `src/site/{config,seo,escape,logo}.ts`, `src/client/*` (theme boot, theme, booking ref, analytics tracker, code copy, visitor nonce, recommend form, writing filter, shell), `Base.astro`, `Header.astro`, `Footer.astro`, `Logo.astro`, `ThemeToggle.astro`. Placeholder homepage builds; `dist/index.html` has no `unsafe-inline`, no `style="`, one JSON-LD graph, and a `script-src 'self' https://cloud.umami.is 'sha256-...'`. `astro check` reports 0 errors, 0 warnings, 0 hints. Live browser check of the toggle and the console deferred to the Milestone 4 pass.
- [x] Milestone 3: done. Schemas rewritten (`post`, `report`, `workStory`, new `homePage`, `workIndexPage`, `readingPage`, reshaped `aboutPage`, new shared `seo` object); `src/content/{sanity,types,queries,validate,markdown,portableText,images,writing,related,readingTime,work}.ts` and `SanityImage.astro`. Every GROQ query runs against the live dataset. Markdown and Portable Text renderers verified under `tsx`: heading ids, `-2` suffix on a duplicate heading, `javascript:` links dropped, raw HTML dropped, the `{{gpu-calculator}}` marker emitted and splittable, srcset with an upscale guard and hotspot-aware aspect crops. `astro check` clean. The probe page is not needed: the validators were run against the live data instead, and fail with the joined message as specified.
- [x] Milestone 4: done. Components: `Button`, `Icon`, `IconText`, `icons.ts`, `PageHeader`, `ContactBand`, `EntryList`, `RelatedList`, `ArticleHeader`, `WorkCover`, `Evidence`, `WorkCard`, `SanityImage`. Pages: `index`, `work/index`, `work/[slug]`, `writing/index`, `posts/[slug]`, `reports/[slug]`, `tags/[tag]`, `reading/index`, `about`, `cv`, `contact`, `404`, `privacy`, `terms`. `astro check` clean, `pnpm run build` produces all 38 pages, and the content spot-check passes on every page the plan lists. Still outstanding, because they need a real browser: the console CSP check, theme-toggle persistence across reload, the 375 px no-horizontal-scroll pass, and live interaction with the calculator and the PDF viewer.
- [x] Milestone 5: done. `src/server/{secrets,blobs,statsAuth}.ts`; routes `api/collect`, `api/recommend`, `api/cal-webhook`, `stats.astro`, `reading/sent.astro`; `GpuCalculator.astro` + `src/client/gpuCalculator.ts`, `PdfViewer.astro` + `src/client/pdfViewer.ts`, `src/client/recommendForm.ts`. Verified against `astro dev`: collect 204 / 400 / 413; recommend JSON 200 and 400; recommend form-encoded 303 to `/reading/sent?state=ok` and `?state=error`; `/stats` 503 unconfigured, 401 without a token, 303 with an HttpOnly `Secure` `SameSite=Strict` cookie on `?token=`, 200 by cookie and by bearer, 401 on a token prefix. `compute()` returns exactly `(500/55)/3600 * 0.15 * 0.346` for the default inputs. The nightly function's Anthropic call needs no change (see Surprises).
- [x] Milestone 6: done. All four written. RSS reads past the CDN, uses the excerpt as the description, drops the slug exclusion and declares `en-nz`; the sitemap carries no `now` timestamps and never lists `/stats` or `/reading/sent`; robots.txt drops the `Host:` line and the per-crawler blocks. Verified after the build: `xmllint` reports both `rss.xml` and `sitemap.xml` well-formed, the sitemap has exactly 36 `<loc>` entries (9 static + 7 stories + 3 posts + 2 reports + 15 tags), and `rss.xml` has no `posts/gpu-share` and two hits for the new slug (link and guid).
- [x] Milestone 7: done. Fonts in `src/assets/fonts`, headshot re-encoded to 1600x2400 at 192 KB in `src/assets/images`, `scripts/generate-icons.mjs` written and run, `public/site.webmanifest` written. `public/` is 156 KB (from 24 MB) and holds exactly `410.html`, `apple-touch-icon.png`, `cv.pdf`, `favicon.svg`, `icon-192.png`, `icon-512.png`, `og-default.png`, `site.webmanifest`. The six images the migration uploads were staged in `migration-assets/` and deleted once the additive write had uploaded them; all six are now Sanity assets, so a re-run reuses them by original filename.
- [x] Milestone 8: done. Twelve pure suites restored and repointed, five added (`stats-auth`, `gpu-calculator`, `portable-text`, `validate`, `writing`), `markdown-safety` and `recommend-route` extended, `site.test.ts` rewritten onto `buildMetadata`, and the two build-output suites added. CI runs test, build, test, knip, studio:build. Both hooks updated and their new branches exercised. `AGENTS.md`, `ARCHITECTURE.md` and `README.md` rewritten; `legacy-src/`, `legacy-tests/`, `docs/design-docs/`, `docs/exec-plans/visitor-context.md` and `docs/portfolio-redesign.md` deleted. Acceptance met: 139 tests, 130 pass and 9 skipped before a build, 0 fail; `knip` silent; `astro check` 0/0/0. `src` is 9,040 lines across 100 files, against the 6,000-line target (see Surprises).
- [~] Milestone 9: merged and deployed. `rewrite` committed as `299863e`, fast-forwarded into `main` and pushed; CI green; the Netlify production deploy of `299863e` reached `ready`. Smoke test recorded in `docs/production-smoke-2026-09-11.md`: the whole preserve list returns 200, every redirect and 410 behaves, `/stats` is 401, and the crawl endpoints and metadata are correct. Deviations from the plan: no deploy preview or pull request, because Hamish asked for a direct merge; no Lighthouse run; the Studio is not deployed because no `studioHost` is configured and `sanity deploy` would prompt for a new public hostname. Still to do: turn off Rocket Loader and enable HSTS in Cloudflare (see Surprises), the browser-dependent checks, and the subtractive migration.


## Surprises & Discoveries


Recorded during the audit, before implementation began. Add to this list as work proceeds.


Found during Milestones 1 and 2:

- Observation: Astro does not hash the content of an `is:inline set:html` script, so `Astro.csp.insertScriptHash` is load-bearing rather than belt-and-braces.
  Evidence: removing the call and rebuilding drops `sha256-iySaVqzE48qmeRMfJXfMKOxccAMHjq8hF4bD2ffqaDk=` (the theme resolver's hash) from the meta policy entirely. `Astro.csp` is also typed as possibly undefined, so `Base.astro` throws when `security.csp` is off rather than silently shipping a page whose theme script the browser blocks.
- Observation: the plan's `astro.config.ts` block puts `variants` at the top level of a font family, but Astro's `FontFamilySchema` is strict and has no such key; the local provider reads `options.variants`. The prose after the block was right and the block was wrong.
  Evidence: `node_modules/astro/dist/assets/fonts/config.d.ts` (`options: z.ZodOptional<z.ZodRecord<...>>`, schema `z.core.$strict`) and `providers/local.d.ts` ("The `options.variants` property is required").
- Observation: the plan gave the latin-ext variants no `unicodeRange` and named only two JetBrains Mono variants, leaving two font files unreferenced. A face with no `unicodeRange` defaults to the whole of Unicode and would be preferred over the latin face, so a Latin-only page would download the ext file. Both ranges are now set on all three families and all four JetBrains variants are declared, which is what the plan's own following paragraph asked for.
- Observation: the nightly function's schedule is in its own `config` export (`schedule: '0 15 * * *'`), not in `netlify.toml` as `AGENTS.md` claims. Nothing to carry into the new `netlify.toml`; the claim is corrected in the Milestone 8 doc rewrite.
- Observation: `markdown: { syntaxHighlight: false }` is needed in `astro.config.ts`, not just the absence of a highlighter. Astro warns at config load that Shiki's inline styles are incompatible with CSP because Shiki is the default.


Found during Milestone 3:

- Observation: neither post cover image carries `alt`, so the new `post` schema (alt required once an image is set) and `validatePosts` both reject the current data. The plan's additive migration did not set them.
  Evidence: running `validatePosts` against the live dataset returns "healthagent-apple-health-data-ingestion-and-insights: cover image has no alt text; gpu-share: cover image has no alt text". The additive step now sets `coverImage.alt` on both, keeping any value an editor has since added.
- Observation: `src/content/images.ts` cannot take its image URL builder from the Sanity client, because that client imports `astro:env/server`, which `tsx` cannot resolve, and the unit tests import the Portable Text renderer (which needs the builder for in-body images).
  Evidence: `tsx` fails with `ERR_UNSUPPORTED_ESM_URL_SCHEME ... Received protocol 'astro:'`. A Sanity asset URL already encodes its project and dataset (`/images/<project>/<dataset>/<file>`), so the builder is derived per image instead. Hotspot and crop still work: an aspect-cropped URL comes back with `rect=759,0,929,1394&fit=crop`.
- Observation: the four inline `seo` object definitions across the page singletons were byte-identical, so they are now one `seo` object type that all eight singletons reference.


Found during Milestones 4 and 5:

- Observation: the plan's acceptance command for the no-JavaScript recommendation form returns 403, not 303, because Astro's `security.checkOrigin` defaults to true and rejects a form-encoded POST with no matching `Origin`. The route is correct and the plan's curl was missing a header every real browser sends.
  Evidence: `curl -X POST .../api/recommend --data-urlencode 'title=The Fall'` returns 403; the same request with `-H 'Origin: http://localhost:4399'` returns `303 .../reading/sent?state=ok`, an empty title returns `?state=error`, and `-H 'Origin: https://evil.example'` returns 403. Keep the origin check on: it is what stops a third-party page posting the form.
- Observation: Netlify Blobs resolve under `astro dev` in this worktree, so `/api/recommend` answers `{"ok":true,"stored":true}` rather than the plan's expected `stored:false`. The `stores()` null path is still the tested fallback; it just is not what a local dev server hits.
- Observation: `pdfjs-dist` 6 rejects `getDocument(urlString)`; it takes `getDocument({ url })`.
  Evidence: `ts(2559): Type 'string' has no properties in common with type 'DocumentInitParameters'`.
- Observation: the nightly function's `beta.messages.create` call is already correct at the installed SDK. `betas`, `fallbacks` and `thinking: { type: 'adaptive' }` are all accepted at `@anthropic-ai/sdk` 0.124.0, `server-side-fallback-2026-06-01` is a known beta string (the array form of `fallbacks` that the call uses), and the file type-checks with zero errors. No change, so nothing to record as a decision.
- Observation: no call site passed `iconSize` or `strokeWidth` to `Icon.astro`, so its `style` attribute was removed by dropping both props rather than by adding modifier props nothing uses. `icon--sm` and `icon--lg` exist as classes for callers that need them.
- Observation: the old About page carried a second `Person` JSON-LD node of its own. Dropped: `seo.ts` emits exactly one graph per page, which is what the build-output test asserts.


Found during Milestones 6 to 8:

- Observation: `src` is 9,041 lines across 100 files, not the under-6,000 the Validation section sets as a target. The gap is not slop: `src/pages` is 2,613 lines and `src/components` 1,955, and both are almost entirely the ported scoped CSS the plan explicitly required ("the rewrite ports their styles, it does not invent a new look"), while `src/sanity/schemaTypes` is 992 lines of field definitions the CMS-ownership decision added. The old tree's equivalent was larger and also carried Tailwind, React, the 415-line `WorkGraphic.astro` and the embedding model. Treat 6,000 as a target that the CMS-ownership decision outgrew, not as a defect to chase.
- Observation: the plan's `knip.json` put `entry` at the top level alongside a `workspaces` map, which knip treats as a redundant top-level entry and then reports every shell module as unused. The entry list belongs inside the `.` workspace. With that fixed, `ignoreDependencies: ["sanity"]` turned out to be unnecessary too.
  Evidence: `knip` reported six configuration hints and four false "unused export" findings; both lists are empty after the config was moved.
- Observation: `TIMEZONE` had no reader. Nothing on the site formats to a fixed zone, so it was dropped rather than left as an unused export the plan happened to name.
- Observation: the hex-colour check has to exempt `src/layouts/Base.astro`. Its two `<meta name="theme-color">` values must be literal, because the browser reads them before the first stylesheet parses - the same reason `src/client/theme.ts` carries the pair with a comment.
- Observation: `docs/production-smoke-2026-09-08.md` was kept rather than deleted in Milestone 8, because Milestone 9 asks for a new smoke test "in the format of the old" and deleting the template first would lose it. Delete it once its successor is written.


Found at cutover verification:

- Observation: the documented Sanity CDN staleness is real and breaks the build, not just a page. Two builds run 10 and 45 seconds after the additive write failed with `TypeError: Cannot read properties of null (reading 'map')` on the homepage, because `createOrReplace` on the `homePage` singleton left the edge CDN serving the retired document, which has no `featured`. The same query against `api.sanity.io` returned the array throughout. A build about two and a half minutes after the write succeeded with no code change.
  Consequence for Milestone 9: do not trigger the production build immediately after a Sanity write. The homepage is the page that fails, and it fails the whole build.
- Observation: the Netlify adapter installs its own image service by default, so `<Image>` emitted `/.netlify/images?url=...` runtime transforms instead of the build-time variants the plan's Milestone 7 acceptance asks for. `tests/build-output.test.ts` caught it as a link to a file not in the build.
  Fixed with `netlify({ imageCDN: false })`: the headshot now builds four WebP variants under `/_astro` and the About page's `srcset` carries three candidates. A static site has nothing to defer to a per-request transform.
- Observation: `pdfjs-dist` ships both minified and unminified builds, and `pdf.worker.mjs` is 2.18 MB against `pdf.worker.min.mjs` at 1.2 MB. Importing the minified worker took `dist/_astro` from 3.0 MB to 2.2 MB.
- Observation: `dist/_astro` is 2.2 MB against the plan's under-2 MB, and 1.66 MB of that is PDF.js, which loads only on the two report pages. Every other chunk is at most 6 KB. The homepage's own payload is 8.4 KB of JavaScript and 61 KB of HTML, CSS and JavaScript together, so the visitor-facing claim in the Purpose section holds comfortably; the 2 MB figure does not, by 10 per cent, and the overage is one vendored PDF renderer.


Found at deploy:

- Observation: Cloudflare's Rocket Loader rewrites the `type` attribute of every script, including the inline theme resolver, to `e92c55ad...-text/javascript`. A script with an unrecognised `type` is not executed by the browser, so the resolver no longer runs before first paint and a light-theme visitor sees a dark flash until Rocket Loader gets to it. The CSP hash still matches, because Astro hashes the script's text and not its attributes, so this degrades the theme rather than breaking the page. This is the step the plan already called for; it is now measured rather than assumed.
- Observation: Cloudflare strips `Strict-Transport-Security`. The header leaves the Netlify origin correctly (`max-age=31536000; includeSubDomains; preload`) and is absent through the edge, so it has to be enabled under SSL/TLS > Edge Certificates rather than fixed in `netlify.toml`. The plan did not anticipate this.
- Observation: Cloudflare's email obfuscation injects `email-decode.min.js` because the footer carries a `mailto:` link. Same-origin, so the policy permits it.
- Observation: publishing the additive migration fired the Netlify build hook, and the old site rebuilt twice (07:06 and 07:07) and reached `ready` both times. That is direct confirmation that the additive step is harmless to the live site, which the plan asserted but could not demonstrate until now.

Found during Milestone 0:

- Observation: the `SANITY_API_TOKEN` in `.env` is expired, so no migration step can run until it is replaced.
  Evidence: `GET https://qnuj1c4o.api.sanity.io/v2024-01-01/users/me` with that bearer token returns 401 `SIO-401-ANF` "Session not found". The dataset export succeeded because the Sanity CLI uses its own login session, not the token.
- Observation: two of the cover `alt` strings this plan specifies exceed the 240-character limit this plan also specifies for `cover.alt`.
  Evidence: the gpu-share alt is 250 characters and the home-lab alt is 257. Both were trimmed of their trailing sentence; the facts those sentences carried are already in `figure.footnote` and `figure.facts`, so nothing is lost.
- Observation: `aboutPage.largeCopy` lives nested under `portrait`, not at the top level, and the subtractive step unsets `portrait`.
  Evidence: the export shows `aboutPage.portrait.largeCopy` as a one-block array. The additive step now lifts it to the top level, which the plan's step 7 did not say to do. Without that lift, the subtractive step would destroy the About page's body copy.
- Observation: `posts/status_screenshot.png` is already a Sanity asset, so the additive step uploads five images, not six.
  Evidence: the export's `assets.json` lists `image-365882c62fb0fc9e80ce5527094863cf43b3d6c1` with `originalFilename` `status_screenshot.png`. The reuse-by-filename lookup finds it.
- Observation: `contactPage.channels[linkedin].link.href` is `https://www.linkedin.com/in/hamishburke`, while `src/lib/site.ts` uses `https://www.linkedin.com/in/hamish-burke-2301669a`. Left as it is; the contact page's copy is CMS-owned and this plan does not reconcile the two.

- Observation: every published post uses `markdownBody`; none uses the Portable Text `body` field, and the four code fences that exist carry no language tag.
  Evidence: GROQ `*[_type=="post"]{ "hasMd": defined(markdownBody), "hasBody": defined(body) }` returned `hasMd: true, hasBody: false` for all three posts on 2026-09-11; fence scan of `markdownBody` found four fences, all untagged.
- Observation: Sanity's file CDN sends CORS headers for the site origin, so PDF.js can fetch report PDFs directly.
  Evidence: `curl -sI -H "Origin: https://hamishburke.dev" https://cdn.sanity.io/files/qnuj1c4o/production/9192ef20e82d4cad55c41aef18a001abbadcb306.pdf` returned `access-control-allow-origin: https://hamishburke.dev` and `access-control-allow-credentials: true`.
- Observation: five work stories reference `project` documents that no schema defines; the work page reads its "Visit site" and "Source code" links from them.
  Evidence: `*[_type=="project"]{ _id, "refs": count(*[references(^._id)]) }` returned six documents, five with one reference each, one (`otto`) with none.
- Observation: the production dataset still holds retired singleton documents (`homePage`, `workIndexPage`, `projectsIndexPage`) and one `aphorism` document, none of which any schema defines.
- Observation: Astro's CSP support cannot hash inline `style` attributes, and Shiki emits inline styles, so a hash-only CSP requires no `style=""` attributes in any template and no Shiki.
  Evidence: `node_modules/astro/dist/types/public/config.d.ts`, the `security.csp` description: "Shiki isn't currently supported. By design, Shiki functions use inline styles that cannot work with Astro CSP implementation."


## Decision Log


- Decision: Keep Astro 7.3, Sanity and Netlify; rewrite the code, not the platform.
  Rationale: the content already lives in Sanity, the redirects and Blobs stores live on Netlify, and the audit found the problems in what is shipped around the rendering model rather than in the model. Changing any of the three adds migration risk and fixes nothing on the list.
  Date/Author: 2026-09-11 / Claude (audit), approved by Hamish dropping the learning gate.

- Decision: One `astro.config.ts`, with the Netlify adapter in development as well as production.
  Rationale: the two-config split existed because the adapter once broke `astro dev` when Netlify Blobs were unreachable. The server routes already guard `getStore` with try/catch, so the split no longer buys anything and it duplicates every integration setting.
  Date/Author: 2026-09-11 / Claude.

- Decision: No Tailwind. Plain CSS with custom properties, one token vocabulary (the September 2026 `--color-*` roles), and one stylesheet per concern.
  Rationale: the redesigned pages are already hand-written CSS; Tailwind survives only in the legacy article pages and the calculator. Removing it deletes the Vite plugin, the `@theme inline` bridge, the dead v3 config and the third token vocabulary.
  Date/Author: 2026-09-11 / Claude.

- Decision: No client-side framework. The GPU cost calculator becomes an Astro component with a `<script>` in plain TypeScript.
  Rationale: it is one form with four inputs and arithmetic. React, ReactDOM, `@astrojs/react` and Framer Motion exist for it alone; a 150 ms opacity fade on four numbers does not justify them.
  Date/Author: 2026-09-11 / Claude.

- Decision: Remove `@sanity/astro` and the embedded Studio route. Sanity Studio lives only in the `studio/` workspace package (renamed from `studio-production/`), which owns `sanity`, `react`, `react-dom`, `styled-components` and `@sanity/vision`.
  Rationale: the embedded Studio shipped 6.3 MB of JavaScript into `dist/_astro`, mounted an admin UI on the public origin, and could not work under the site's CSP anyway. The site only needs `@sanity/client`.
  Date/Author: 2026-09-11 / Claude.

- Decision: Posts are markdown only (field `markdownBody`, unchanged name); reports and work stories are Portable Text only. The `post.body` Portable Text field and the `interactiveElement` field are removed from the schema.
  Rationale: all three published posts are markdown and none has a Portable Text body, so this removes a whole render path without migrating a single document. Renaming the field would force a migration for nothing.
  Date/Author: 2026-09-11 / Claude.

- Decision: No syntax highlighter for code blocks.
  Rationale: the only fences in the content carry no language tag, so no highlighter would colour them; and Shiki's inline styles are incompatible with a hash-only CSP. Code blocks are styled as plain `<pre><code>` with the monospace token.
  Date/Author: 2026-09-11 / Claude.

- Decision: The calculator is placed in a post by a paragraph containing exactly `{{gpu-calculator}}`. The markdown renderer turns that paragraph into the HTML comment `<!--component:gpu-calculator-->` and the post page splits the rendered HTML on that marker.
  Rationale: this replaces a regex over rendered paragraphs with a split on a marker the renderer itself emitted, and makes the separate `interactiveElement` field redundant.
  Date/Author: 2026-09-11 / Claude.

- Decision: Every visitor-facing sentence except the legal pages lives in Sanity. New singletons `homePage`, `workIndexPage` and `readingPage`; `aboutPage` reshaped; `workStory` gains `introduction`, `links`, `cover`, `evidence`, `artifacts` and `related`.
  Rationale: the audit found the homepage hero, the You Inc narrative, per-project evidence sections, category labels and alt-text overrides hard-coded in templates. The legal pages stay in templates because they are versioned with the code and edited once a year.
  Date/Author: 2026-09-11 / Claude.

- Decision: Work covers are either a Sanity image or a data-driven "figure" (a label, a title, a short list of measured facts, a footnote), rendered by one component. The three hand-built CSS diagrams (GPUShare, Home Lab, Wildfire) become figures whose facts are stored in Sanity.
  Rationale: the diagrams' value is the measured numbers, not the composition, and those numbers were hard-coded in a 415-line component. Screenshots exist for the other four stories.
  Date/Author: 2026-09-11 / Claude.

- Decision: Related content is a curated `related[]` reference field with tag-overlap fallback across posts and reports. The build-time embedding model is removed.
  Rationale: fewer than fifteen documents; downloading and running a model on every build to relate them added a network dependency and build time for no visible gain.
  Date/Author: 2026-09-11 / Claude.

- Decision: Delete the PDF proxy. PDF.js (from npm, not vendored) fetches the Sanity CDN URL directly, permitted by `connect-src https://cdn.sanity.io`.
  Rationale: the CDN sends CORS headers for the site origin (verified above). The proxy was an unauthenticated, unmetered 20 MiB-per-request stream through a function, and the `/api/*` cache rule defeated its own caching.
  Date/Author: 2026-09-11 / Claude.

- Decision: Keep Umami, the session collector, the Cal.com webhook, the nightly synthesis and `/stats`. Delete `/api/insights`. Move the visitor nonce to `sessionStorage`, minted from `crypto.randomUUID()`. Authenticate `/stats` by a one-time `?token=` that sets an HttpOnly cookie and redirects.
  Rationale: booking attribution is the one measurement the site cares about, and the code is sound. `/api/insights` duplicated what `/stats` renders. A persistent `localStorage` identifier contradicted the site's privacy posture; a per-tab value still joins a booking to the session that made it. A token in every request URL lands in history and logs.
  Date/Author: 2026-09-11 / Claude.

- Decision: CSP is emitted by Astro's stable `security.csp` as a `<meta>` element with SHA-256 hashes; the HTTP header carries only `frame-ancestors 'none'` and the other security headers. No `style=""` attributes anywhere in rendered HTML; no `'unsafe-inline'`.
  Rationale: a header and a meta policy are enforced together, so a header that named `script-src` would block the hashed inline theme script. `frame-ancestors` cannot be set from a meta element, so it stays in the header.
  Date/Author: 2026-09-11 / Claude.

- Decision: Fonts through Astro's stable `fonts` configuration with the local provider; files move to `src/assets/fonts`; `fontaine` and `fonts.css` are removed.
  Rationale: Astro 7 generates the `@font-face` rules, the metric-matched fallbacks and the preload link natively.
  Date/Author: 2026-09-11 / Claude.

- Decision: Local images through `astro:assets` `<Image>` and `<Picture>` with explicit `widths` and `sizes` and no `layout` prop; Sanity images through a `srcset` helper built on `@sanity/image-url` with `auto('format')`.
  Rationale: responsive variants, AVIF/WebP and correct dimensions are what the audit found missing. The `layout` prop is avoided because it may emit inline styles, which the CSP forbids.
  Date/Author: 2026-09-11 / Claude.

- Decision: Legacy URL policy lives only in `netlify.toml`. `src/lib/legacyRoutes.ts` and the route-level redirect and 410 branches are deleted. The `gpu-share` post's slug is renamed in Sanity to `building-a-private-ai-server-for-friends`, so the alias functions disappear.
  Rationale: the route branches could never execute in a static build, and the alias leaked into seven files. The `/posts/gpu-share` 301 already exists in `netlify.toml`.
  Date/Author: 2026-09-11 / Claude.

- Decision: Article pages are rebuilt on the editorial system: a header block, one 68ch column, tag links as text, a "Related" list under a rule, a back link to `/writing`. No table of contents, no share row, no subscribe box. The footer gains an RSS link and the header gains Reading.
  Rationale: the audit's finding 6. Posts are 2 000 to 4 500 characters; a table of contents for five headings is furniture.
  Date/Author: 2026-09-11 / Claude.

- Decision: `astro:env` declares the three public Sanity variables. Secrets (`INSIGHTS_TOKEN`, `CAL_WEBHOOK_SECRET`, `RATE_LIMIT_SALT`) are read from `process.env` in one module, `src/server/secrets.ts`.
  Rationale: the route tests import the route modules under `tsx`, where `astro:env/server` does not resolve. Keeping secrets on `process.env` keeps those tests, while the build still fails fast on a missing project id.
  Date/Author: 2026-09-11 / Claude.

- Decision: The dataset migration runs in two steps. The additive step (new fields, uploaded images, new singletons, slug rename) runs before any code ships and is harmless to the current site. The subtractive step (unset old fields, delete ghost documents) runs only after the new site is live.
  Rationale: a Sanity publish triggers a Netlify build of whatever is on `main`. If the old validator lost `graphic.alt` or the old work page lost its ghost `project` links before the new code was deployed, production would break.
  Date/Author: 2026-09-11 / Claude.

- Decision: The book recommendation form works without JavaScript. `/api/recommend` accepts JSON (returning JSON) and form-encoded bodies (returning a 303 to `/reading/sent?state=ok|limited|error`), and `src/pages/reading/sent.astro` is a small server-rendered page showing the matching message.
  Rationale: a `novalidate` form posting JSON via `fetch` is a form that does nothing when scripts fail.
  Date/Author: 2026-09-11 / Claude.

- Decision: Locale is `en-NZ` everywhere: date formatting, `og:locale` `en_NZ`, JSON-LD `inLanguage` `en-NZ`, RSS `<language>en-nz</language>`.
  Rationale: the current code mixes `en-US`, `en-NZ` and `en_NZ`. The author is in Wellington.
  Date/Author: 2026-09-11 / Claude.

- Decision: array `_key` values written by the migration are derived from position (`l0`, `f2`, `e0`, `r1`) rather than `crypto.randomUUID().slice(0, 8)`.
  Rationale: the plan requires the additive step to be re-runnable. Random keys make every re-run rewrite every array with different keys; positional keys make a re-run a true no-op.
  Date/Author: 2026-09-11 / Claude.

- Decision: the additive step lifts `aboutPage.portrait.largeCopy` to `aboutPage.largeCopy`.
  Rationale: the new schema puts `largeCopy` at the top level and the subtractive step unsets `portrait`. Without the lift the About page loses its body copy at cutover.
  Date/Author: 2026-09-11 / Claude.

- Decision: a shared `seo` object type in `src/sanity/schemaTypes/seo.ts`, referenced by all eight page singletons, rather than the inline copy each of the five surviving singletons carried.
  Rationale: the five definitions were byte-identical. The plan said to leave the older singletons "unchanged", which was about their content fields, not about keeping five copies of one object.
  Date/Author: 2026-09-11 / Claude.

- Decision: `sanitySrcSet` derives its `@sanity/image-url` builder from the asset URL rather than from the Sanity client.
  Rationale: the client imports `astro:env/server`, which the `tsx` test runner cannot resolve, and the Portable Text renderer needs the builder. The asset URL carries the project and dataset, so this keeps the module pure and testable without losing hotspot-aware cropping.
  Date/Author: 2026-09-11 / Claude.

- Decision: `netlify({ imageCDN: false })`, so local images are transformed at build time rather than per request.
  Rationale: the adapter's image CDN emitted `/.netlify/images?url=...` URLs, which are not build artifacts and which the plan's Milestone 7 acceptance contradicts. A static site gains nothing from a runtime transform and loses the immutable caching of a hashed asset.
  Date/Author: 2026-09-11 / Claude.

- Decision: import `pdfjs-dist/build/pdf.worker.min.mjs` rather than the unminified worker.
  Rationale: 2.18 MB against 1.2 MB for identical behaviour, and it is the single largest file in the build.
  Date/Author: 2026-09-11 / Claude.


## Outcomes & Retrospective


Measured on the `rewrite` branch on 2026-09-11, after the additive migration and a clean build. Compared against the Purpose section.

**Bytes shipped.** The homepage loads 8.4 KB of JavaScript in two chunks (6.0 KB shell, 2.4 KB page) and 20.9 KB of CSS: 61 KB of HTML, CSS and JavaScript in total. The plan's bar was no bundle over 20 KB. No chunk anywhere except PDF.js exceeds 6 KB. `dist/_astro` is 2.2 MB, of which 1.66 MB is PDF.js, loaded only on the two report pages. The last build of the old site opened with a 5.0 MB Studio chunk, a 1.3 MB Studio chunk and 184 KB of React DOM. `public/` went from 24 MB to 156 KB.

**CSP violations.** No page carries `'unsafe-inline'`, no built element carries a `style` attribute, and every page's `script-src` names the one inline script by SHA-256 hash. Asserted across all 38 pages by `tests/build-output.test.ts`. The browser-console confirmation is still outstanding.

**Visual consistency.** `/work/you-inc`, `/posts/building-a-private-ai-server-for-friends` and `/reports/home-lab-architectural-study` all render through `Base.astro` on one token vocabulary, with the article pages rebuilt on the editorial header. Confirmed by content spot-check; the visual pass at 375 px is outstanding.

**CMS ownership of copy.** Every visitor-facing sentence except `/privacy` and `/terms` now comes from Sanity, across eight page singletons and the content types. The three hand-built CSS diagrams became data: the home-lab, gpu-share and wildfire figures render their measured numbers out of `cover.figure.facts`.

**Test coverage of built output.** 139 tests, up from 100. 130 pass and 9 skip before a build; all 139 pass after one. The nine build-output assertions walk every built HTML file and check its canonical, its Open Graph image, every internal link and image, the absence of `style` attributes, the policy, the JSON-LD graph and the locale, plus that every redirect target exists in the build.

**Clean gates.** `astro check` reports 0 errors, 0 warnings and 0 hints across 119 files. `knip` is silent. `src` is 9,040 lines across 100 files, against a 6,000-line target the CMS-ownership decision outgrew (see Surprises).

Two things the rewrite found that the audit had not: the migration as planned would have left both post covers without the alt text its own schema requires, and it would have destroyed the About page's body copy by unsetting the `portrait` object that `largeCopy` was nested inside. One was build-breaking and the other content-destroying, and neither was visible from the audit.

**Not yet done.** The browser-dependent checks listed under Milestone 4, Lighthouse, the two Cloudflare settings, the hosted Studio deploy, and the subtractive migration.


## Context and Orientation


This repository is the personal website of Hamish Burke, a software developer in Wellington, New Zealand. It is built with Astro (a static site generator that renders `.astro` component files to HTML at build time), takes its content from Sanity (a hosted content database queried with a language called GROQ), and is deployed to Netlify (static hosting with serverless functions and a key-value blob store). Cloudflare sits in front of Netlify as the DNS and CDN layer. The package manager is pnpm, the Node version is 22.

Every content page is prerendered: the build fetches from Sanity and writes HTML files. Only a few routes run on request, and they say so by exporting `prerender = false`. A publish in Sanity Studio reaches the live site only when a Netlify build hook (configured in Netlify and Sanity, not in this repository) triggers a rebuild.

The rewrite happens in this same repository, on a branch called `rewrite`, in a git worktree so `main` keeps building. The old files remain readable in the worktree until the milestone that deletes them, and this plan tells you when to copy a value out of an old file before removing it. Paths below are relative to the repository root unless stated. Milestone 1 moves the old `src/` and `tests/` trees to `legacy-src/` and `legacy-tests/`; wherever this plan says to port, copy or read something from an old path under `src/` or `tests/`, read it from the `legacy-` directory instead.

Terms used in this plan:

- "Portable Text" is Sanity's JSON format for rich text: an array of block objects, each with a `style` (`normal`, `h2`) and `children` spans. The site renders it to HTML with `@portabletext/to-html`.
- "Singleton" means a Sanity document with a fixed `_id` equal to its type name (`aboutPage`, `homePage`), so a page fetches it by id.
- "Blob store" means a named Netlify Blobs store; the site uses four: `sessions`, `session-insights`, `rate-limits` and `recommendations`. Their names must not change, because data already sits in them.
- "CSP" is the Content Security Policy, a list of allowed sources for scripts, styles, images and connections that the browser enforces.
- "Hash-only CSP" means inline scripts and styles are allowed only when their SHA-256 hash is listed, so no `'unsafe-inline'`.
- "Editorial system" means the visual language of the pages redesigned in September 2026: `src/pages/index.astro`, `src/pages/work/index.astro`, `src/components/work/WorkCard.astro`, `src/components/layout/PageHeader.astro`, `src/pages/writing/index.astro`, `src/pages/reading/index.astro`, `src/pages/about.astro`. Read those files before writing any CSS; the rewrite ports their styles, it does not invent a new look.

Facts about the current dataset that the plan relies on, established on 2026-09-11:

- Posts (3), all with `markdownBody`, all with `excerpt`, two with `coverImage`. Slugs: `splitting-the-stack-and-making-setup-actually-work`, `gpu-share` (document id `516f451a-82b7-4879-b32a-a9ed7eba4941`, whose public URL is `/posts/building-a-private-ai-server-for-friends`), `healthagent-apple-health-data-ingestion-and-insights`. The `gpu-share` post contains the paragraph `{{interactive}}` and four untagged code fences.
- Reports (2), both PDF-only with `description` and no `body`: `wildfire-analysis-with-pyspark`, `home-lab-architectural-study`.
- Work stories (7), in `order`: `sprint-coach` (professional), `brontehf` (professional), `gpu-share`, `you-inc`, `health-agent`, `home-lab`, `wildfire-pyspark` (all independent). All have a Portable Text `body` of 8 to 14 blocks using only `normal` and `h2` styles and no marks. None has `introduction` or `narrative`. Each has `graphic.kind` and `graphic.alt`, `primaryArtifact` and `supportingArtifacts`.
- Ghost `project` documents (6): `project-sprint-coach` (link `https://sprintcoach.co.nz`), `8f62542e-b690-436a-9f64-4afc6d360ee1` brontehf (link `https://brontehf.nz`), `dbee0438-fde5-4551-b022-b4c84cbd0728` gpu-share (link `https://gpu-share.vercel.app/login`, github `https://github.com/Slaymish/GPUShare`), `project-you-inc` (link `https://youinc.net`, github `https://github.com/Slaymish/YouInc`), `8b6d46f3-c1d1-451d-b199-b3accb05c6d6` health-agent (link `https://health.hamishburke.dev`, github `https://github.com/Slaymish/HealthAgent`), `2e0b3cc1-9113-4a0b-8057-94d6d881333c` otto (unreferenced).
- Books (11), all with covers and notes.
- Singletons present: `aboutPage`, `cvPage`, `writingIndexPage`, `contactPage`, `notFoundPage`, `siteSettings`, plus retired `homePage`, `workIndexPage`, `projectsIndexPage`, and one `aphorism` document.
- Tags in use: `health`, `data-engineering`, `web-app`, `AI`, `self-hosted`, `ollama`, `cloudflare`, `BigData`, `PySpark`, `Hadoop`, `Research`, `architecture`, `infrastructure`, `devops`, `update`.
- Assets: 15 images (14 referenced), 4 files.

Facts about the deployment that must not change:

- Public URLs: `/`, `/work`, `/work/[slug]`, `/writing`, `/posts/[slug]`, `/reports/[slug]`, `/tags/[tag]`, `/reading`, `/about`, `/cv`, `/cv.pdf`, `/contact`, `/privacy`, `/terms`, `/rss.xml`, `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/site.webmanifest`, `/410.html`; private `/stats`; API `/api/collect` (POST), `/api/cal-webhook` (POST), `/api/recommend` (POST). `/api/pdf` and `/api/insights` are retired by this plan and get 410 rules.
- Redirect rules (all in `netlify.toml`, all `force = true`), listed in full in Milestone 1.
- Sanity project `qnuj1c4o`, dataset `production`, API version `2024-01-01`.
- Environment: build `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_VERSION`; Netlify runtime `INSIGHTS_TOKEN`, `CAL_WEBHOOK_SECRET`, `RATE_LIMIT_SALT`, `ANTHROPIC_API_KEY`; local scripts `SANITY_API_TOKEN`.
- Umami website id `3b77a67f-19f6-4f3c-a7ab-8af0d58bfbc6`. Booking URL `https://cal.com/hamishburke/30min`. Contact email `hamishapps@gmail.com`. Profiles: `https://github.com/Slaymish`, `https://www.linkedin.com/in/hamish-burke-2301669a`, `https://twitter.com/Slaymishh` (handle `@Slaymishh`), `https://instagram.com/hamishburke.studio`.

Content rules from `AGENTS.md` that apply to every string the plan writes: UK English, no em dashes in site copy, no "what I'd do differently" candour framing, colour tokens used whole with no opacity modifiers.


## Plan of Work


The work is nine milestones. Each ends with something you can run and observe. The first prepares data without touching code; the next seven build the new site in dependency order (configuration, shell, content layer, pages, server routes, crawl endpoints, assets, tests and docs); the last cuts over.


### Milestone 0: Prepare the worktree and the dataset


Goal: a branch to build in, a backup of the content, and the dataset carrying every new field the new code will read, while the current site keeps working.

Create the worktree. From the repository root run `git worktree add ../astro-blog-rewrite -b rewrite` and do all further work in `../astro-blog-rewrite`. Copy `.env` across (`cp .env ../astro-blog-rewrite/.env`); it is gitignored.

Export the dataset before any write. In `studio-production/` run `pnpm exec sanity dataset export production ../.sanity-backups/production-2026-09-11-pre-rewrite.tar.gz`. The `.sanity-backups/` directory is gitignored. Do not proceed until the archive exists and is larger than 100 KB.

Write the migration script at `scripts/migrate-2026-09.ts`. It has two modes selected by the first argument, `additive` and `subtractive`, and a `--dry-run` flag that prints every mutation as JSON and writes nothing. It uses `@sanity/client` with `SANITY_API_TOKEN`, `useCdn: false`, and commits one transaction per mode. The repository hook `.claude/hooks/guard-destructive.sh` blocks scripts that write to production until the command carries `SANITY_WRITE_ACK=1`; Hamish runs the write. The script must be idempotent: every `set` is absolute, every `unset` tolerates the field being absent, image uploads check for an existing asset by `originalFilename` first (`*[_type=="sanity.imageAsset" && originalFilename==$name][0]._id`) and reuse it.

The additive mode performs these mutations, in one transaction:

1. Patch post `516f451a-82b7-4879-b32a-a9ed7eba4941`: set `slug.current` to `building-a-private-ai-server-for-friends`; set `markdownBody` to the current value with the single occurrence of `{{interactive}}` replaced by `{{gpu-calculator}}`.

2. Upload six images from `public/images/` and remember their asset ids: `work/sprint-coach-home.webp`, `work/sprint-coach-contact.webp`, `work/bronte-projects.webp`, `work/bronte-cms.webp`, `work/youinc-demo-dashboard.png`, `posts/status_screenshot.png`.

3. For each work story (matched by `slug.current`), set `introduction`, `links`, `cover`, `evidence` (two stories) and `artifacts`, and set `kind` to `research` for `wildfire-pyspark`. The values:

   sprint-coach: introduction "Nathan’s coaching business grew by word of mouth. His first website needed to show athletes and parents who they would be training with, and make the next step easy." links `[{label: "Visit site", href: "https://sprintcoach.co.nz", external: true}]`. cover `{kind: "image", image: <sprint-coach-home asset>, alt: <the story's current graphic.alt>}`. evidence `[{image: <sprint-coach-contact asset>, alt: "The Sprint Coach enquiry form, with name, email, enquiry type, and message fields beside the coach’s contact details.", label: "Enquiry flow", heading: "The one moving part on a static site", caption: "Every page is prerendered. The enquiry form is the only route that reaches a server, sending notification and confirmation email over authenticated SMTP."}]`. artifacts `[]`.

   brontehf: introduction "Brontë brought the design. I built a portfolio they could keep updating themselves, with an editing workflow that preserves their visual direction." links `[{label: "Visit site", href: "https://brontehf.nz", external: true}]`. cover image `<bronte-projects asset>`, alt "BrontëHF’s public projects page showing a filterable grid of portfolio work." evidence `[{image: <bronte-cms asset>, alt: "The BrontëHF project editor beside a live preview of the Tei project page.", label: "Publishing workflow", heading: "Edit and preview in one place", caption: "Project content can be edited while checking the published result in the same workspace."}]`. artifacts `[]`.

   gpu-share: introduction "My desktop GPU sits idle most of the day. I built a way for friends to share it for local AI and rendering, with the limits of a home machine visible." links `[{label: "Visit site", href: "https://gpu-share.vercel.app/login", external: true}, {label: "Source code", href: "https://github.com/Slaymish/GPUShare", external: true}]`. cover `{kind: "figure", alt: "Two layers: an always-on cloud layer holding accounts, ledger and invoices, and a home GPU host running Ollama and Blender that connects outbound through a tunnel with no open ports. Pricing is derived from electricity rate multiplied by GPU wattage.", figure: {label: "Idle GPU, billed at cost", title: "Two services, one trust boundary", facts: [{label: "Always on", value: "Accounts · ledger · invoices", note: "Reachable with your PC off"}, {label: "Outbound tunnel", value: "No open ports", note: "The host connects out; nothing connects in"}, {label: "Your machine", value: "Ollama · Blender", note: "Only while powered on"}], footnote: "kWh rate × GPU watts = price. No markup."}}`. artifacts: the two posts currently in `supportingArtifacts`, in that order (references to `516f451a-82b7-4879-b32a-a9ed7eba4941` and `913864e1-beae-4536-8f6c-a100adb70030`).

   you-inc: introduction "I wanted one view of what I own, owe, earn and spend. I built a finance product around a ledger, then removed the SaaS layer so it could belong to the person running it." links `[{label: "Try demo", href: "https://youinc.net", external: true}, {label: "Source code", href: "https://github.com/Slaymish/YouInc", external: true}]`. cover image `<youinc-demo-dashboard asset>`, alt "You Inc dashboard with sample cashflow, income, expenses and recurring payments." Also replace `body` with six Portable Text blocks (each block `{_type: "block", _key: <unique>, style, markDefs: [], children: [{_type: "span", _key: <unique>, marks: [], text}]}`), alternating `h2` and `normal`: "A ledger before a dashboard" / "I wanted a coherent view of what I own, owe, earn and spend. That needed a real accounting model underneath. Synced transactions enter a double-entry ledger where every posting must balance; cashflow, net worth and runway are different views of the same data." then "Make uncertainty visible" / "Rules route known transactions. Anything uncertain stays in suspense for review instead of quietly disappearing or being treated as a confident classification. Akahu bank sync feeds the ledger, with credentials encrypted in Supabase Vault and kept out of the browser." then "Taking the SaaS layer out" / "The first version had accounts, paid plans and billing. But holding other people’s bank credentials brought an obligation that went well beyond building a useful finance tool. I removed the commercial layer and made You Inc self-hosted and MIT licensed. The person running it supplies their own database and Akahu credentials." Set `resultHeading` to "Where it stands". artifacts `[]`.

   health-agent: introduction "My nutrition and activity lived in different apps. I brought their Apple Health exports together so I could see the trends in one place." links `[{label: "Visit site", href: "https://health.hamishburke.dev", external: true}, {label: "Source code", href: "https://github.com/Slaymish/HealthAgent", external: true}]`. cover image `<status_screenshot asset>`, alt "The HealthAgent status view: daily trends and projections built from Apple Health exports." artifacts: reference to post `08be16cc-8610-4145-96dc-88582ac28de0`.

   home-lab: introduction "What would happen if I lost the machine running my home services? I built a small server around that question, then tested a full recovery." links `[]`. cover `{kind: "figure", alt: "A single 8GB Raspberry Pi reached by two separate paths: a Cloudflare Tunnel for public services and Tailscale for admin services. 7.26 of 8GB of memory is allocated, and a disaster recovery restore was measured at 1 hour 45 minutes against a 2 hour target.", figure: {label: "One 5W host, two doors", title: "Raspberry Pi 4 · 8GB", facts: [{label: "Public", value: "Cloudflare Tunnel", note: "Photos · files · calendar"}, {label: "Admin", value: "Tailscale", note: "SSH · Postgres · SMB"}, {label: "Memory", value: "7.26 GB allocated", note: "9.25% headroom"}, {label: "Restore tested", value: "1h 45m", note: "Under a 2h target"}], footnote: ""}}`. artifacts: reference to report `8b2b8d26-cbbe-462a-abb1-c5f34078f13a`.

   wildfire-pyspark: kind `research`. introduction "A model can look accurate while missing the fires that matter most. I explored that problem across 1.88 million wildfire records." links `[]`. cover `{kind: "figure", alt: "Recorded random-forest results: class G recall rose from zero to 0.7518 with weighting; class G precision was 0.0099 and overall accuracy was 32 percent.", figure: {label: "PySpark experiment", title: "1.88M records", facts: [{label: "Class G recall", value: "0 → 0.7518", note: "With class weighting"}, {label: "Weighted class G precision", value: "0.0099", note: ""}, {label: "Weighted overall accuracy", value: "32%", note: ""}], footnote: "Recorded random-forest results. Class weighting finds more rare fires, with many more false positives."}}`. artifacts: reference to report `64644895-0cdc-4c42-a73f-171531516fc4`.

   Every array item written to Sanity needs a `_key` (any unique string; use `crypto.randomUUID().slice(0, 8)`). Image references are `{_type: "image", asset: {_type: "reference", _ref: <asset id>}}`. Document references are `{_type: "reference", _ref: <id>, _key: <key>}`.

4. `createOrReplace` the `homePage` singleton with: `_id: "homePage"`, `_type: "homePage"`, `seo: {title: "Hamish Burke", description: "Software, small systems, and the decisions behind them. Selected work and writing by Hamish Burke in Wellington."}`, `eyebrow: "Software developer · Wellington, NZ"`, `heading: "Hamish Burke"`, `lede: "I build software, from a coach’s first website to tools I run on my own hardware."`, `intro: "I’m interested in what makes a system useful, what it takes to keep it running, and when to make it smaller."`, `aboutLabel: "About me"`, `featured: [ref you-inc, ref sprint-coach, ref home-lab]` (references to the three `workStory` ids, looked up by slug), `leadLinkLabel: "Why I took the SaaS layer out"`, `moreWorkHeading: "More work"`, `allWorkLabel: "All work"`, `writingLabel: "Writing"`, `writingEntry: ref post 516f451a-82b7-4879-b32a-a9ed7eba4941`, `writingBlurb: "A GPU for friends sounds simple. Here’s what happens when accounts, costs, and a machine that sometimes switches off enter the picture."`, `writingLinkLabel: "Read the story"`, `allWritingLabel: "All writing"`, `readingLabel: "Reading"`, `readingText: "I’m trying to make more time for reading, the piano, and being away from a screen."`, `readingLinkLabel: "On my bookshelf"`.

5. `createOrReplace` `workIndexPage`: `seo: {title: "Work", description: "Client websites, independent software, and research by Hamish Burke."}`, `hero: {eyebrow: "Work", headlineLines: ["Things I’ve made."], intro: "Client websites, independent software, and research."}`.

6. `createOrReplace` `readingPage`: `seo: {title: "Reading", description: "What Hamish Burke is reading, has read, and hopes to read next."}`, `eyebrow: "Reading"`, `headline: "Books."`, `quote: {text: "Tell me what you read and I'll tell you who you are.", attribution: "François Mauriac"}`, `groups: {reading: "Reading now", toRead: "Next", read: "Read"}`, `recommend: {lead: "Read something I should have? Tell me what to pick up next.", placeholder: "A book you think I'd get something out of", button: "Recommend me a book", empty: "Need a title to go on, even a rough one.", sending: "Sending it over.", error: "That didn't go through, so give it one more try or just email it to me.", limited: "You've sent me a few already, thanks. Email me the rest and I'll go through them properly.", success: "Got it, thanks. If you want to tell me how you came across it, or what it triggered for you, email me, as the title on its own only tells me so much and the story behind a recommendation is the part I actually enjoy."}`.

7. Patch `aboutPage`: set `eyebrow: "About"`, `heading: "Hi, I’m Hamish."`, `intro: <current hero.intro>`, `portraitAlt: <current portrait.imageAlt>`, `projects: [{heading: "Taking the SaaS layer out of You Inc", body: "I built the accounts, plans and billing around You Inc, then took them all back out again. Running a finance service meant I was taking responsibility for other people’s bank credentials, and once I actually sat with that, a tool people could run themselves on their own machine made a lot more sense.", link: {label: "The You Inc story", href: "/work/you-inc"}}, {heading: "Running a server at home", body: "Got into running a server at home (and a GPU a few of us share) as it keeps handing me concrete questions I don’t get from work, like how you actually recover a machine, who can reach it from outside, and what happens when it just switches off one day.", link: {label: "Testing a full recovery", href: "/work/home-lab"}}]`, and `background.links` to the current list without the `/projects` entry (labels keep their text but drop the trailing arrow glyphs; the component draws arrows).

8. Patch `notFoundPage.suggestions` to the current list without the `/projects` entry. Patch `contactPage.channels[_key=="github"].note` to "Most of what is on the work page has source behind it."

Do not unset anything and do not delete anything in additive mode. One interim effect is accepted: until the new site is live, the current site renders the literal text `{{gpu-calculator}}` in place of the calculator on the GPU post, because its splitter looks for `{{interactive}}`. The current site ignores unknown fields, its validator still finds `graphic.alt`, and its work page still finds the ghost `project` links.

The subtractive mode (run in Milestone 9 only) performs, in one transaction: for every `workStory`, `unset` `status`, `service`, `metric`, `problem`, `interventions`, `question`, `built`, `learned`, `differently`, `graphic`, `primaryArtifact`, `supportingArtifacts`, `narrative`; for every `post`, `unset` `body`, `interactiveElement`; for `aboutPage`, `unset` `hero`, `portrait`, `capabilities`, `contactHeading`; for `siteSettings`, `unset` `header`, `footer`; delete every document with `_type` in `project`, `aphorism`, `projectsIndexPage`. The export from the start of this milestone is the archive of everything unset.

Run `pnpm exec tsx --env-file=.env scripts/migrate-2026-09.ts additive --dry-run` and read the printed mutations against the list above. Then hand the write to Hamish: `SANITY_WRITE_ACK=1 pnpm exec tsx --env-file=.env scripts/migrate-2026-09.ts additive`.

Acceptance: `*[_type=="post" && slug.current=="building-a-private-ai-server-for-friends"][0].markdownBody match "*{{gpu-calculator}}*"` returns true; `count(*[_type=="workStory" && defined(introduction) && defined(cover) && defined(links)])` returns 7; `*[_id=="homePage"][0].featured[0]->slug.current` returns `you-inc`; `*[_type=="workStory" && slug.current=="wildfire-pyspark"][0].kind` returns `research`; the current site still builds on `main` (`pnpm run build` in the main worktree succeeds).


### Milestone 1: Manifests and configuration


Goal: a project that installs and type-checks with the new dependency set, before any page exists.

Rename `studio-production/` to `studio/` (`git mv`). Replace its symlinked `package.json` with a real one:

    {
      "name": "hamishburke-studio",
      "private": true,
      "type": "module",
      "scripts": {
        "dev": "sanity dev",
        "build": "sanity build",
        "deploy": "sanity deploy"
      },
      "dependencies": {
        "@sanity/vision": "^6.12.0",
        "react": "^19.2.8",
        "react-dom": "^19.2.8",
        "sanity": "^6.12.0",
        "styled-components": "^6.5.3"
      }
    }

Keep `studio/sanity.config.ts` and `studio/sanity.cli.ts` as they are except the schema import path, which stays `../src/sanity/schemaTypes`. Delete the root `sanity.config.ts`; nothing will import it. Replace `pnpm-workspace.yaml` with:

    packages:
      - studio
    allowBuilds:
      '@parcel/watcher': true
      esbuild: true
      sharp: true

Replace the root `package.json` with:

    {
      "name": "hamishburke-dev",
      "private": true,
      "type": "module",
      "engines": { "node": ">=22.12.0" },
      "scripts": {
        "dev": "astro dev",
        "build": "astro check && astro build",
        "preview": "astro preview",
        "test": "tsx --test tests/*.test.ts",
        "check": "astro check && pnpm exec knip",
        "studio:dev": "pnpm --filter hamishburke-studio dev",
        "studio:build": "pnpm --filter hamishburke-studio build",
        "studio:deploy": "pnpm --filter hamishburke-studio deploy",
        "icons": "node scripts/generate-icons.mjs",
        "migrate": "tsx --env-file=.env scripts/migrate-2026-09.ts"
      },
      "dependencies": {
        "@astrojs/netlify": "^8.2.5",
        "@netlify/blobs": "^10.7.13",
        "@portabletext/to-html": "^6.0.0",
        "@sanity/client": "^7.27.0",
        "@sanity/image-url": "^2.1.1",
        "astro": "^7.3.1",
        "pdfjs-dist": "^6.3.289",
        "rehype-slug": "^6.0.0",
        "rehype-stringify": "^10.0.1",
        "remark-gfm": "^4.0.1",
        "remark-parse": "^11.0.0",
        "remark-rehype": "^11.1.2",
        "unified": "^11.0.5"
      },
      "devDependencies": {
        "@anthropic-ai/sdk": "^0.124.0",
        "@astrojs/check": "^0.9.10",
        "@netlify/functions": "^6.0.0",
        "knip": "^6.34.0",
        "node-html-parser": "^7.0.1",
        "sanity": "^6.12.0",
        "sharp": "^0.35.4",
        "tsx": "^4.23.13",
        "typescript": "^6.0.3"
      }
    }

`sanity` is a devDependency of the root only because `src/sanity/schemaTypes/*.ts` import `defineType` and `astro check` type-checks those files; nothing in the site bundle imports it. `@anthropic-ai/sdk` and `@netlify/functions` are devDependencies because Netlify bundles the scheduled function itself. `sharp` is used by Astro's image service and by `scripts/generate-icons.mjs`. Do not add `github-slugger`: headings in Portable Text get ids from a slug function in `src/content/portableText.ts` (defined in Milestone 3), and markdown headings get them from `rehype-slug`.

Delete `astro.config.dev.ts`, `astro.config.shared.ts`, `tailwind.config.cjs`, `freelance_pricing_guide.pdf` and `todo.md`. Write `astro.config.ts`:

    import { defineConfig, envField, fontProviders } from 'astro/config';
    import netlify from '@astrojs/netlify';

    const geistUnicodeLatin = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';

    export default defineConfig({
      site: 'https://hamishburke.dev',
      output: 'static',
      adapter: netlify(),
      build: { format: 'file' },
      trailingSlash: 'never',
      compressHTML: true,
      prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
      env: {
        schema: {
          SANITY_PROJECT_ID: envField.string({ context: 'server', access: 'public' }),
          SANITY_DATASET: envField.string({ context: 'server', access: 'public', default: 'production' }),
          SANITY_API_VERSION: envField.string({ context: 'server', access: 'public', default: '2024-01-01' }),
        },
      },
      image: {
        remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
      },
      fonts: [
        {
          provider: fontProviders.local(),
          name: 'Geist',
          cssVariable: '--font-geist',
          fallbacks: ['system-ui', 'sans-serif'],
          options: {
            variants: [
              { src: ['./src/assets/fonts/geist-latin-wght-normal.woff2'], weight: '100 900', style: 'normal', display: 'swap', unicodeRange: [geistUnicodeLatin] },
              { src: ['./src/assets/fonts/geist-latin-ext-wght-normal.woff2'], weight: '100 900', style: 'normal', display: 'swap' },
            ],
          },
        },
        {
          provider: fontProviders.local(),
          name: 'Instrument Serif',
          cssVariable: '--font-instrument',
          fallbacks: ['Georgia', 'serif'],
          options: {
            variants: [
              { src: ['./src/assets/fonts/instrument-serif-latin-400-normal.woff2'], weight: 400, style: 'normal', display: 'swap' },
              { src: ['./src/assets/fonts/instrument-serif-latin-ext-400-normal.woff2'], weight: 400, style: 'normal', display: 'swap' },
            ],
          },
        },
        {
          provider: fontProviders.local(),
          name: 'JetBrains Mono',
          cssVariable: '--font-jetbrains',
          fallbacks: ['ui-monospace', 'monospace'],
          options: {
            variants: [
              { src: ['./src/assets/fonts/jetbrains-mono-latin-400-normal.woff2'], weight: 400, style: 'normal', display: 'swap' },
              { src: ['./src/assets/fonts/jetbrains-mono-latin-500-normal.woff2'], weight: 500, style: 'normal', display: 'swap' },
            ],
          },
        },
      ],
      security: {
        csp: {
          directives: [
            "default-src 'self'",
            "base-uri 'self'",
            "object-src 'none'",
            "form-action 'self'",
            "img-src 'self' data: https://cdn.sanity.io",
            "font-src 'self'",
            "connect-src 'self' https://cloud.umami.is https://gateway.umami.is https://cdn.sanity.io",
            "worker-src 'self' blob:",
            "media-src 'self'",
            "manifest-src 'self'",
            'upgrade-insecure-requests',
          ],
          scriptDirective: { resources: ["'self'", 'https://cloud.umami.is'] },
          styleDirective: { resources: ["'self'"] },
        },
      },
    });

The latin-ext font files exist under `public/fonts/` today and are moved to `src/assets/fonts/` in Milestone 7; until then the build will fail on the font paths, which is expected. To build during Milestones 2 to 6, copy the eight `.woff2` files into `src/assets/fonts/` now with `mkdir -p src/assets/fonts && cp public/fonts/*.woff2 src/assets/fonts/`, and remove `public/fonts/` in Milestone 7. The `unicodeRange` for the latin-ext variants is the one in `public/fonts`' companion `src/design-system/fonts.css`; copy the `U+0100-02BA,...` string from there into a second constant and pass it to those variants so a Latin-only page downloads one file per family.

Write `netlify.toml`:

    [build]
      publish = "dist"
      command = "pnpm run build"

    [build.environment]
      NODE_VERSION = "22"
      SANITY_PROJECT_ID = "qnuj1c4o"
      SANITY_DATASET = "production"
      SANITY_API_VERSION = "2024-01-01"

    [[headers]]
      for = "/_astro/*"
      [headers.values]
        Cache-Control = "public, max-age=31536000, immutable"

    [[headers]]
      for = "/*"
      [headers.values]
        Cache-Control = "public, max-age=0, must-revalidate"
        Content-Security-Policy = "frame-ancestors 'none'"
        Strict-Transport-Security = "max-age=31536000; includeSubDomains"
        X-Content-Type-Options = "nosniff"
        Referrer-Policy = "strict-origin-when-cross-origin"
        Permissions-Policy = "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
        Cross-Origin-Opener-Policy = "same-origin"
        Cross-Origin-Resource-Policy = "same-origin"

    [[headers]]
      for = "/api/*"
      [headers.values]
        Cache-Control = "no-store"

    [[headers]]
      for = "/stats"
      [headers.values]
        Cache-Control = "no-store"

Then the redirect rules, every one with `status` and `force = true` in the `[[redirects]]` table form used today (four lines: `from`, `to`, `status`, `force`):

    301  /projects                                  -> /work
    301  /tools                                     -> /work
    301  /projects/sprint-coach                     -> /work/sprint-coach
    301  /projects/brontehf                         -> /work/brontehf
    301  /projects/you-inc                          -> /work/you-inc
    301  /projects/gpu-share                        -> /work/gpu-share
    301  /projects/health-agent                     -> /work/health-agent
    301  /posts/gpu-share                           -> /posts/building-a-private-ai-server-for-friends
    410  /projects/bedroom-layout-designer          -> /410.html
    410  /projects/drop-eta                         -> /410.html
    410  /projects/otto                             -> /410.html
    410  /projects/piano-improvisation-helper       -> /410.html
    410  /projects/wiki-router                      -> /410.html
    410  /reports/a-survey-of-nosql-databases-and-polyglot-persistence-patterns -> /410.html
    410  /api/pdf                                   -> /410.html
    410  /api/insights                              -> /410.html
    301  http://hamishburke.dev/*                   -> https://hamishburke.dev/:splat
    301  https://www.hamishburke.dev/*              -> https://hamishburke.dev/:splat

The `X-Frame-Options` header is dropped because `frame-ancestors` supersedes it. The full CSP moves into each page's `<meta>` element, emitted by Astro; a header that also named `script-src` would be enforced alongside the meta policy and would block the hashed inline theme script.

Write `tsconfig.json` (unchanged apart from the exclude list: `dist`, `studio`, `legacy-src`, `legacy-tests`, `node_modules`), `src/env.d.ts` containing only `/// <reference types="astro/client" />`, and `knip.json`:

    {
      "$schema": "https://unpkg.com/knip@latest/schema.json",
      "entry": ["src/client/shell.ts", "netlify/functions/*.mts", "scripts/*.{ts,mjs}", "studio/sanity.config.ts", "studio/sanity.cli.ts"],
      "ignore": ["legacy-src/**", "legacy-tests/**"],
      "ignoreDependencies": ["sanity"],
      "workspaces": { ".": {}, "studio": { "entry": ["sanity.config.ts", "sanity.cli.ts"] } }
    }

Move the old source aside rather than deleting it, so later milestones can read it: `git mv src legacy-src && git mv tests legacy-tests`, then `mkdir -p src/sanity && git mv legacy-src/sanity/schemaTypes src/sanity/schemaTypes` (the schemas are rewritten in place in Milestone 3). Astro only reads `src/`; add `legacy-src` and `legacy-tests` to the `exclude` list in `tsconfig.json` and to `ignore` in `knip.json`. Both directories are deleted at the end of Milestone 8. Delete `scripts/seed-page-copy.ts`, `scripts/seed-book-notes.ts`, `scripts/convert-png-to-webp.js`, `scripts/update-references.js`. Keep `netlify/functions/session-insights.mts` for now; its imports are repointed in Milestone 5. Keep `public/` for now; it is pruned in Milestone 7.

Run `pnpm install` (this changes the lockfile, which is expected and is the only time the plan does so). Acceptance: `pnpm install` completes with no peer warnings about React from the root package, `ls node_modules/react` fails at the root (React exists only under `studio/node_modules`), and `pnpm --filter hamishburke-studio exec sanity --version` prints a version.


### Milestone 2: Styles, the base layout and the client shell


Goal: a homepage placeholder that builds with a hash-only CSP, the three fonts, both themes and no console violations.

Create `src/styles/tokens.css` with exactly the primitive values from the current `src/design-system/tokens.css` (the `--color-ink-*`, `--color-paper-*`, `--color-line-*`, `--color-signal-*`, spacing, type, radius, shadow, motion, layout and icon custom properties), with two changes: the font stacks become `--font-sans: var(--font-geist)`, `--font-serif: var(--font-instrument)`, `--font-mono: var(--font-jetbrains)` (the three variables Astro's `<Font>` component defines), and the four legacy aliases (`--bg`, `--surface`, `--text`, `--accent` and their siblings) are not carried over.

Create `src/styles/themes.css` with the `.dark` and `.light` blocks from `src/design-system/themes/*.css`, keeping only the `--color-*` role properties plus `color-scheme`. Add `html { background: var(--color-bg-canvas); color: var(--color-text-primary); }` at the top of `src/styles/base.css` so the first paint uses the theme class the boot script has already set.

Create `src/styles/base.css` from `src/design-system/base.css`: box-sizing, body typography, `:focus-visible` ring (once), skip link, reduced-motion block (once), heading and paragraph defaults, link defaults, image defaults, `.sr-only`. Remove the `a:hover { opacity }` rule and every `!important`.

Create `src/styles/primitives.css` as a copy of `src/design-system/primitives.css` with the two comment blocks about Tailwind and React removed. Create `src/styles/prose.css` from the `.prose` section of `src/styles/globals.css`, rewritten onto the `--color-*` roles, without the `p:first-of-type` lede rule (the article header carries the lede), without KaTeX rules, with `pre` and `code` styled on `--color-bg-inset`, `--color-stroke-subtle` and `--font-mono`, and with `.code-copy-btn` kept. Replace every hex colour outside `tokens.css` with a token; the audit lists the offenders (`#ff3d3d`, `#3dd8ff`, `#c5c1b8`, `#efece4`, `#111713`, `#ef4444`, `rgb(7 9 8 / 88%)`). The Logo's glitch colours are dropped with the glitch animation; the logo keeps the 450 ms enter animation only.

Create `src/site/config.ts` exporting the constants from the current `src/lib/site.ts` (`SITE_URL`, `SITE_NAME`, `SITE_DESCRIPTION`, `SITE_AUTHOR`, `CONTACT_EMAIL`, `BOOKING_URL`, `SOCIAL_PROFILES` as a named object `{ github, linkedin, twitter, instagram }`, `TWITTER_HANDLE`, `UMAMI_WEBSITE_ID`, `LOCALE = 'en-NZ'`, `TIMEZONE = 'Pacific/Auckland'`) plus `absoluteUrl` and `publicPathFromAstro` exactly as they are today (the latter strips `/index.html` and `.html` from `Astro.url.pathname`, which Astro sets to the output filename under `build.format: 'file'`).

Create `src/site/seo.ts` exporting `buildMetadata(input)` where `input` is `{ title, description, path, image?, article?: { publishedAt, updatedAt?, tags, kind: 'post' | 'report' | 'work' }, robots?, breadcrumbs?: Array<{ name, path }> }` and the return is `{ fullTitle, canonical, ogImage, jsonLd }`. `fullTitle` is the title alone when it equals `SITE_NAME`, otherwise `${title} | ${SITE_NAME}`. `canonical` is `absoluteUrl(path)`. `ogImage` is the absolute URL of `image` when given, else of `/og-default.png`. `jsonLd` is one object `{ "@context": "https://schema.org", "@graph": [...] }` containing exactly: a `Person` (`@id` `/#person`, name, `alternateName` "Slaymish", url, `image` `/apple-touch-icon.png`, `jobTitle` "Software developer", `sameAs` the four profile URLs), a `WebSite` (`@id` `/#website`, publisher the person, `inLanguage` `en-NZ`), either a `BlogPosting` (posts), `Report` (reports) or `CreativeWork` (work stories) with `headline`, `description`, `url`, `author` and `publisher` the person, `image`, `datePublished`, `dateModified` when present, `keywords` when tags exist, `mainEntityOfPage` the canonical, or for non-articles a `WebPage` with `isPartOf` the website; and one `BreadcrumbList` built from `breadcrumbs` (always starting with Home; omitted when `breadcrumbs` is empty). There is exactly one JSON-LD script per page and it is this object.

Create `src/client/themeBoot.ts` exporting a single string constant `THEME_BOOT` containing this script, minified by hand and never changed without re-reading the CSP section of this plan:

    (function(){var r=document.documentElement,s=null;try{s=localStorage.getItem('theme')}catch(e){}var l=window.matchMedia('(prefers-color-scheme: light)').matches,t=s==='light'||s==='dark'?s:(l?'light':'dark');r.classList.remove('light','dark');r.classList.add(t);r.dataset.themeSource=s?'user':'system';r.style.colorScheme=t;})();

Setting `r.style.colorScheme` from script is allowed under a hash-only CSP (the policy restricts `style` attributes in markup, not CSSOM writes).

Create `src/layouts/Base.astro`. Its frontmatter imports the five stylesheets in the order tokens, themes, base, primitives, prose; imports `Font` from `astro:assets`; imports `buildMetadata`; imports `THEME_BOOT`; computes `const hash = 'sha256-' + createHash('sha256').update(THEME_BOOT).digest('base64')` with `createHash` from `node:crypto`; calls `Astro.csp.insertScriptHash(hash)`; and takes props `{ title, description, path?, image?, article?, robots?, breadcrumbs? }` passing them to `buildMetadata` (path defaults to `publicPathFromAstro(Astro.url)`). Its markup is:

    <!doctype html>
    <html lang="en-NZ" class="dark">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script is:inline set:html={THEME_BOOT} />
        <title>{meta.fullTitle}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={meta.canonical} />
        <meta name="color-scheme" content="dark light" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0b0d0c" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#f6f7f3" />
        <Font cssVariable="--font-geist" preload />
        <Font cssVariable="--font-instrument" />
        <Font cssVariable="--font-jetbrains" />
        (Open Graph: og:type article|website, og:url, og:title, og:description, og:image, og:site_name, og:locale en_NZ; Twitter: card summary_large_image, site and creator @Slaymishh, title, description, image; article:published_time, article:modified_time and article:tag when article)
        <meta name="robots" content={robots ?? 'index, follow, max-image-preview:large'} />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="alternate" type="application/rss+xml" title="Hamish Burke" href="/rss.xml" />
        <script is:inline type="application/ld+json" set:html={JSON.stringify(meta.jsonLd)} />
        <script is:inline defer src="https://cloud.umami.is/script.js" data-website-id={UMAMI_WEBSITE_ID}></script>
      </head>
      <body>
        <a class="skip-link" href="#main">Skip to content</a>
        <Header />
        <main id="main" class:list={['site-main', wide && 'site-main--wide']} tabindex="-1"><slot /></main>
        <Footer />
        <script>import { initShell } from '../client/shell'; initShell();</script>
      </body>
    </html>

No `hreflang` links, no `googlebot` meta, no `X-UA-Compatible`, no KaTeX, no preconnect to jsDelivr. The `theme-color` values are `--color-ink-950` and `--color-paper-100` from `tokens.css`; the theme toggle updates the matching meta element when the visitor chooses.

Create `src/components/Header.astro` from `src/components/layout/Header.astro` with nav links Work `/work`, Writing `/writing`, Reading `/reading`, About `/about`, and an active check that also matches `/posts/`, `/reports/` and `/tags/` to Writing. Keep the `<details>` mobile menu and the `ThemeToggle`. Create `src/components/Footer.astro`: "Hamish Burke · Wellington, New Zealand" and a nav of Email (mailto), GitHub, LinkedIn, Contact `/contact`, CV `/cv`, RSS `/rss.xml`, Privacy `/privacy`, Terms `/terms`. Create `src/components/Logo.astro` with the two path strings from the old `src/components/ui/Logo.astro`, one `<svg>` only. Create `src/components/ThemeToggle.astro` as the old markup with its inline script removed; the toggle behaviour moves into the shell.

Create `src/client/shell.ts` exporting `initShell()` that calls, in order, `initTheme()` (from `theme.ts`: binds `[data-theme-toggle]`, applies the class, persists to `localStorage`, updates the `theme-color` meta for the current scheme, and follows `prefers-color-scheme` changes while `data-theme-source` is `system`), `initBookingRef()`, `initAnalytics()`, `initCodeCopy()`, `initRecommendForm()` (no-op when `#recommend` is absent), `initWritingFilter()` (no-op when `#writing-filter` is absent). Port `analyticsTracker.ts`, `bookingRef.ts`, `codeCopy.ts` and `visitorNonce.ts` from `src/lib/shell/` with these changes: the nonce lives in `sessionStorage` under the key `visitor-nonce` and is minted as `crypto.randomUUID().replace(/-/g, '').slice(0, 16)`; the scroll handler returns early unless `window.scrollY` has crossed the next unfired milestone's pixel position; the `ANALYTICS_EVENT_NAMES` list, `MAX_EVENTS` import and the `/api/collect` beacon stay as they are. The pure functions (`createSequenceBuffer`, `scrollDepthPercent`, `sharePlatform`, `outboundDestination`, `cvEventName`) remain exported for the tests.

Create a placeholder `src/pages/index.astro` rendering `<Base title="Hamish Burke" description="placeholder"><h1>Hello</h1></Base>`. Run `pnpm run build && pnpm run preview`, open http://localhost:4321/ in a browser with the console open. Acceptance: the page renders in the system theme with Geist; toggling the theme persists across reload; the console shows no CSP violation; `grep -c "unsafe-inline" dist/index.html` prints 0; `grep -o "sha256-[A-Za-z0-9+/=]*" dist/index.html` prints at least one hash; the `<meta http-equiv="content-security-policy">` element contains `script-src 'self' https://cloud.umami.is 'sha256-…'`.


### Milestone 3: The content layer


Goal: typed, validated access to everything in Sanity, and the two renderers.

Rewrite `src/sanity/schemaTypes/`. Keep `book.ts`, `ctaLink.ts`, `cvPage.ts`, `writingIndexPage.ts`, `contactPage.ts`, `notFoundPage.ts` and `blockContent.ts` unchanged. Rewrite:

`post.ts`: fields `title` (string, required), `slug` (slug from title, required), `publishedAt` (datetime, required), `updatedAt` (datetime), `excerpt` (text, rows 3, required, max 240), `tags` (array of string), `coverImage` (image with hotspot and an `alt` string field, required when the image is set), `markdownBody` (text, rows 30, required, description "Markdown. Put {{gpu-calculator}} on its own line to place the GPU cost calculator."), `related` (array of reference to post or report, max 3).

`report.ts`: `title`, `slug`, `publishedAt`, `description` (text, required, max 300), `tags`, `pdfFile` (file, accept `.pdf`, required), `body` (blockContent, optional), `related` (array of reference to post or report, max 3).

`workStory.ts`: `title` (required, max 80), `descriptor` (required, max 60), `slug`, `kind` (radio: `professional` "Client", `independent` "Independent", `research` "Research"; required), `order` (integer, required), `date` (date, required), `timeframe` (string, max 60), `summary` (text, required, max 180), `introduction` (text, required, max 320), `role` (text, required, max 180), `body` (blockContent, required), `resultHeading` (string, max 40, description "Defaults to Outcome"), `result` (text, required, max 280), `links` (array of object `{label (required, max 30), href (url or path string, required), external (boolean)}`), `cover` (object: `kind` radio `image` | `figure`; `alt` text required max 240; `image` (image, hidden unless kind is image); `figure` (object hidden unless kind is figure: `label` string max 40, `title` string max 60, `facts` array of `{label max 40, value max 40, note max 80}` min 1 max 5, `footnote` text max 160); custom validation: image required when kind is image, figure.title and facts required when kind is figure), `evidence` (array of `{image (required), alt (required, max 240), label (max 40), heading (max 80), caption (text, max 240)}`), `artifacts` (array of reference to post or report, unique), `related` (array of reference to workStory, post or report, max 3). Preview shows title and `kind · descriptor`. Ordering by `order`.

`homePage.ts`, `workIndexPage.ts`, `readingPage.ts`, `siteSettings.ts` and `aboutPage.ts`: singletons whose fields are exactly the keys written by the migration in Milestone 0 (seo objects with `title` max 70 and `description` max 200; every string required). `aboutPage` fields: `seo`, `eyebrow`, `heading`, `intro` (text), `portraitAlt`, `largeCopy` (blockContent), `projects` (array of `{heading, body (text), link (ctaLink)}`, exactly 2), `background` (`label`, `heading`, `paragraphs` array of text, `links` array of ctaLink). `siteSettings` keeps only `contactBand`. Export all from `index.ts`.

Create `src/content/sanity.ts`:

    import { createClient } from '@sanity/client';
    import { createImageUrlBuilder } from '@sanity/image-url';
    import { SANITY_API_VERSION, SANITY_DATASET, SANITY_PROJECT_ID } from 'astro:env/server';

    export const sanity = createClient({ projectId: SANITY_PROJECT_ID, dataset: SANITY_DATASET, apiVersion: SANITY_API_VERSION, useCdn: true });
    export const imageBuilder = createImageUrlBuilder(sanity);
    export const fetchSanity = <T>(query: string, params: Record<string, unknown> = {}) => sanity.fetch<T>(query, params);
    export const fetchFreshSanity = <T>(query: string, params: Record<string, unknown> = {}) => sanity.fetch<T>(query, params, { useCdn: false });

Create `src/content/types.ts` with the TypeScript shapes the queries return: `Post`, `Report`, `WorkStory` (with `links: Link[]`, `cover: CoverImage | CoverFigure`, `evidence: Evidence[]`, `artifacts: Artifact[]`, `related: RelatedRef[]`), `Book`, `HomePage`, `WorkIndexPage`, `ReadingPage`, `AboutPage`, `CvPage`, `WritingIndexPage`, `ContactPage`, `NotFoundPage`, `SiteSettings`, `SanityImage` (`{ asset: { _ref: string; url: string; width: number; height: number }; alt: string; hotspot?; crop? }`), `PortableTextBody`, `WritingEntry` (`{ type: 'post' | 'report'; title; excerpt; href; publishedAt; displayDate; tags }`).

Create `src/content/queries.ts` exporting one async function per need, each with its GROQ inline. Every image projection expands the asset: `"image": image{ ..., "asset": asset->{ _id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height } }`. Functions: `getHomePage()` (projecting `"featured": featured[]->slug.current` and `"writingEntry": writingEntry->{ _type, title, "slug": slug.current }`; the homepage pairs these with `getWorkStories()` and `getWriting()` rather than expanding whole documents twice), `getWorkIndexPage()`, `getReadingPage()`, `getAboutPage()`, `getCvPage()`, `getWritingIndexPage()`, `getContactPage()`, `getNotFoundPage()`, `getSiteSettings()` (each `*[_id == $id][0]` and each throws `Missing Sanity document "<id>"` when null); `getWorkStories()` (`*[_type == "workStory"] | order(order asc)` with every field, `links`, `cover` with expanded image, `evidence[]` with expanded images, `"artifacts": artifacts[]->{ _type, title, "slug": slug.current, "publishedAt": publishedAt, "excerpt": coalesce(excerpt, description) }`, `"related": related[]->{ _type, title, "slug": slug.current, publishedAt, "date": date }`); `getPosts()` (all fields, `coverImage` expanded, `related` expanded like above, ordered `publishedAt desc`); `getReports()` (all fields, `"pdfUrl": pdfFile.asset->url`, `"pdfBytes": pdfFile.asset->size`, related expanded); `getBooks()` (as today, `coverImage` expanded); `getTags()` (`array::unique(*[_type in ["post", "report"]].tags[])`). `getWorkStories`, `getPosts`, `getReports` and `getBooks` are memoised in a module-level `Map` keyed by function name so a build fetches each collection once even though several pages call it.

Create `src/content/validate.ts` with `validateWorkStories(stories)` (duplicate `order` or `slug`; `introduction`, `summary`, `result`, `role` non-empty; `cover.alt` non-empty; image covers have an asset; figure covers have a title and at least one fact; every link has label and href; an `href` starting with `http` has `external: true`) and `validatePosts(posts)` (`excerpt` present; `markdownBody` present; cover images have alt; slugs unique) and `validateReports(reports)` (`description` and `pdfUrl` present). `getWorkStories`, `getPosts` and `getReports` call their validator and throw `Invalid <type> collection: <errors joined by '; '>`, which fails the build. This replaces the old `validateWorkStories` and widens it.

Create `src/content/markdown.ts` with a `unified` processor: `remark-parse`, `remark-gfm`, a local `remarkComponentMarkers` plugin, `remark-rehype`, `rehype-slug`, a local `rehypeSafeUrls` plugin, `rehype-stringify`. `remarkComponentMarkers` visits every `paragraph` node whose only child is a `text` node matching `/^\{\{([a-z0-9-]+)\}\}$/` and replaces it with an `html` node `<!--component:$1-->`; because `remark-rehype` is run with `allowDangerousHtml: false`, wrap the marker differently: instead set `node.type = 'html'` and `node.value = '<!--component:NAME-->'` and pass `{ allowDangerousHtml: true }` to `remark-rehype` and `rehype-stringify`, then make `rehypeSafeUrls` also delete every `raw` node whose value does not match `/^<!--component:[a-z0-9-]+-->$/`. This keeps raw HTML out of the output while letting the one marker through. `rehypeSafeUrls` otherwise ports the current `isSafeUri` logic (drop `href`/`src` unless `http:`, `https:`, `mailto:`, `tel:`, or site-relative). Export `markdownToHtml(md): string`, `markdownToPlainText(md): string` and `splitAtComponent(html, name): [string, string] | null`.

Create `src/content/portableText.ts` exporting `portableTextToHtml(body)` using `@portabletext/to-html` with: block `h2`, `h3`, `h4` renderers that add an `id` produced by a local `slugify` (lowercase, non-alphanumerics to hyphens, trimmed, de-duplicated within one document with `-2`, `-3` suffixes); a `link` mark renderer that drops the `href` unless it passes the same safe-URL test as markdown; an `image` type renderer that calls the image helper below for a 720 px wide `srcset` and emits `width` and `height` from the asset; and `portableTextToPlainText(body)`.

Create `src/content/images.ts` exporting `sanitySrcSet(image, widths: number[], options?: { aspect?: number })` returning `{ src, srcset, width, height }` where each candidate is `imageBuilder.image(image).width(w).auto('format').quality(80)` (plus `.height(Math.round(w / aspect)).fit('crop')` when an aspect is given), `src` is the largest, and `width`/`height` are the asset's intrinsic dimensions (or the cropped ones). Export `SanityImage.astro` in `src/components/` that renders `<img>` with `src`, `srcset`, `sizes`, `width`, `height`, `alt`, `loading`, `decoding="async"` and an optional `fetchpriority`; it never emits a `style` attribute (object-fit and position come from the caller's class).

Create `src/content/writing.ts` exporting `getWriting(): Promise<WritingEntry[]>` (posts and reports merged, `href` `/posts/${slug}` or `/reports/${slug}`, `displayDate` via `Intl.DateTimeFormat('en-NZ', { month: 'short', year: 'numeric' })`, sorted by `publishedAt desc`) and `filterableTags(entries)` (tags appearing at least twice, sorted). Create `src/content/related.ts` exporting `getRelated(current: { type, slug, tags, related }, limit = 3)`: returns the curated `related` entries when present, else the posts and reports sharing at least one tag with the current document, most recent first, excluding itself; each entry is `{ title, href, type, publishedAt }`. Create `src/content/readingTime.ts` exporting `readingTime(text): { minutes, words }` (words split on whitespace, 200 per minute, minimum 1).

Acceptance: a scratch page `src/pages/_probe.astro` (deleted before the milestone ends) that calls every query and prints JSON builds without error, and `pnpm exec astro check` reports zero errors. Temporarily set `validateWorkStories` to demand a field that does not exist and confirm the build fails with the joined error message, then revert.


### Milestone 4: Pages and components


Goal: every public page rendering from Sanity in the editorial system.

Shared components in `src/components/`: `Button.astro`, `Icon.astro`, `IconText.astro`, `icons.ts` ported unchanged from `src/components/ui/` except that `Icon.astro` sets its size and stroke through modifier classes (`icon--sm`, `icon--lg`) rather than a `style` attribute. `PageHeader.astro` ported from `src/components/layout/PageHeader.astro` with the measure props replaced by a `measure` prop taking `'narrow' | 'regular' | 'wide'` that maps to three classes (14ch, 16ch, none for the headline; 38rem, 40rem, 43rem for the intro), because inline styles are forbidden. `ContactBand.astro` ported from `src/components/work/ContactBand.astro`, reading `getSiteSettings()`. `EntryList.astro` taking `entries: WritingEntry[]` and rendering the list markup from `src/pages/writing/index.astro` (date column, optional "Report" tag, title, excerpt); used by `/writing` and `/tags/[tag]`. `RelatedList.astro` taking the output of `getRelated`: a section with a top rule, an `h2` "Related", and a plain list of title links with type and date in the mono label style. `ArticleHeader.astro` taking `{ eyebrow, title, lede?, meta: string[], tags?: string[], backHref, backLabel }` and rendering, in the editorial header style: the back link (IconText with `arrow-left`), the eyebrow, the `h1`, the lede, a meta line with items separated by " · ", and tags as text links to `/tags/<slug>` where the tag slug is the tag lowercased with non-alphanumerics collapsed to hyphens (put `tagSlug()` in `src/content/writing.ts` and use it everywhere a tag URL is built). `WorkCover.astro` taking `cover` and `{ priority?, compact? }`: for `kind === 'image'` it renders `SanityImage` at widths `[640, 960, 1280, 1920]` inside a bordered frame with `aspect-ratio` from the asset's dimensions via a class per orientation; for `kind === 'figure'` it renders the figure in the panel style of the old `WorkGraphic.astro` home-lab composition (label, title, a definition-list of facts with label, value and note, a footnote), using tokens only, no `role="img"`, with `cover.alt` rendered as visually hidden text at the top of the figure. `Evidence.astro` taking one evidence item and rendering the `label`, `heading`, `SanityImage` at widths `[720, 1200, 1800, 2400]` in a figure, and a `figcaption`. `WorkCard.astro` ported from `src/components/work/WorkCard.astro`, using `WorkCover compact`, `introduction`, `descriptor`, the category label from `kind` (`professional` "Client", `independent` "Independent", `research` "Research"; put `categoryLabel(kind)` in `src/content/work.ts`), `timeframe ?? year`, the stretched "View case study" link and an optional "Source code" link taken from `links.find(l => l.label === 'Source code')`.

Pages in `src/pages/`:

`index.astro` renders `getHomePage()` with `getWorkStories()`. Port the layout and CSS of the old `src/pages/index.astro` exactly. The lead feature is `featured[0]` with `WorkCover priority`; the two secondary cards are `featured[1..]` with `WorkCover`; every label, heading and link text comes from the `homePage` document; the secondary label is `categoryLabel · descriptor`. The writing block renders `writingEntry` (title link, `writingBlurb`, `writingLinkLabel`) and `allWritingLabel`; the aside renders `readingText` and `readingLinkLabel`. Breadcrumbs: none.

`work/index.astro` renders `getWorkIndexPage()` and every story newest first by `date` with `WorkCard`. `work/[slug].astro`: `getStaticPaths` from `getWorkStories()` passing the story as props. Layout ported from the old page: header (eyebrow `descriptor · timeframe`, `h1`, introduction as summary, `links` as Buttons with the first primary and the rest secondary and `external` from the link, then `role`), `WorkCover priority`, the narrative (`portableTextToHtml(body)` in a 66ch column with the old `.case-narrative` styles), an outcome section headed `resultHeading ?? 'Outcome'` with `result`, one `Evidence` per item in `evidence`, an "From this project" list when `artifacts` is non-empty (title links to `/posts/` or `/reports/` by `_type`), `RelatedList`, the "All work" back link, and `ContactBand booking` when `kind === 'professional'`. Metadata: `title` `${title} · ${descriptor}`, `description` `introduction`, `article: { kind: 'work', publishedAt: date }`, `image` the cover image when kind is image, `breadcrumbs` Work then the story.

`writing/index.astro`: `getWritingIndexPage()`, `EntryList`, the filter chips (rendered only when `filterableTags` is non-empty) with `id="writing-filter"`; `initWritingFilter` in the shell toggles `hidden` on items by `data-tags`, sets `aria-pressed`, and mirrors the choice into the URL with `history.replaceState` as `?tag=<slug>` so a filtered view can be linked and restored on load. The closing aside and its button to `/reading` stay.

`posts/[slug].astro`: `getStaticPaths` from `getPosts()`. `ArticleHeader` with eyebrow "Article", `title`, `lede` `excerpt`, meta `[displayDate (day month year, en-NZ), '<n> min read']`, `tags`, back to `/writing` "All writing". If `coverImage` exists, `SanityImage` at widths `[720, 1200, 1800]` under the header in a bordered frame. Then the body: `const html = markdownToHtml(markdownBody)`; `const split = splitAtComponent(html, 'gpu-calculator')`; if split, render `<div class="prose"><Fragment set:html={split[0]} /><GpuCalculator /><Fragment set:html={split[1]} /></div>`, else `<div class="prose" set:html={html} />`. Then `RelatedList`. Metadata: `article: { kind: 'post', publishedAt, updatedAt, tags }`, `image` the cover image URL at width 1200 when present, breadcrumbs Writing then the post. No table of contents, no share links, no subscribe box, no `?from=` script.

`reports/[slug].astro`: `getStaticPaths` from `getReports()`. `ArticleHeader` with eyebrow "Report", `title`, `lede` `description`, meta `[displayDate, '<n> MB PDF']` (from `pdfBytes`), `tags`, back to `/writing`. Then `PdfViewer` (Milestone 5) with `pdfUrl` and a primary Button "Open PDF" linking to `pdfUrl` with `external`. Then `body` as prose when present, then `RelatedList`. Metadata `article: { kind: 'report', publishedAt, tags }`.

`tags/[tag].astro`: `getStaticPaths` from `getTags()` mapped through `tagSlug`. Header: eyebrow "Tagged", `h1` the original tag text, count, back link "All writing"; `EntryList` of matches. Metadata title `Writing tagged “<tag>”`.

`reading/index.astro`: port the old page with copy from `getReadingPage()`: the quote, group headings from `groups`, cards grouped by `sharedNote` as today, covers via `SanityImage` at widths `[144, 288]` with aspect 2/3, and the recommendation form after the `to-read` group. The form is `<form id="recommend" method="post" action="/api/recommend" data-state="idle">` with a required `title` input (`maxlength` from `MAX_RECOMMENDATION_LENGTH`), a submit Button, and a status paragraph whose five messages come from `recommend.*` in the document, each in a `<span data-for="…">` shown by `data-state` exactly as the old CSS does. No `novalidate`. Without JavaScript the browser posts form-encoded and follows the 303. `initRecommendForm` in the shell intercepts submit, posts JSON, and sets `data-state`.

`about.astro`: `getAboutPage()`; the old layout with `eyebrow`, `heading`, `intro`, `largeCopy` as prose, the portrait as `<Image src={headshot} alt={portraitAlt} widths={[400, 800, 1200]} sizes="(min-width: 48rem) 22rem, 100vw" loading="eager" />` importing `headshot` from `src/assets/images/headshot.jpg`, the two `projects` entries, and `background`. The `Person` node is emitted once by `seo.ts`; the page passes `breadcrumbs` About and nothing else.

`cv.astro`, `contact.astro`, `404.astro`: ported unchanged in structure from the old pages, reading their singletons, with `PageHeader measure` values matching the old measures. `privacy.astro` and `terms.astro`: ported unchanged except the "Local storage" bullet in privacy, which now reads "your theme choice, and for the length of one browsing session a random identifier used to relate a visit to a completed Cal.com booking" and the last-updated date, set to the cutover date.

Acceptance: `pnpm run build` succeeds; `pnpm run preview`; visiting `/`, `/work`, `/work/you-inc`, `/work/sprint-coach`, `/writing`, `/writing?tag=ai`, `/posts/building-a-private-ai-server-for-friends`, `/reports/home-lab-architectural-study`, `/tags/ai`, `/reading`, `/about`, `/cv`, `/contact`, `/privacy`, `/terms`, `/404` renders each with content from Sanity, no console errors, no CSP violations, and no `style="` in any of those HTML files (`grep -l 'style="' dist/**/*.html` prints nothing). Resize each page to 375 px wide and confirm no horizontal scroll.


### Milestone 5: Server routes, forms, the viewer and the calculator


Goal: the five request-time routes and the three client behaviours.

Create `src/server/` and move in, from `src/lib/` in the old tree, `analytics.ts`, `rateLimit.ts`, `sessionStore.ts`, `recommendations.ts`, `timingSafe.ts` unchanged (fix their import paths). Add `src/server/secrets.ts`:

    export const secrets = {
      insightsToken: () => process.env.INSIGHTS_TOKEN,
      calWebhookSecret: () => process.env.CAL_WEBHOOK_SECRET,
      rateLimitSalt: () => process.env.RATE_LIMIT_SALT ?? '',
    };

Add `src/server/blobs.ts` exporting `stores(...names)` that returns a record of `getStore(name)` results or `null` when `getStore` throws (which it does under `astro dev` and in tests, where no Netlify site id exists).

`src/pages/api/collect.ts`: port the old handler unchanged in behaviour (8 KiB body cap, `cleanEvents`, `stores('rate-limits', 'sessions')`, rate limit scope `collect` at 120 per hour, one blob per beacon under `sessionKey(dayStamp(), crypto.randomUUID())`, always 204 or 429).

`src/pages/api/cal-webhook.ts`: port unchanged (HMAC-SHA256 of the raw body against `x-cal-signature-256`, constant-time compare, `BOOKING_CREATED` only, conversion blob, Umami `booking-confirmed` event). Read the website id from `src/site/config.ts`.

`src/pages/api/recommend.ts`: read `content-type`. For `application/json`: the old behaviour (2 KiB cap, `cleanRecommendation`, scope `recommend` at 5 per hour, JSON responses `{ ok, stored }`, 400, 413, 429). For `application/x-www-form-urlencoded`: `await request.formData()`, take `title`, run the same validation and metering, and respond `303` with `Location: /reading/sent?state=ok` (or `limited`, or `error` for an invalid title). Never store anything about the sender.

`src/pages/reading/sent.astro` with `export const prerender = false`: reads `state` from `Astro.url.searchParams` (anything other than `ok` or `limited` is treated as `error`), sets `cache-control: no-store`, fetches `getReadingPage()` and renders `PageHeader` with eyebrow "Reading" and headline "Thanks." (or "Thanks, that's plenty." for limited, "That didn't send." for error), the matching `recommend.success|limited|error` message, the contact email as a link, and a Button back to `/reading#recommend`. `robots` `noindex, nofollow`.

`src/pages/stats.astro` with `export const prerender = false`: authentication is a function `authoriseStats(request, url): 'ok' | 'redirect' | 'unauthorised' | 'unconfigured'` in `src/server/statsAuth.ts`. Without `INSIGHTS_TOKEN`: 503. With a `token` query parameter equal to the secret (constant-time): respond 303 to `/stats` with `Set-Cookie: stats_auth=<token>; Path=/stats; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`. Otherwise read the `stats_auth` cookie or an `Authorization: Bearer` header and compare in constant time; 401 on mismatch. The page body is the old `/stats` (recommendations list via `readRecommendations`, latest report via the `session-insights` store rendered with `markdownToHtml`, an Umami link), `robots` `noindex, nofollow`, `cache-control: no-store`.

Delete `src/pages/api/pdf.ts` and `src/pages/api/insights.ts` (they are gone already if Milestone 1 was followed; the redirects give them 410s).

`netlify/functions/session-insights.mts`: keep the logic; repoint imports to `../../src/server/rateLimit` and `../../src/server/sessionStore`. Before finishing this milestone open `node_modules/@anthropic-ai/sdk/resources/beta/messages/messages.d.ts` (or the equivalent under the installed version) and confirm that `betas`, `fallbacks` and `thinking: { type: 'adaptive' }` are accepted by `beta.messages.create` at the installed version; if any is not, remove that option and record the change in the Decision Log rather than shipping a call that throws at 15:00 UTC.

`src/components/GpuCalculator.astro`: the markup of the old React component as plain HTML using the `.input`, `.select`, `.range`, `.chip` and `.btn` primitives and a results grid, with `data-*` attributes on the controls, plus a `<script>` that imports `initGpuCalculator` from `src/client/gpuCalculator.ts`. That module holds the `MODELS`, `CLOUD_COST_PER_TOKEN`, `GPU_WATTAGE` and `PRESETS` constants and the `formatCost` function verbatim from `GpuCalculator.tsx`, reads the four inputs, recomputes on `input` events, and writes the eight result strings into `data-result="…"` elements. No animation. Export the pure `compute(inputs)` function for a test.

`src/components/PdfViewer.astro` taking `{ url, title }`: the old toolbar markup (previous, next, page indicator, zoom out, zoom level, zoom in, reset, fullscreen, download link to `url`), a loading state, an error state with the download link, and a `<canvas aria-label={title}>`. Its `<script>` imports `initPdfViewer` from `src/client/pdfViewer.ts`, which does `const pdfjs = await import('pdfjs-dist')` (the package entry is `build/pdf.mjs`; confirm with `ls node_modules/pdfjs-dist/build`) and `import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'` (Vite resolves the `?url` import to a hashed asset under `/_astro/`, which satisfies `worker-src 'self'`), sets `pdfjs.GlobalWorkerOptions.workerSrc = workerUrl`, and ports the render queue, navigation, zoom, keyboard shortcuts, fullscreen and debounced resize from the old inline script. The document loads directly from the Sanity CDN URL. The old error and loading `style.display` writes become `hidden` toggles.

`src/client/recommendForm.ts`: the old inline script from `reading/index.astro`, as a module, posting JSON with `content-type: application/json` and mapping 200, 429 and errors to `data-state`.

Acceptance: with `pnpm run dev`: `curl -s -o /dev/null -w '%{http_code}' -X POST localhost:4321/api/collect -H 'content-type: application/json' -d '{"e":[{"t":0,"p":"/"}]}'` prints 204; `curl -s -X POST localhost:4321/api/recommend -H 'content-type: application/json' -d '{"title":"The Fall"}'` prints `{"ok":true,"stored":false}`; `curl -s -o /dev/null -w '%{http_code} %{redirect_url}' -X POST localhost:4321/api/recommend --data-urlencode 'title=The Fall'` prints `303 http://localhost:4321/reading/sent?state=ok`; `curl -s -o /dev/null -w '%{http_code}' localhost:4321/stats` prints 503 without `INSIGHTS_TOKEN` and 401 with it set and no cookie; `INSIGHTS_TOKEN=abc pnpm run dev` then `curl -si 'localhost:4321/stats?token=abc' | grep -i 'set-cookie\|^location'` shows the cookie and `Location: /stats`. In the browser, `/reports/home-lab-architectural-study` renders page 1 of the PDF on a canvas with no CSP violation, and the calculator on the GPU post updates its results as sliders move.


### Milestone 6: Crawl endpoints


Goal: the four machine-readable routes, correct for the new URL set.

`src/pages/rss.xml.ts`: `fetchFreshSanity` of every post (`title`, `slug`, `publishedAt`, `tags`, `excerpt`) ordered `publishedAt desc`, `[0...50]`; items link to `/posts/<slug>` (no alias, no exclusions); `<description>` is the excerpt; `<language>en-nz</language>`; `escapeXml` from `src/site/escape.ts` (moved from `src/lib/escape.ts`; `escapeHtmlAttribute` is used by `src/content/portableText.ts`; keep both functions and the test).

`src/pages/sitemap.xml.ts`: static entries for `/`, `/work`, `/writing`, `/reading`, `/about`, `/cv`, `/contact`, `/privacy`, `/terms` (no `lastmod` on these; do not write `now`), then every work story (`lastmod` `date`), post (`lastmod` `updatedAt ?? publishedAt`), report (`publishedAt`) and tag page (no `lastmod`). Drop `changefreq` and `priority`. Never list `/stats` or `/reading/sent`.

`src/pages/robots.txt.ts`: `User-agent: *`, `Allow: /`, `Disallow: /stats`, `Disallow: /reading/sent`, `Sitemap:` line. Drop the non-standard `Host:` line and the per-crawler blocks (they all said `Allow: /`, which the wildcard already says).

`src/pages/llms.txt.ts`: port the current text, changing the Key URLs to include `/reading` and dropping nothing else.

Acceptance: `pnpm run build`; `xmllint --noout dist/rss.xml dist/sitemap.xml` (or `node -e` with a DOM parser if xmllint is absent) reports well-formed XML; `grep -c '<loc>' dist/sitemap.xml` equals 9 plus the number of stories, posts, reports and tags; `grep 'posts/gpu-share' dist/rss.xml` prints nothing and `grep 'building-a-private-ai-server' dist/rss.xml` prints one line.


### Milestone 7: Assets


Goal: only referenced files in `public/`, every image in a modern format at sensible sizes, the icons that the markup promises.

Move `public/fonts/*.woff2` to `src/assets/fonts/` (already copied in Milestone 1; now `git mv` and delete the `public/fonts` directory). Move `public/images/headshot.jpg` to `src/assets/images/headshot.jpg` after re-encoding it: `node -e "require('sharp')('public/images/headshot.jpg').rotate().resize({ width: 1600 }).jpeg({ quality: 82, mozjpeg: true }).toFile('src/assets/images/headshot.jpg').then(() => console.log('ok'))"` (the source is 3264 by 4896; the result is about 1600 by 2400 and well under 500 KB). The six work and post images were uploaded to Sanity in Milestone 0, so delete `public/images/` entirely. Delete `public/audio/`, `public/reports/`, `public/logo.png`, `public/HB_logo.svg`, `public/vendor/`.

Write `scripts/generate-icons.mjs`. It reads the two logo path strings from `src/components/Logo.astro` (export them from a `src/site/logo.ts` module the component also imports, so the script and the component share one copy), writes `public/favicon.svg` (the two paths, `viewBox="0 0 453.54 453.54"`, `fill="#0b0d0c"`, with a `<style>@media (prefers-color-scheme: dark){path{fill:#f2f5ef}}</style>` block), and uses `sharp` to rasterise the SVG to `public/apple-touch-icon.png` (180 by 180, paper background `#f6f7f3`, logo at 70 percent), `public/icon-192.png`, `public/icon-512.png`, and `public/og-default.png` (1200 by 630, paper background, logo centred at 360 px). Run `pnpm run icons`. Write `public/site.webmanifest` with `name` "Hamish Burke", `short_name` "Hamish Burke", the site description, `start_url` "/", `display` "standalone", `background_color` "#f6f7f3", `theme_color` "#0b0d0c", icons `favicon.svg` (any, image/svg+xml), `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`. Keep `public/410.html` and `public/cv.pdf` as they are.

Acceptance: `du -sh public` is under 1 MB; `ls public` shows exactly `410.html`, `apple-touch-icon.png`, `cv.pdf`, `favicon.svg`, `icon-192.png`, `icon-512.png`, `og-default.png`, `site.webmanifest`; after `pnpm run build`, `ls dist/_astro | grep -c 'headshot'` is at least 3 (one file per width) and the about page's `<img>` has a `srcset` with three candidates.


### Milestone 8: Tests, CI, hooks and documentation


Goal: the invariants that were silent are checked by a machine.

Restore the pure tests from `legacy-tests/` with import paths updated: `analytics.test.ts`, `analytics-tracker.test.ts` (imports from `src/client/analyticsTracker.ts`), `cal-webhook.test.ts`, `escape.test.ts`, `markdown-safety.test.ts` (add cases: a paragraph `{{gpu-calculator}}` becomes `<!--component:gpu-calculator-->`; a raw `<div>` in markdown is dropped; `splitAtComponent` returns two halves), `rate-limit.test.ts`, `recommend-route.test.ts` (add the form-encoded 303 case), `recommendation-reader.test.ts`, `recommendations.test.ts`, `session-store.test.ts`, `site.test.ts`, `timing-safe.test.ts`. Add `stats-auth.test.ts` (503, 401, redirect with cookie, cookie accepted, bearer accepted, prefix rejected), `gpu-calculator.test.ts` (`compute` for the default inputs equals the values the old component displayed: with Llama 3.1 8B, 500 tokens, 50 responses and NZ 0.346, `costPerResponse` is `(500/55)/3600 * 0.15 * 0.346`), `portable-text.test.ts` (heading ids, duplicate heading suffixes, `javascript:` link dropped, image `srcset` present), `validate.test.ts` (each validator's error strings), `writing.test.ts` (`tagSlug`, `filterableTags`, merge order). Drop `pdf-viewer.test.ts`, `view-transitions.test.ts`, `pdf-route.test.ts`, `insights-route.test.ts`, `work.test.ts`.

Add `tests/build-output.test.ts`. It skips every test with `t.skip('run pnpm run build first')` when `dist/index.html` does not exist. Otherwise it walks `dist/**/*.html` (excluding `410.html`), parses each with `node-html-parser`, and asserts: the `<link rel="canonical">` href equals `https://hamishburke.dev` plus the file's public path (`/index.html` is `/`, `/work.html` is `/work`, `/work/you-inc.html` is `/work/you-inc`); `og:image` is an absolute URL whose path exists under `dist/` or whose host is `cdn.sanity.io`; every `<a href>` and `<img src>` that starts with `/` resolves to a file in `dist/` (trying `path`, `path.html`, `path/index.html`) or matches a `from` in `netlify.toml`'s redirect rules; no element has a `style` attribute; the `content-security-policy` meta exists and does not contain `unsafe-inline`; exactly one `<script type="application/ld+json">`, and it parses as JSON with a `@graph` array; the `<html lang>` is `en-NZ`. Add `tests/redirects.test.ts` that parses every `[[redirects]]` block in `netlify.toml` and asserts each site-relative `to` exists in `dist/` (skipped without `dist/`).

Write `.github/workflows/ci.yml`: checkout, pnpm 10, Node 22 with cache, `pnpm install --frozen-lockfile`, `pnpm run test` (pure tests), `pnpm run build`, `pnpm run test` again (build-output tests now run), `pnpm exec knip`, `pnpm run studio:build`, with the three Sanity variables in `env`.

Update `.claude/hooks/guard-destructive.sh`: the guarded scripts are `scripts/migrate-*.ts` and the `pnpm run migrate` script; the message names the subtractive mode as the irreversible one. Update `.claude/hooks/check-invariants.sh`: drop the `legacyRoutes.ts` case; keep the routing-surface reminder for `src/layouts/Base.astro`, `src/site/seo.ts`, `src/site/config.ts` and the four crawl endpoints; replace the Tailwind opacity check with a hex-colour check (`grep -nE '#[0-9a-fA-F]{3,8}\b' "$root/$path"` on `.astro` and `.css` files other than `src/styles/tokens.css`, `public/410.html` and `scripts/generate-icons.mjs`); add a `style="` check on `.astro` files. Keep `verify-before-stop.sh`.

Rewrite `AGENTS.md` (keep the `CLAUDE.md` symlink), `ARCHITECTURE.md` and `README.md` to describe the new tree, commands, rendering model, content ownership (everything in Sanity except legal pages), the CSP rule (no inline styles, no Shiki), the two-step migration, and the footguns that remain (Sanity CDN staleness, the Netlify build hook, the nightly function). Delete `legacy-src/`, `legacy-tests/`, `docs/design-docs/`, `docs/exec-plans/visitor-context.md`, `docs/portfolio-redesign.md`, `docs/production-smoke-2026-09-08.md`; keep `docs/exec-plans/completed/` and move this file there at the end.

Acceptance: `pnpm run test` before a build prints every pure test passing and the two build suites skipped; after `pnpm run build`, `pnpm run test` prints everything passing; `pnpm exec knip` prints nothing; `pnpm exec astro check` prints zero errors, warnings and hints.


### Milestone 9: Cutover


Goal: the new site live, the dataset trimmed, the old workarounds gone.

Push `rewrite` and open a pull request against `main`. Netlify builds a deploy preview; open it and repeat the Milestone 4 page list plus `/rss.xml`, `/sitemap.xml`, `/robots.txt`, `/llms.txt`, and confirm `curl -sI <preview>/projects/otto` returns 410 and `curl -sI <preview>/api/pdf` returns 410. Run Lighthouse on the preview homepage and the GPU post in mobile mode; record Performance, Accessibility, Best Practices and SEO in the Outcomes section; every score should be at least 95, and Cumulative Layout Shift should be 0.

Deploy the Studio with the new schema: `pnpm run studio:deploy`. Open it and confirm every work story shows its cover and links, and that the old fields appear as "unknown fields" (they are removed in the next step).

Merge the pull request. Wait for the production build. Then Hamish runs the subtractive migration: `SANITY_WRITE_ACK=1 pnpm run migrate subtractive` (after `pnpm run migrate subtractive --dry-run`). Confirm in Studio that no unknown fields remain and that `count(*[_type in ["project", "aphorism", "projectsIndexPage"]])` is 0.

In the Cloudflare dashboard for hamishburke.dev, turn off Rocket Loader (Speed, Optimization, Content Optimization). It was the reason for every `data-cfasync="false"` attribute in the old templates; none exist now, and with it on it would defer the hashed theme script.

Production smoke test, recorded under `docs/production-smoke-<date>.md` in the format of the old `docs/production-smoke-2026-09-08.md`: every URL in the preserve list returns 200; every redirect and 410 behaves; `/stats` returns 401 without a token; the booking link on `/contact` carries `metadata[ref]`; the browser console on `/` shows no CSP violations; `curl -sI https://hamishburke.dev/` shows the security headers from `netlify.toml` and a `Content-Security-Policy` header of exactly `frame-ancestors 'none'`.

Move this file to `docs/exec-plans/completed/` and fill in Outcomes & Retrospective.


## Concrete Steps


All commands run from the worktree root `../astro-blog-rewrite` unless stated. Update this section with actual transcripts as work proceeds.

Milestone 0:

    git worktree add ../astro-blog-rewrite -b rewrite
    cp .env ../astro-blog-rewrite/.env
    cd studio-production && pnpm exec sanity dataset export production ../.sanity-backups/production-2026-09-11-pre-rewrite.tar.gz && cd ..
    pnpm exec tsx --env-file=.env scripts/migrate-2026-09.ts additive --dry-run
    SANITY_WRITE_ACK=1 pnpm exec tsx --env-file=.env scripts/migrate-2026-09.ts additive    # Hamish runs this

Expected tail of the write:

    Uploaded 6 images (0 reused)
    Patched 7 work stories, 1 post, 3 singletons
    Created 3 singletons
    Transaction committed: <transaction id>

Milestone 1 onwards:

    pnpm install
    pnpm run build
    pnpm run preview
    pnpm run test
    pnpm exec knip
    pnpm exec astro check

Expected `pnpm run test` after a build: `# pass <N>` with `# fail 0` and `# skipped 0`, where N is at least 120.


## Validation and Acceptance


The site is accepted when all of the following hold on the production deploy:

Behaviour a visitor sees: every URL in the preserve list returns 200 with the expected content; the homepage's largest image request is under 200 KB on a 390 px wide viewport; the theme follows the system until toggled and the choice survives reload; the recommendation form on `/reading` submits with JavaScript disabled and shows a confirmation page; the GPU cost calculator on the GPU post recalculates as inputs change; the PDF on each report renders on the page and can be downloaded; the writing filter's URL can be shared.

Behaviour a crawler sees: `rss.xml` lists all three posts under their public URLs; `sitemap.xml` lists every public page once with no `now` timestamps; each page has one canonical, one JSON-LD graph, an `og:image` that resolves; `/stats` and `/reading/sent` are `noindex` and absent from the sitemap.

Behaviour the browser enforces: no CSP violation on any page; no `'unsafe-inline'` anywhere; no `style` attribute in any built HTML.

Behaviour the repository enforces: `pnpm run test` passes with the build-output suite running; `pnpm exec knip` is clean; `pnpm exec astro check` is clean; CI is green.

Size: `du -sh dist/_astro` is under 2 MB including the PDF.js chunks, and no single JavaScript chunk except PDF.js exceeds 30 KB; `du -sh public` is under 1 MB; `wc -l` over `src/**/*.{ts,astro,css}` is under 6 000.


## Idempotence and Recovery


The additive migration can be re-run: every `set` writes an absolute value, image uploads are matched by `originalFilename` and reused, and `createOrReplace` is idempotent by definition. The subtractive migration can be re-run: `unset` of an absent field and delete of an absent document are no-ops in a Sanity transaction (the script must pass `delete` only for ids that a preceding fetch found). The pre-rewrite export restores everything the subtractive step removes: `pnpm --filter hamishburke-studio exec sanity dataset import ../.sanity-backups/production-2026-09-11-pre-rewrite.tar.gz production --replace` (this replaces the whole dataset; use it only if the new site is also rolled back).

Code rollback before merge is `git worktree remove ../astro-blog-rewrite` and `git branch -D rewrite`. After merge, `git revert` the merge commit; the additive migration leaves the old code working, so a revert does not need a data change. Only after the subtractive step is the old code unbuildable (it demands `graphic.alt`), which is why that step is last.

`pnpm run icons`, `pnpm run build` and the tests can be repeated freely. The headshot re-encode reads from `public/images/headshot.jpg`, which is deleted afterwards; keep the original in the pre-rewrite git history (`git show main:public/images/headshot.jpg > headshot.jpg`) if it is needed again.


## Artifacts and Notes


Evidence gathered on 2026-09-11 that this plan relies on:

    $ pnpm run test        # on main, before the rewrite
    # tests 100
    # pass 100

    $ pnpm exec knip       # on main
    Unused exports (1)  SCREENSHOT_GRAPHIC_KINDS  src/lib/work.ts
    Unused exported types (4)  WorkKind WorkStatus WorkService ArtifactType  src/lib/work.ts

    $ ls -laS dist/_astro | head -3          # last local build, 21 Aug 2026
    5006533  pane2.BlMriWgk.js                # Sanity Studio
    1317962  VideoPlayer.BVNzh0SY.js          # Sanity Studio
     184903  client.C73kiKoU.js               # React DOM

    $ curl -sI -H "Origin: https://hamishburke.dev" https://cdn.sanity.io/files/qnuj1c4o/production/9192ef20e82d4cad55c41aef18a001abbadcb306.pdf
    access-control-allow-origin: https://hamishburke.dev
    cache-control: public, max-age=31536000, s-maxage=2592000

    $ du -sh public/audio public/images/tiles public/images/headshot.jpg
    5.2M  public/audio
    7.4M  public/images/tiles
    5.0M  public/images/headshot.jpg


## Interfaces and Dependencies


Runtime dependencies of the site and why: `astro` (framework), `@astrojs/netlify` (adapter), `@sanity/client` and `@sanity/image-url` (content and image URLs), `@portabletext/to-html` (rich text), `unified`, `remark-parse`, `remark-gfm`, `remark-rehype`, `rehype-slug`, `rehype-stringify` (markdown), `@netlify/blobs` (stores), `pdfjs-dist` (report viewer, loaded only on report pages). Nothing else ships to the browser.

Module contracts that must exist at the end:

In `src/site/config.ts`:

    export const SITE_URL: 'https://hamishburke.dev';
    export const LOCALE: 'en-NZ';
    export function absoluteUrl(pathOrUrl: string, base?: string): string;
    export function publicPathFromAstro(url: URL): string;

In `src/site/seo.ts`:

    export interface MetadataInput { title: string; description: string; path: string; image?: string; robots?: string; article?: { kind: 'post' | 'report' | 'work'; publishedAt: string; updatedAt?: string; tags?: string[] }; breadcrumbs?: Array<{ name: string; path: string }> }
    export interface Metadata { fullTitle: string; canonical: string; ogImage: string; jsonLd: Record<string, unknown> }
    export function buildMetadata(input: MetadataInput): Metadata;

In `src/content/queries.ts`: `getHomePage`, `getWorkIndexPage`, `getReadingPage`, `getAboutPage`, `getCvPage`, `getWritingIndexPage`, `getContactPage`, `getNotFoundPage`, `getSiteSettings`, `getWorkStories`, `getPosts`, `getReports`, `getBooks`, `getTags`, each `() => Promise<T>` for the matching type in `src/content/types.ts`.

In `src/content/markdown.ts`:

    export function markdownToHtml(markdown: string): string;
    export function markdownToPlainText(markdown: string): string;
    export function splitAtComponent(html: string, name: string): [string, string] | null;

In `src/content/portableText.ts`:

    export function portableTextToHtml(body: PortableTextBody | null | undefined): string;
    export function portableTextToPlainText(body: PortableTextBody | null | undefined): string;

In `src/content/images.ts`:

    export function sanitySrcSet(image: SanityImage, widths: number[], options?: { aspect?: number }): { src: string; srcset: string; width: number; height: number };

In `src/content/validate.ts`: `validateWorkStories(stories: WorkStory[]): string[]`, `validatePosts(posts: Post[]): string[]`, `validateReports(reports: Report[]): string[]`.

In `src/server/statsAuth.ts`:

    export type StatsAuth = { kind: 'ok' } | { kind: 'redirect'; setCookie: string } | { kind: 'unauthorised' } | { kind: 'unconfigured' };
    export function authoriseStats(request: Request, url: URL, secret: string | undefined): StatsAuth;

In `src/client/gpuCalculator.ts`:

    export interface CalculatorInputs { modelIndex: number; tokensPerResponse: number; responsesPerDay: number; electricityRate: number }
    export function compute(inputs: CalculatorInputs): { inferenceTimeSec: number; costPerResponse: number; dailyCost: number; monthlyCost: number; cloudCostPerResponse: number; cloudMonthlyCost: number; multiplier: number };
    export function initGpuCalculator(root: HTMLElement): void;

In `src/client/shell.ts`: `export function initShell(): void;` and in `src/client/themeBoot.ts`: `export const THEME_BOOT: string;`.

The Sanity schema contract is the set of `defineType` exports in `src/sanity/schemaTypes/index.ts`; the Studio in `studio/` imports that module and nothing else from the site.
