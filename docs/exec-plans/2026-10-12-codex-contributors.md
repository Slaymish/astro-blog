# Verify Codex contributions before public launch

This living plan follows PLANS.md. It covers the website and the companion exporter repository Slaymish/codex-usage-benchmark.

## Purpose / Big Picture

Visitors can inspect a local aggregate usage report, sign in with GitHub, explicitly submit it and choose public profile attribution separately. They can replace or withdraw their account's current contribution. Reports require private review before profiles become eligible for public display. The site must remain closed to production submissions until real OAuth and deployed storage behaviour have been tested.

## Progress

- [x] (2026-10-12) Read AGENTS.md, ARCHITECTURE.md and PRs 38 through 45; restored PR 45 to draft.
- [x] (2026-10-12) Implement signed PKCE state, atomic replay claims, server sessions, CSRF validation, account replacement, deletion and thresholded profiles.
- [x] (2026-10-12) Move the Codex page and contribution copy to a validated Sanity singleton; prepare reviewable seed copy.
- [x] (2026-10-12) Run 251 site tests, production build, Astro/knip checks, Studio build and 13 Python tests; all pass. Browser fixture checks pass at 320, 375 and 1280 pixels with mocked OAuth/API.
- [x] (2026-10-12) Review final diffs; update draft astro-blog PR 45 and create draft benchmark PR 3. GitHub CI and Netlify preview checks passed on code commit 80ec0f2.
- [ ] Separate launch work: publish approved Sanity copy, configure OAuth and Netlify secrets, exercise deployed login/storage/withdrawal, then explicitly approve production launch.

## Surprises & Discoveries

PR 45 was marked ready although its description called it a draft. Its signed state cookie alone permitted concurrent replay, and Path=/api/codex did not cover /api/codex-contribute. The ingestion foundation deduplicated across all users and had no conditional writes. The existing entire calculator page hardcoded visitor copy, contrary to AGENTS.md. The companion repository has no AGENTS.md or ARCHITECTURE.md on main.

## Decision Log

Decision: use the installed Netlify Blobs conditional writes with strong reads, rather than adding dependencies. Every account mutation must supply the revision (an ETag, an opaque version string) obtained from /me. Conditional writes reject stale revisions instead of overwriting newer data. Confirm writes using both modified and ETag because a failed SDK response can otherwise look successful. Date: 2026-10-12.

Decision: keep one complete report snapshot per verified numeric GitHub ID, privately keyed with a purpose-specific stable hash. Updates reset review when contents change. Identical reports from different accounts are independent. Date: 2026-10-12.

Decision: withdrawal overwrites all personal data with an empty marker. Removing the key itself would allow a delayed create with no revision to resurrect it. No report or identity remains in the marker, though its pseudonymous key remains linkable by the service. Date: 2026-10-12.

Decision: show only accepted, opted-in profiles once there are five eligible accounts globally. Expose no report totals, model/month buckets, timestamps, IDs as fields, or low-count sample counts. Avatar URLs inherently reveal the opted-in GitHub ID. No public statistical dataset is implemented. Date: 2026-10-12.

Decision: missing Sanity copy keeps the Codex tool unpublished instead of falling back to hardcoded prototype copy. Production content writes require separate approval under AGENTS.md, so seed copy is committed for review. Date: 2026-10-12.

## Outcomes & Retrospective

Implementation and local verification are complete. A manual final-diff review addressed session-secret rotation, callback replay, stale-tab resurrection, malformed telemetry, write confirmation and missing-copy discovery. Automated tests use synthetic reports and mocked GitHub responses; these cannot prove real GitHub OAuth or Netlify deployment behaviour. Public submissions remain disabled unless an operator sets the launch flag. No secrets or production content are changed in this task.

## Context and Orientation

src/pages/work/codex-usage.astro assembles the static page from Sanity. src/components/CodexReportPreview.astro renders a local preview and consent controls; src/client/codexContribution.ts handles files, sign-in and API calls. src/server/codexAuth.ts validates cookies and sessions, codexOAuth.ts handles GitHub login, codexContributions.ts owns account storage and privacy decisions, and codexStore.ts resolves strong-consistency stores. The existing aggregate v1 validator remains the report contract. The exporter runs offline with Python 3.10 or later and must never upload automatically.

## Plan of Work

First replace the draft authentication routes and strengthen the report validator. Add conditional account operations, the private reviewer helper and scheduled retention. Then share a Sanity copy contract across Studio, build validation and browser code. Update the companion validator and documentation to match the website contract, without reading personal session history. Run the security suite, pnpm tests/build/check and Studio build, then review the final diff and create draft PRs.

## Concrete Steps

In the website checkout run pnpm test, SANITY_PROJECT_ID=qnuj1c4o pnpm build, pnpm test again after building, SANITY_PROJECT_ID=qnuj1c4o pnpm check and pnpm studio:build. In the companion checkout run /opt/homebrew/bin/python3.13 -m unittest discover -s tests -v. Use existing package lockfiles and dependencies. Publish only feature branches; do not merge or push main.

## Validation and Acceptance

