# Approved Website Copy Migration

## Purpose / Big Picture

This change turns the approved copy audit into a reviewable migration without making a production write. The repository will contain the source updates needed to make the local build agree with the public content model, plus a guarded Sanity migration that can be dry-run, applied later with explicit acknowledgement, and rolled back only when the published documents have not changed since the migration.

## Progress

- [x] (2026-10-03) Freeze all 86 approved findings in `scripts/copy-migration/approved.json` with an explicit CMS, source, keep or factual-dependency disposition.
- [x] (2026-10-03) Add exact before-value guards, revision guards, draft/release blocking, rich-text preservation and rollback planning.
- [x] (2026-10-03) Reconcile the approved source changes and CMS shape mismatches in the Astro routes, data transforms, schemas, seed scripts and interactive copy.
- [x] (2026-10-03) Add migration tests for idempotency, conflicts, rich text, backups, rollback and all-finding coverage.
- [x] (2026-10-03) Run the authenticated read-only dry run against `qnuj1c4o/production`.
- [ ] Apply the migration or deploy the site. This remains a separate, explicitly authorised operation.

## Surprises & Discoveries

- The public `aboutPage` currently stores some copy at the top level while the local renderer expects nested `hero` and `portrait` objects. The adapter and guarded migration preserve the existing linked Portable Text mark while moving the approved copy into the canonical shape.
- The City story is an older document shape. Its cover image and existing section headings provide the fallback data needed by the current work validator; no new result or measurement is invented.
- The calculator compared NZD electricity with USD token prices and called the result an equivalence. The source change removes the unsupported cloud comparison and exposes power and throughput as assumptions.
- The public writing singleton already contains SEO, filter and empty-state fields. Only its missing hero eyebrow is a real shape difference; earlier audit wording that called those three fields missing was corrected in the review artifact.

## Decision Log

- Decision: Keep the migration dry-run by default and require `--apply`, `SANITY_WRITE_ACK=1` and the reviewed manifest hash for writes.
  Rationale: The approved copy includes factual dependencies and Sanity writes affect prerendered production content.
  Date/Author: 2026-10-03 / Codex.
- Decision: Refuse a document when any approved before value, revision, draft or release guard differs.
  Rationale: An editor change must be reviewed rather than overwritten.
  Date/Author: 2026-10-03 / Codex.
- Decision: Preserve original academic PDFs and add a labelled author note for the wildfire interpretation.
  Rationale: A submitted report is an archive artifact, not mutable website prose.
  Date/Author: 2026-10-03 / Codex.

## Context and Orientation

Sanity is the published content source and Astro prerenders its pages. `scripts/migrate-approved-copy.ts` reads authenticated raw Sanity documents, checks the frozen manifest, and writes only the listed fields in published documents. It never publishes drafts or versions. `scripts/copy-migration/core.ts` contains the pure planning and rollback logic. `scripts/copy-migration/approved.json` contains all approved wording, stable document targets and exact before/after values.

The source changes are ordinary repository edits. They include canonical adapters for page singletons, The City’s existing cover data, safer work validation, the calculator assumptions, the author note beside the wildfire PDF, and guarded legacy seed scripts. No production CMS write, deployment, commit or push is part of this change.

## Concrete Steps

Run from the repository root with Node 22 and the existing pnpm dependency tree:

    pnpm exec tsx --env-file=/absolute/private.env scripts/migrate-approved-copy.ts --out /absolute/outside-git-directory

The command performs a read-only authenticated raw read, rechecks source fingerprints, fetches the public routes for comparison, and writes a private JSON report outside Git. It exits non-zero for a content conflict. To apply a reviewed plan later, use the printed manifest hash:

    SANITY_WRITE_ACK=1 pnpm exec tsx --env-file=/absolute/private.env scripts/migrate-approved-copy.ts --apply --plan-sha256 HASH --out /absolute/outside-git-directory

The apply path also re-reads raw documents immediately before the transaction, creates a private receipt, and refuses to proceed if an editor has changed the content. Rollback is explicit and revision guarded:

    SANITY_WRITE_ACK=1 pnpm exec tsx --env-file=/absolute/private.env scripts/migrate-approved-copy.ts --rollback /absolute/outside-git-directory/backup-ID.json --apply --plan-sha256 HASH --out /absolute/outside-git-directory

## Validation and Acceptance

Run `pnpm run test` and `pnpm exec astro check` with the Sanity project variables available. Run `pnpm run build` to confirm all prerendered routes still build. The migration tests must cover all 86 findings, exact guards, unchanged unrelated fields, repeated planning, rich-text keys and marks, draft/release refusal, backup receipts and rollback refusal after an editor change.

The completed read-only dry run on 2026-10-03 planned 23 documents, verified 23 source fingerprints, found zero conflicts, and observed zero drafts or release versions. It did not write to Sanity or deploy Netlify.

## Idempotence and Recovery

Running the dry run repeatedly is safe. An already-applied field is reported as already applied. An unexpected edit produces a conflict and no write. A successful apply creates a receipt outside the repository. Rollback only plans fields whose current revision and values exactly match the post-apply receipt; otherwise it reports a conflict and leaves the document untouched.

## Outcomes & Retrospective

The implementation covers every approved finding. The five factual dependencies remain explicit: The City CLI billing behaviour, HealthAgent progress and demo availability, CV dates, and the two archive-PDF editorial editions. They are not guessed or silently published.

