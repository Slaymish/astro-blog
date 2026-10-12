# Codex contributions: implementation and launch gate

Production submissions remain closed unless CODEX_CONTRIBUTIONS_ENABLED is explicitly set to true. This change does not set that flag, configure secrets, publish Sanity content or approve any report. Automated tests use synthetic data and mocked GitHub responses. Real GitHub login and deployed Netlify Blobs behaviour remain launch requirements.

## Contributor journey

The offline exporter in Slaymish/codex-usage-benchmark produces an aggregate v1 JSON report. Selecting a file in the browser validates and previews it locally without uploading. The browser uses the same strict validator as ingestion. A short-lived sessionStorage copy can carry the selected aggregate through the GitHub sign-in round trip; it expires after 15 minutes and is cleared on return, submission, withdrawal or sign-out. No filename, token or identity is stored there. If browser storage is unavailable, reselect the report after login.

The contributor signs in with GitHub, reviews the file and checks a separate storage consent box before pressing Submit for review. Public profile attribution is a different, unchecked checkbox. The API accepts exactly report, optIn and revision; it accepts no client-supplied identity or review status. The act of authenticated POST requests storage; optIn must be an explicit boolean. The server derives ownership from the GitHub numeric ID verified at login.

One account owns one complete snapshot. Uploading changed aggregates replaces the previous report and returns it to pending_review. Repeating identical aggregates preserves its review and original retention deadline, while allowing a profile choice change. Another account can independently contribute identical data. Reports are never merged or counted as multiple independent contributors from the same account. This is account deduplication, not proof that different GitHub accounts represent different people.

PATCH /api/codex-contribute updates only optIn and the current login. DELETE removes the aggregate, GitHub ID/login, consent, fingerprint and review status from the record. Both require the current revision and CSRF token. Withdrawal and removal of attribution remain available when submissions are paused; new opt-in and new reports are blocked. A service-linkable pseudonymous key and an empty marker remain to prevent stale browser requests from restoring deleted data. No old report or identity fields remain in the marker. Private account keys are stable across session-secret rotation.

## OAuth and request protection

GitHub OAuth uses no repository or email scopes, requests an account picker, and verifies /user on every login. It uses S256 PKCE, signed ten-minute state, and an atomic one-time server claim before token exchange. Failure consumes a valid state too. Tokens with extra scopes, bad identities, redirected responses or failed exchanges are rejected. Access tokens are never persisted, logged or sent to the browser.

The session cookie is Secure, HttpOnly, SameSite=Lax, host-only and Path=/api/, covering the sibling /api/codex-contribute route. State cookies are restricted to /api/codex/github. Old scaffold cookies at /api/codex are cleared. Signed opaque session cookies point at one-hour server sessions, which include a random CSRF token. Successful sign-in rotates and revokes an existing session; sign-out removes the server session. Every account mutation and sign-out requires the exact configured Origin and a matching X-Codex-CSRF token. Duplicate cookie names, stale sessions and purpose-confused signed tokens are rejected.

Reports are capped at 256,000 streamed bytes, with exact aggregate-only field allowlists and safe numeric totals. Extra fields are rejected; a model label can still convey personal information within the allowed format, so moderation and the privacy warning remain necessary. Hourly atomic write slots allow five submissions per account, twenty per address and twenty OAuth callbacks per address. Limits fail closed without RATE_LIMIT_SALT or confirmed storage writes. No raw address is persisted.

## Storage, moderation and retention

Strong-consistency stores codex-auth-v2, codex-accounts-v2 and codex-limits-v2 are separate from legacy codex-usage-reports. Deploy previews suffix all three names with the deploy ID from Netlify’s request-time context. Preview data cannot mix with production data. Existing unauthenticated legacy reports are not migrated, publicly listed or treated as verified. Their retention or removal requires a separate operator decision.

All account writes compare the current ETag, an opaque storage revision. New creates are conditional on absence. Updates and withdrawals compare the revision from GET /api/codex/github/me. Conflicts return 409 changed_reload instead of overwriting newer data. Every successful conditional write must return both modified=true and an ETag. Storage failures return 503 without claiming success.

A private reviewer inspects the stored report and approves exactly its fingerprint and ETag. scripts/review-codex-report.ts accepts an account key, reviewed fingerprint, current ETag and --accept-reviewed-report. It uses existing explicitly configured Netlify credentials through the Blobs SDK; do not create credentials in code or expose the private store in a browser. The helper refuses changed, expired or withdrawn data. There is no unauthenticated approval API or bulk approval.

Private reports expire 90 days after initial submission or changed data. Identical retries, consent edits and moderation do not extend that deadline. Expired records stop appearing immediately; netlify/functions/codex-retention.mts clears personal data hourly with conditional writes and removes expired immutable auth/limit entries. Empty withdrawal markers remain. Monitor scheduled-function failures before launch.

GET /api/codex/contributors lists only accepted, unexpired, opted-in accounts, once at least five such accounts exist. Below five it returns an empty list without a count. It exposes only login, a GitHub profile URL and a GitHub-owned avatar URL. Avatar URLs contain the opted-in public GitHub ID. It never exposes usage buckets, totals, months, report fingerprints, timestamps or pending/anonymous contributors. Responses use no-store; profile eligibility is checked from strong reads each time. Lists are capped at 1,000 scanned accounts; beyond that they fail closed until a suitable indexed listing is implemented. The endpoint does not publish statistical aggregates or change the calculator's illustrative assumptions.

