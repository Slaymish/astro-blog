# Simplify the production site structurally

This plan follows `PLANS.md` and continues the verified cleanup already in the working tree.

## Purpose / Big Picture

Remove duplicated systems and unnecessary branches while preserving the production site. The target is fewer definitions, requests and state transitions, rather than compressed formatting.

## Progress

- [x] (2026-09-08) Inspect the largest components and save a second baseline outside the repository.
- [x] (2026-09-08) Share Sanity schemas and pass already-fetched work stories into static pages.
- [x] (2026-09-08) Simplify PDF controls, writing mapping, article components and unused CSS.
- [x] (2026-09-08) Pass 100 tests, both builds, both Astro configuration checks, Knip and 52 browser style/layout comparisons.

## Surprises & Discoveries

Both Sanity schema directories contain the same 916 lines. The standalone Studio initially could not build because its dependencies were absent; its npm lock then failed installation because ESLint 10 conflicted with the Sanity lint preset's ESLint 9 peer. Consolidating dependencies removes this separate installation problem. Sanity's CLI requires both a local package manifest and a declared styled-components dependency, so `studio-production/package.json` is a symlink to the root manifest. The root now declares the existing styled-components version and Vision aligned with the installed Sanity version (5.17.1). Work detail generation fetches every story, then fetches each story a second time and validates it again. The PDF viewer duplicates navigation, zoom and error-handling branches. The table of contents accepts a Markdown fallback, but its only caller supplies rendered HTML and passes plain text as the fallback.

## Decision Log

- Decision: Import canonical schemas directly from the standalone Studio config and remove duplicate files and the mirror hook. Rationale: importing the same definitions makes drift impossible. The Studio remains separately built and deployed from this repository. Date: 2026-09-08.
- Decision: Share the root manifest through a symlink and expose Studio commands as root scripts. Rationale: satisfy the CLI without a second dependency definition, installation or lockfile. Date: 2026-09-08.
- Decision: Preserve markup, CSS classes and PDF.js rendering controls. Rationale: replacing the viewer with a browser embed would lose its existing cross-browser controls. Date: 2026-09-08.

## Outcomes & Retrospective

The complete working-tree cleanup removes approximately 1,660 net source/config/test lines and 17,289 net lockfile lines compared with the original HEAD. This second pass alone removes 659 lines from `src`, plus the 916-line schema mirror. PDFViewer falls from 537 to 322 lines, TableOfContents from 102 to 59, writingData from 104 to 66, and design tokens from 298 to 83. The static work detail pages no longer make seven duplicate story queries, and the writing stream uses one query and mapping instead of two.

Validation passes: 100 tests (six new PDF behaviour tests), production and development Astro checks, the production site build, the separate Studio build, a frozen pnpm installation, Knip, and `git diff --check`. CI now builds Studio too. All 41 HTML documents retain their content and element structure after normalising asset/scope hashes, removed redundant accent variables and the added PDF canvas accessible label. All inline scripts outside the PDF controller remain identical. In Chrome, 52 combinations spanning thirteen pages, two widths and two themes have identical computed styles and geometry. The comparison serves a fixed theme and removes scripts to make style checks deterministic, and rejects empty snapshots. A separate browser check with scripts enabled renders a real 13-page PDF, navigates to page two, zooms to 125 percent and confirms canvas pixels; theme toggling also works.

Compiled CSS drops from 135,904 to 127,910 bytes, saving 7,994 bytes relative to the first-pass baseline. Public-page JavaScript moves from 326,260 to 326,279 bytes, a 19-byte chunk-boundary difference. The complete JavaScript inventory, including the embedded CMS, grows by 192,384 bytes after consolidating the Studio toolchain; that additional CMS code is not referenced by public content pages. This is a recorded tradeoff of sharing the formerly divergent Studio dependencies, not a claim that every bundle shrank. No deployment or Sanity data write was performed.

## Context and Orientation

`src/sanity/schemaTypes` defines all CMS document types; `studio-production/schemaTypes` is an identical copy. The standalone Studio config can import the canonical index directly. `.claude/hooks/check-invariants.sh`, `AGENTS.md` and `ARCHITECTURE.md` describe or enforce the old mirroring arrangement and must reflect the new single source. `src/pages/work/[slug].astro` can receive a story through the `props` returned by `getStaticPaths`, eliminating `getWorkStory`. `src/components/features/PDFViewer.astro` owns its toolbar, PDF.js loader and queued canvas rendering. Existing production security checks remain in `src/pages/api/pdf.ts`.

## Plan of Work

First remove the schema mirror and the associated drift machinery, then build Studio to verify that its bundle can import outside its directory. Reuse fetched stories in static route props. Consolidate posts and reports into one writing query and mapping while preserving tie order. Remove the unused Markdown table-of-contents branch and unnecessary component prop variants. Use one PDF navigation function, one zoom function and an async render queue with a single error path. Remove CSS for absent graphics and tokens with no consumers in compiled output, tracing custom-property references before removing definitions.

## Concrete Steps

Work from `/Users/hamishburke/Developer/astro-blog`. The baseline is `/var/folders/xb/dg7gk2ss7ln9gssz6zcgr25w0000gn/T/astro-radical-baseline-pad583ax`, containing `dist`, source and schema copies. Run `pnpm --config.verify-deps-before-run=false run test`, `run build`, `run studio:build`, and `exec knip`. The pnpm flag avoids this host's automatic dependency repair and is not a project setting.

## Validation and Acceptance

Require passing tests and builds. Compare generated route inventories and markup after normalising build-generated hashes and timestamps. Compare computed styles and element geometry at mobile/desktop widths in light/dark modes. Exercise the PDF toolbar, zoom limits, render queue, keyboard controls, failures and resize with deterministic PDF.js stubs, and confirm a real local PDF renders. Retain public assets and all server security checks.

## Idempotence and Recovery

The working tree includes the preceding authorised cleanup; preserve it. Baseline copies outside the repository support comparison and targeted restoration. Do not write production data or deploy. New Studio builds require the root dependencies because schemas are shared with the main site.

## Artifacts and Notes

Record final reductions and validation evidence here at completion. Temporary browser comparison scripts and outputs stay outside the repository.

## Interfaces and Dependencies

Keep the canonical `schemaTypes` export and existing content model. Keep public route families and PDF controls. `getWorkStories` becomes the sole work query, with Astro supplying typed story props to detail pages. Vision and the existing styled-components peer are declared in the root manifest instead of the removed standalone dependency definition. Both Studio configs consume the same root Sanity installation.

Revision note: Completed the structural simplification, documented the CLI manifest requirement and dependency consolidation, and recorded production output, behaviour and size evidence. A grouped-selector cleanup briefly applied panel styles to graphic captions; the browser comparison caught it and the original caption declarations were restored. Diagnostic bundle-inspection code and experimental deduplication settings were removed after inspection.
