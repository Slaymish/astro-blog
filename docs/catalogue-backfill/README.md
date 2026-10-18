# Forty catalogue additions

The catalogue backfill is published at https://hamishburke.dev/work. The current bundle contains 38 additions and the live catalogue contains 46 work entries after the requested removal of Alphero Voice Skill and HamishStyler. Four generated covers have been replaced with original project interfaces and ArticulateAI's command menu. The 19 explanatory diagrams remain at Hamish's request. All copy and dates are preserved, and the eight pre-existing stories are unchanged. The production-data build and all 221 tests pass. Latest delayed deploy: 6ac982141511aa15b389ba9c, published on 10 October 2026 at 1:09:37 PM NZDT.

- [Review gallery](http://localhost:4372/review.html): all 38 covers, summaries, complete copy and provenance, linking to the actual site-layout preview.
- [Site catalogue](http://localhost:4371/work): the 38 additions alongside the eight existing work entries.
- `review.md`: complete readable copy and date/media evidence for all entries.
- `documents.json`: complete workStory documents. LOCAL-COVER references are intentionally unresolved until the approved importer uploads the images.
- `sources.json`: original commit/release evidence, visibility, media provenance and attribution.
- `media/`: Historical and selected cover assets. The 19 selected explanatory diagrams also have editable SVG originals.
- `import.ts`: read-only validation by default; approved publication uploads assets and creates stable-ID documents additively, refusing divergent existing backfill documents.

## Dating

Dates use the first preserved commit or released package and are explicitly described as archive dates on each page. They do not establish an unrecorded launch date. Watzon's June 2022 date includes the earlier WatzonOld history. Cookie Cat's July 2023 date comes from preserved source history, earlier than its repository creation date. Grid Diffusion AD spans November 2025 to February 2026. Website screenshots show the interface captured in October 2026, rather than its historical appearance.

## Media

The current bundle has 19 original assets, application screenshots or original interface renders, and 19 explanatory diagrams. No generated illustration is selected. See `real-media-2026-10-10/README.md` for the four original-project cover replacements and their capture limitations. Private repository links are omitted from visitor-facing documents. The local source manifest retains private commit URLs for review.

## Verification

An isolated build at `/Users/hamishburke/Documents/Codex/catalogue-preview-2026-10-10` overlays the prepared entries without any Sanity write. The original site's source and existing documents are untouched. The build passes Astro checking, writes 106 Markdown twins and passes all 221 tests, including post-build image/link, chronology, metadata and Markdown checks. The normal check command also passes Astro and knip. The browser validation report is in `preview-validation.json`.

Run the read-only import check from the repository root:

```sh
pnpm exec tsx --env-file=.env docs/catalogue-backfill/import.ts
```

Only after explicit approval of this production write:

```sh
SANITY_WRITE_ACK=1 pnpm exec tsx --env-file=.env docs/catalogue-backfill/import.ts --publish
```

The importer records reusable asset IDs and verifies all 38 saved documents. Sanity writes can trigger a racing content build, so publication also requires the repository's prescribed delayed second deploy and verification against that deploy's permalink. Deployment was explicitly approved and the delayed second build was published and verified on 10 October 2026.

## Rebuild the review

`bundle.py` builds the Sanity and preview documents from `entries.py`, history and covers. `covers.mjs` reads `editorial.json` and original/captured media to generate the final cover manifest. When changing copy or dates, run bundle, covers, then bundle again so cover text and documents share the same metadata. `prepare-preview.py` refreshes the isolated source copy and media. `review.mjs` writes the review gallery, readable copy and contact sheets. `verify-preview.mjs` checks all 38 pages at desktop and mobile widths while the local preview servers run.

The isolated build uses the repository's installed dependencies without installing anything. `pnpm_config_verify_deps_before_run=false` prevents pnpm 11 trying to replace the shared dependency symlink. Use the three public Sanity environment variables from AGENTS.md when building that copy; no token is needed for the preview.

## Requested revision, 10 October 2026

Alphero Voice Skill and HamishStyler were removed at Hamish's request, and Otto's icon cover was replaced by a generated conceptual illustration. The current bundle contains 38 additions and the dataset contains 46 work entries. The 45 other work stories are unchanged. Revision details and recovery snapshots are in revision-2026-10-10/. The original forty-entry audit and import history above describe the earlier completed backfill.

## Original-project covers, 10 October 2026

At Hamish's request, the four generated illustrations were replaced with ArticulateAI's original command menu, Otto's native journal rendered with shipped capabilities, and Synod and Lumen screenshots captured in an empty Obsidian vault. The 19 explanatory diagrams are retained. Copy and archive dates are unchanged. The current media manifest contains 19 recovered assets or original interfaces and 19 diagrams. Details are in `real-media-2026-10-10/`.

Final cover deploy verification passed for all 38 backfill detail pages and cover asset IDs, Markdown twins, catalogue and crawl entries. The four new covers are present on the apex domain and the two removed URLs remain 404. See `production-verification.json`.
