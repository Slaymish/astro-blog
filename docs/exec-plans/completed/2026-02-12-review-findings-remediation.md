# Remediate Security, Reliability, and Styling Findings from Codebase Review

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This plan must be maintained in accordance with `PLANS.md`.

## Purpose / Big Picture

This change hardens markdown rendering against unsafe URL schemes, tightens the PDF proxy boundary, makes theme token usage consistent, removes runtime dependence on third-party CDN-hosted PDF scripts, and restores a passing test suite. After implementation, the site should keep existing behavior while eliminating the reviewed security and reliability gaps, and `npm run test` and `npm run build` should both succeed.

## Progress

- [x] (2026-02-12 23:43Z) Confirmed scope from review findings and mapped impacted files.
- [x] (2026-02-12 23:44Z) Implemented markdown URL sanitization and aligned markdown safety tests with explicit behavior.
- [x] (2026-02-12 23:44Z) Tightened `/api/pdf` allowlist scope (project/dataset) and added response size guard with regression tests.
- [x] (2026-02-12 23:44Z) Imported theme variable definition files globally in layout shell.
- [x] (2026-02-12 23:44Z) Removed runtime CDN dependency for PDF.js by self-hosting pinned assets and wiring viewer to local paths.
- [x] (2026-02-12 23:45Z) Ran validation (`npm run test`, `npm run build`) and confirmed successful results.

## Surprises & Discoveries

- Observation: `markdownToHtml` currently strips raw HTML tags but still allows unsafe markdown link protocols (for example `javascript:`), which is a practical gap despite script-tag stripping.
  Evidence: local reproduction returned `<p><a href="javascript:alert(1)">x</a></p>` for markdown input `[x](javascript:alert(1))`.

- Observation: test execution inside the sandbox failed due local IPC pipe creation restrictions, so tests require elevated execution in this environment.
  Evidence: `listen EPERM ... /tmp/tsx-1000/...pipe` from `npm run test`.

- Observation: directly reading `import.meta.env.PUBLIC_*` in route modules can fail in Node test runtime because `import.meta.env` is undefined outside Astro/Vite execution context.
  Evidence: `TypeError: Cannot read properties of undefined (reading 'PUBLIC_SANITY_PROJECT_ID')` from `tests/pdf-route.test.ts`.

## Decision Log

- Decision: Implement markdown URI sanitization inside `src/lib/markdown.ts` using a local HAST traversal plugin instead of adding new dependencies.
  Rationale: Avoid dependency changes (which require pre-approval in this repo) while still enforcing an explicit safe-URI contract.
  Date/Author: 2026-02-12 / Codex

- Decision: Self-host pinned PDF.js assets under `public/vendor/pdfjs/3.11.174/` and point `PDFViewer` at local files.
  Rationale: Removes third-party runtime script dependency and addresses the reviewed supply-chain concern without adding npm dependencies.
  Date/Author: 2026-02-12 / Codex

- Decision: Resolve runtime/env variance in `src/pages/api/pdf.ts` by reading `import.meta.env` via a guarded object.
  Rationale: Keeps environment-driven behavior in Astro runtime while preserving compatibility with direct Node-based tests.
  Date/Author: 2026-02-12 / Codex

## Outcomes & Retrospective

All targeted findings from the review were addressed in code and validated with project commands. Markdown rendering now strips unsafe URL schemes before HTML output; `/api/pdf` now enforces Sanity project/dataset path constraints and rejects oversized responses; theme variable definition files are globally imported; and PDF viewer runtime assets are served locally from `public/vendor/pdfjs/3.11.174`.

Validation status:

- `npm run test` passed (8/8 tests).
- `SANITY_PROJECT_ID=qnuj1c4o SANITY_DATASET=production SANITY_API_VERSION=2024-01-01 npm run build` passed.

Remaining non-blocking note: build still reports existing large-chunk warnings unrelated to these fixes.

## Context and Orientation

The markdown transformation path is implemented in `src/lib/markdown.ts` and rendered with `set:html` in `src/pages/posts/[slug].astro`. The PDF proxy boundary is in `src/pages/api/pdf.ts` and tested by `tests/pdf-route.test.ts`. The PDF viewer runtime script wiring is in `src/components/features/PDFViewer.astro`. Theme variables are consumed widely in `src/pages/*`, `src/components/features/*`, and `src/styles/globals.css`, and the global shell currently imports tokens/base/global CSS from `src/components/layout/Layout.astro`.

## Plan of Work

Update markdown rendering by introducing an AST-level URL sanitizer that removes unsafe `href` and `src` schemes before HTML stringification. Then align the markdown safety tests to verify the new contract: raw script tags do not survive, and unsafe URL schemes are removed. Next, harden `src/pages/api/pdf.ts` by enforcing host + path constraints to this project and dataset and by rejecting oversized PDFs based on upstream `content-length`; expand route tests accordingly. Import missing theme files in `Layout.astro` so variables used throughout pages are always defined. Finally, fetch and commit pinned PDF.js runtime files into `public/vendor/pdfjs/3.11.174` and update `PDFViewer.astro` to load local script and worker paths.

## Concrete Steps

From repository root:

    apply code edits to:
      - src/lib/markdown.ts
      - tests/markdown-safety.test.ts
      - src/pages/api/pdf.ts
      - tests/pdf-route.test.ts
      - src/components/layout/Layout.astro
      - src/components/features/PDFViewer.astro

    fetch pinned PDF.js assets:
      - public/vendor/pdfjs/3.11.174/pdf.min.js
      - public/vendor/pdfjs/3.11.174/pdf.worker.min.js

    run:
      - npm run test
      - SANITY_PROJECT_ID=qnuj1c4o SANITY_DATASET=production SANITY_API_VERSION=2024-01-01 npm run build

## Validation and Acceptance

Acceptance criteria:

1. Markdown conversion output contains no `javascript:`/`data:` URI attributes for links or media.
2. `/api/pdf` rejects non-project/dataset file URLs and oversized payloads with explicit status codes.
3. Theme-dependent pages/components continue to render with defined CSS variables.
4. `PDFViewer` no longer loads runtime scripts from third-party CDNs.
5. Test and build commands succeed in this environment.

## Idempotence and Recovery

All edits are additive/refactoring and safe to re-run. Re-fetching vendor PDF assets overwrites pinned files at the same paths. If any change introduces regressions, restore prior behavior by reverting only the touched files listed above and re-running validation.

## Artifacts and Notes

Touched files:

- `src/lib/markdown.ts`
- `tests/markdown-safety.test.ts`
- `src/pages/api/pdf.ts`
- `tests/pdf-route.test.ts`
- `src/components/layout/Layout.astro`
- `src/components/features/PDFViewer.astro`
- `public/vendor/pdfjs/3.11.174/pdf.min.js`
- `public/vendor/pdfjs/3.11.174/pdf.worker.min.js`

## Interfaces and Dependencies

No new npm dependencies are introduced. Markdown sanitization is implemented in-process in `src/lib/markdown.ts` and must preserve the existing exported functions:

    markdownToHtml(markdown: string): string
    markdownToPlainText(markdown: string): string

PDF route handler interface remains:

    export async function GET({ request }: { request: Request }): Promise<Response>