Synthetic route tests must demonstrate concurrent callback replay yields one session, forged identity fields fail, same-account updates replace reports, two accounts with identical reports remain independent, stale updates fail, consent does not approve a pending report, withdrawal removes stored personal fields, and lists suppress fewer than five opted-in accepted accounts. Disabled POST returns 503 before storage access. Invalid and oversized files cannot leave a previous file submittable. Production and preview stores are isolated. Build output must satisfy the existing CSP, style, link and accessibility checks.

## Idempotence and Recovery

Keep the existing local main checkout and unrelated catalogue work untouched, and work in an isolated Git worktree. Failed conditional writes return conflict and require refreshing account state. OAuth failures consume state and require a fresh sign-in. Withdrawals and opt-outs work while ingestion is paused. Store version 2 is separate from legacy unauthenticated reports, which must never be treated as verified. Keep CODEX_CONTRIBUTIONS_ENABLED unset or false to recover from an issue.

## Artifacts and Notes

See docs/codex-usage-contributions.md for the launch checklist and the Sanity seed document. Test evidence and final PR links will be recorded here after validation.

## Interfaces and Dependencies

Use the existing @netlify/blobs, Astro, Sanity, Node/Web Crypto and tsx dependencies. CodexStore exposes getWithMetadata, conditional setJSON, paginated list and delete. contributionRequest accepts a Request and optional test dependencies; acceptContribution requires account key, reviewed fingerprint and revision. No external dependency is added. Private account data expires after 90 days; the scheduled function removes expired data hourly, while public reads suppress it immediately at expiry.

Revision 2026-10-12: created after reviewing merged ingestion and draft authentication, to make security decisions and launch limits durable.

Revision 2026-10-12: account keys use stable private pseudonyms rather than the rotating session secret, so rotating OAuth session credentials cannot strand an account's withdrawal access. The key is not an anonymity guarantee.

Validation evidence, 2026-10-12:

    pnpm test: 251 passed, 0 failed, 0 skipped (after build)
    pnpm build: successful, 105 markdown twins
    pnpm check: 0 errors, 0 warnings, 0 hints; knip successful
    pnpm studio:build: successful
    Python unittest: 13 passed
    Browser fixture: local-only preview, invalid-file clearing, mocked sign-in,
      unchecked consent/attribution, explicit POST, withdrawal while paused,
      320/375/1280px no horizontal overflow, no page errors.

The temporary browser fixture route was removed. Studio reports its existing local/runtime auto-update version warning (6.12.0 versus 6.18.0); no dependency was changed. Existing open copy migration PR 33 uses the older repository layout and is not merged here; dependency PRs 30 and 35 remain separate. No production settings, secrets or Sanity documents were changed.

Delivered PRs: https://github.com/Slaymish/astro-blog/pull/45 and https://github.com/Slaymish/codex-usage-benchmark/pull/3. Main is untouched. GitHub Actions test/build/check/Studio validation and Netlify deploy/header/redirect checks passed for 80ec0f2. The GitHub CI annotation is only an upcoming runner image change notice.

GitHub reported existing default-branch dependency alerts during push. An API read confirmed open alerts, including packages used in build tooling. Their declared dependency scope alone does not establish request-time exploitability. Existing dependency PRs and alert remediation require separate triage before launch; this contributor PR changes no lockfile or package versions.

Revision 2026-10-12: marked implementation, review and draft PR delivery complete and recorded cloud check evidence. Real configured OAuth/storage launch tests and production content publication remain separate release work.

## Follow-up configuration, 12 October 2026

Hamish requested the remaining configuration and release prerequisites. The
OAuth App is registered at github.com/settings/applications/3925547 with exact
production and PR 45 callbacks, no wildcard matching and no device flow. Its
public client ID is saved in Netlify, and CODEX_CONTRIBUTIONS_ENABLED is
explicitly false. Sanity codexUsagePage was published using the existing write
credential, verified to match the seed, and triggered the existing build hook.

The browser tool requires human entry of new authentication credentials. The
client secret currently appears only in Production; Deploy Previews is Empty,
and CODEX_AUTH_SECRET is absent on a fresh dashboard reload. The user has been
handed the prepared fields and owner-only local signing-key files. These values
must be verified before real OAuth tests can proceed. Do not treat a reply saying
saved as proof when the service still shows missing configuration. No secret is
committed or printed.

Dependency triage is complete in docs/codex-dependency-triage.md: 80 pnpm
advisories across the site and Studio workspace, including known patched Astro
framework dependencies and unpatched build/dev tooling. Remediation is not
claimed. Production ingestion remains disabled.

Publishing the actual copy exposed the link suite's assumption that all links
resolve to static files. It now recognises source-backed, non-prerendered GET
endpoints for links, while continuing to require static files for media. The
build and all 251 tests pass with the real published copy; Astro/knip checks pass.

Remaining: verify saved credential contexts, configure the public preview origin
and preview-only test gate, rebuild the preview after settings and CDN purge,
then test real login, authenticated synthetic ingestion/replacement/withdrawal.
Keep production false and do not merge draft PR 45 as part of this setup.
