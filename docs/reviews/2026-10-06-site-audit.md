# Site maintainability and usability review

Reviewed on 6 October 2026. This review covers route assembly, the shared document shell, content fetching and rendering, browser behaviours, design tokens and controls, server helpers, Astro/Netlify configuration, CI and Studio. Changes preserve the existing visual direction and rendering architecture.

## Implemented improvements

Theme initialisation now ignores invalid saved preferences rather than treating them as a deliberate choice and ceasing to follow the system. Native form-control colours come from the existing CSS theme classes. Browser chrome reads the canvas token after initialisation instead of maintaining a second JavaScript palette. The initial media-scoped metadata stays available before styles load.

Code-copy controls now use the shared button primitives, remain visible on touch screens and reserve space above the code. Clipboard access is checked before controls are created; rejected writes are caught and leave the text selectable. Repeated successful copies reset the confirmation timer. Copying a preformatted block without a code child excludes the button's own label.

The homepage no longer emits an empty heading and an unnamed section when Sanity's moreWorkHeading is blank. The optional heading can still appear when authored; the existing All work link remains available.

Navigation distinguishes the exact current page from its parent section using aria-current. The mobile disclosure relies on native expanded-state semantics before JavaScript runs. Expanded and media-overlay control styling now lives in primitives.css, including the native open disclosure state, rather than being repeated in templates. Control borders use the existing contrasting control token.

Regression coverage executes the actual pre-paint script with saved, invalid and blocked-storage preferences. Built-output checks now reject empty headings and sections whose referenced labels are missing or empty. ARCHITECTURE.md records the theme ownership rule.

## Verification

The initial test run read obsolete dist files and failed seven build-output assertions. A fresh baseline build followed by tests passed all 165 existing tests. After the changes, the build produced 28 markdown twins and all 169 tests passed with no skips. Astro check reported zero errors, warnings or hints; knip reported no unused exports, files or dependencies. Studio built successfully.

Browser checks covered the homepage, work index, reading, about, contact, CV, legal pages, 404, a project, an article, a report and a topic page at the narrow browser viewport. No document-wide horizontal overflow was found. Article code remains scrollable within its own block. Desktop homepage layout was inspected too. Filtering to Writing showed five writing entries and updated the URL; opening the mobile menu and pressing Escape closed it and returned focus to the summary. Article controls and the theme's native colour scheme were inspected after the edits.

These are developer-led usability checks, not a study with representative visitors. Production edge negotiation and secret-dependent Netlify handlers were covered by existing tests rather than a deployment during this review.

## Remaining decisions

The existing uncommitted package.json change pins pnpm 11.24.0, while .github/workflows/ci.yml explicitly selects pnpm 10 and AGENTS.md describes that version. Resolve the package-manager version deliberately across local development and CI; this audit did not alter the user's package changes or dependencies.

Studio's build warns that its automatic-update runtime serves Sanity and Vision 6.17.0 while local versions are 6.12.0. Choose whether to align local dependencies or disable automatic updates in a separate dependency/configuration change. Both require attention to the repository's approval rule for dependency changes.

Some existing interface copy remains authored in templates and client modules, notably GpuCalculator.astro and PdfViewer.astro. This predates the audit and does not match the repository's Sanity-only copy rule. Moving it requires a schema, query and dataset rollout together; do not remove the working defaults before the content exists. No production content was written during this review.

The current shared content memoisation, dynamic PDF import, static markdown generation, canonical helpers and central redirect policy have concrete responsibilities. Knip found no dead module/dependency cleanup to justify removing them. Avoid speculative rewrites of those boundaries.

## Homepage follow-up from browser comments

Writing now appears after the second featured case study and reading after the fourth, using the same Sanity-authored copy. Both use a dedicated row with a consistent label/content alignment and collapse to one column on phones. The writing actions share the underlined ghost-button treatment and arrow icon. The footer presents Contact, CV and RSS as its main destinations, with Privacy and Terms in a smaller separate row; direct social and email destinations remain available through Contact.

Desktop and phone layouts were visually checked after the changes. The production build, all 169 tests and knip pass. No dataset write or deploy was performed.