## Sanity copy

All visible Codex page, calculator, contribution and browser-status copy now comes from the codexUsagePage singleton. Its schema is src/sanity/schemaTypes/codexUsagePage.ts; shared required keys and validation live in src/content/codexUsage.ts. Review docs/codex-usage-page.seed.json before publishing. scripts/publish-codex-copy.ts prints a dry-run by default, and creates the singleton only if absent with --publish, SANITY_WRITE_ACK=1 and an existing SANITY_API_TOKEN. Existing editorial copy is never overwritten.

No production Sanity write was made. Without the singleton, the page uses existing Sanity Work copy and a back link, has noindex, and does not render the calculator or sharing interface. Incomplete published copy fails the build. The sitemap and llms.txt list the tool when its copy exists; it is not an RSS article. After an approved content write, allow several minutes for Sanity CDN queries to purge and trigger a fresh build, following AGENTS.md. Deploy previews do not show seeded content automatically; local browser checks use a temporary fixture route, which is not committed.

## Required configuration and release validation

Register a GitHub OAuth App with homepage https://hamishburke.dev and exact callback https://hamishburke.dev/api/codex/github/callback. Request no privileged scopes. Configure CODEX_GITHUB_CLIENT_ID, CODEX_GITHUB_CLIENT_SECRET and a cryptographically random CODEX_AUTH_SECRET of at least 32 characters in Netlify's server/function environment. RATE_LIMIT_SALT must also exist. Never use PUBLIC_ variables, commit credentials, or put secrets in URLs. Rotating the auth secret invalidates existing login cookies; account keys remain stable.

For deploy-preview OAuth tests, register the exact preview callback, set CODEX_GITHUB_ORIGIN equal to DEPLOY_PRIME_URL and use CONTEXT=deploy-preview. GitHub now permits multiple exact redirect URIs on one OAuth App, so the registered Codex usage benchmark app covers both production and PR 45 without wildcards. The configured origin must be an exact HTTPS origin and the request must match it. Netlify runtime getContext() supplies the deploy context and ID for store isolation. Build-only CONTEXT, DEPLOY_ID and DEPLOY_PRIME_URL are not relied on in deployed request handlers. A production OAuth App callback will not work against an arbitrary preview. GitHub/App secrets and production content publication are operator configuration steps, not automated by this PR.

Before any launch, run pnpm test, pnpm build, pnpm test again, pnpm check and pnpm studio:build on the installed supported runtime. CI uses Node 22/pnpm 10. Locally pnpm 11 needs verify-deps-before-run=false when reusing an isolated worktree's linked existing dependencies; no lockfile or dependency changes are made. Run the companion Python suite with Python 3.10 or newer.

Then, on an isolated configured preview, test real GitHub login/cancel/failure, the cookie on the sibling ingestion path, callback replay, cross-origin writes, report validation, conditional-write conflicts, two-account ownership, separate profile consent, review of the current fingerprint, privacy suppression, replacement and withdrawal. Confirm actual storage ETags and strong reads, the scheduled retention job, deployed CSP/avatar loading and session revocation. Keep CODEX_CONTRIBUTIONS_ENABLED unset or false in production throughout. Only a separate launch decision after these checks should enable production submissions.

Automated route tests and mocked browser checks demonstrate the application logic. They are not evidence of real GitHub or Netlify end-to-end functionality. The calculator still uses illustrative subscription prices and capacities; token reports do not measure five-hour quotas, weekly resets or active coding duration.

## Existing dependency alerts

GitHub reports open alerts on the existing default-branch dependency graph.
Triage their actual build/runtime reachability and the existing dependency PRs
before launching submissions. This feature changes no package or lockfile and
does not claim those baseline alerts are remediated.

## Configuration progress, 12 October 2026

The Codex usage benchmark OAuth App is registered under Slaymish:
https://github.com/settings/applications/3925547. Its exact redirects are the
production callback and PR 45's callback, with wildcards and device flow off.
The public client ID is saved in Netlify. CODEX_CONTRIBUTIONS_ENABLED has been
explicitly set to false. Existing production RATE_LIMIT_SALT is preserved.

The reviewed codexUsagePage seed has been published to Sanity production and
verified via a fresh read. Publication triggered the existing Sanity build hook;
main remains the previously merged guarded ingestion code. A new preview build
is needed to consume the published copy after CDN purge.

Credential values are never recorded in this repository or chat. New signing
keys were generated in owner-only local files outside the repository. The user
has been handed the credential-entry step under the browser tool's rules. Actual
saved contexts must be verified before claiming configuration or real OAuth
verification complete. Production ingestion remains disabled throughout.

## Runtime deployment metadata

Live configuration revealed that CONTEXT, DEPLOY_ID and DEPLOY_PRIME_URL are
build variables and are absent from ordinary function runtime environments.
src/server/codexDeployment.ts now uses the installed @netlify/functions
getContext() API. Preview origins must be an exact deploy-preview hostname for
the runtime site name, and must still match the explicitly configured origin.
Unknown deployments cannot silently select a production store. Scheduled
retention uses the same runtime metadata; CLI review needs an explicit
CONTEXT=production outside a deployed request.

This fix is covered by three regression tests and 254 passing site tests with
published Sanity copy. All required secret contexts are saved: separate signing
keys for Production and Deploy Previews, the GitHub secret in both, and a separate
preview rate salt with the existing production salt preserved. Only the preview
submission flag is true for disposable tests; Production remains false.
