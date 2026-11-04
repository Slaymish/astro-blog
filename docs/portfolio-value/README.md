# Editorial portfolio value

`manifest.json` records all 52 non-draft catalogue documents (46 work stories, 3 posts, 3 reports), their source revisions, 0..100 editorial value scores and individual reasons. `ranking.md` is the human-readable assessment and explains scope and uncertainty. The assessment reads the existing catalogue text and the three report PDFs, not a fresh source-code audit. AI assistance is not itself a penalty. Scores are editorial significance, not probabilities, research accuracy, moral worth or personal affection.

The live Sanity production dataset was patched in transaction `wEiQv1iHGD5mvsFj3kqTUN`, setting only `valueScore` and `valueReason` with a revision precondition per document. All 52 exact field pairs were read back from the origin API. The source revision in the manifest is the BEFORE revision. Do not replay the original revision guards as if they were current. Full source/verification snapshots and mutation receipt are in `~/elio/catalogue-value/`.

The schema and query/type/validation implementation supports hidden editorial ranking on the homepage and work/writing index. Local test output is not a deployment receipt; confirm the merged commit and public pages separately. `sortFeedByValue(entries)` remains the score-only helper: value descending, then date descending, then href ascending, with unassessed entries below explicit zero. The reason is not projected into pages; Sanity's dataset is public, so 'editorial metadata' does NOT mean secret.

Verification: parent ran `pnpm run build` successfully; post-build `pnpm run test` passed all 242 tests with zero skips; `pnpm exec knip` and `git diff --check` passed. The real helper was exercised against the 52 live scored records and ranked the master's report first. No deploy was triggered manually and no commit/push was made. A Sanity content hook may independently rebuild the existing deployed source.

Scope exception: the hard-coded `/work/codex-usage` calculator is not a current workStory/post/report document, so it has not been silently included in the scored catalogue. Old project records, aphorisms and books are not active work/writing entries.

## Hidden build-time selection

`src/content/ranking.ts` ranks assessed base score plus at most five freshness
points, with an exponential 90-day half-life from original `publishedAt` or
`story.date`. It never uses `updatedAt`; future and invalid dates gain nothing.
Unassessed/invalid scores rank below explicit zero. Ties use base score, date
descending, then href ascending. Inputs are not mutated and the clock is explicit.

`/work` and the `/writing` fallback render one ranked stream with matching
metadata and the existing type filters. Tag archives and chronological feed
helpers retain their existing order and year grouping. No scores or reasons are
rendered or sent to client code. The manually pinned work band and unscored
calculator promo are absent; the calculator route remains available.

The homepage takes the top five work stories with assessed scores of at least
70, without an age cutoff. If none qualify, curated featured slugs are validated
and used. Its writing insert ranks writing excluding artifacts linked by selected
work, using the selected title/href/excerpt/type consistently. If none remain,
both the visible writing insert and its JSON-LD entry are omitted; there is no
curated writing fallback. Existing work order and curation remain only as legacy
fallback for work selection. Reading and feature slots keep
their existing geometry.

The build clock is captured once per route. Time-dependent order refreshes only
on a new build and deploy, not continuously on the static site. `sortFeedByValue`
remains the original score-only opt-in helper; chronological consumers are intact.

Parent verification of the hidden ranking: the full production build passed, all 251 post-build tests passed with zero skips, and knip passed. Real Chromium QA confirmed all 52 entries render, Work/Writing filters show 46 and 6 entries respectively, there are no score fields or ranking buckets in the HTML, and mobile has no horizontal overflow. The first homepage project is Grid Diffusion AD; the writing insert is the Home Lab report rather than a duplicate of the master's project. Screenshot review found no clipping or broken cover. Deployment remains separate from this local verification.
