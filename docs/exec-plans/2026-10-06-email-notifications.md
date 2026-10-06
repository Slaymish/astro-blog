# Email book recommendations and callback requests

This ExecPlan is maintained in accordance with `PLANS.md`. Keep Progress,
Surprises & Discoveries, Decision Log, and Outcomes & Retrospective current.

## Purpose / Big Picture

A visitor can recommend a book or leave an email address in a contact banner.
Hamish receives both notifications at hamishapps@gmail.com and can reply to a
callback request directly from Gmail. The banner reuses the site's existing
ContactBand rather than adding another design. The form works without JavaScript.

## Progress

- [x] (2026-10-06) Inspect existing routes, Sanity copy, secrets and contact band.
- [x] (2026-10-06) User selected Resend and approved the contact form copy.
- [x] (2026-10-06) Implement notification helper, callback route, native result page, form and browser enhancement.
- [x] (2026-10-06) Add Sanity fields and prepare the exact content patch for review.
- [x] (2026-10-06) Focused route tests pass, including simulated successful and failed delivery.
- [x] (2026-10-06) Full build, all 192 tests, unused-code check and Studio build pass.
- [x] (2026-10-06) User approved publication and deployment.
- [x] (2026-10-06 00:16Z) Approved copy published using the existing Sanity CLI login.
- [x] (2026-10-06) Configured NOTIFICATION_FROM and RATE_LIMIT_SALT in production Netlify.
- [x] (2026-10-06) Browser verified desktop layout, mobile layout at 390px without horizontal overflow, delivery error state, and native confirmation page.
- [x] (2026-10-06) User added RESEND_API_KEY; confirmed it includes functions scope and production context.
- [x] (2026-10-06) After the propagation wait, deployed to production and verified both live submissions return success from the email provider.
- [x] (2026-10-06) Feature committed as f643e06 and pushed to main. The repository-triggered production deploy is ready and verified.

## Surprises & Discoveries

The old recommendation route claimed success outside Netlify without storing
anything. Both routes now report unavailable when the backing services cannot
run. Resend's domain screenshot showed sending enabled and DKIM verified, with a
pending send CNAME. Public DNS returned send.forge.rmta.net during this work.
DNS alone does not establish whether the account will accept a send.

## Decision Log

- Decision: Call Resend's HTTP API with native fetch.
  Rationale: No new dependency or separate email service is needed.
  Date/Author: 2026-10-06, Codex.
- Decision: Keep callback addresses only in the notification email.
  Rationale: Hamish needs to reply, without adding a database of contact addresses.
  Date/Author: 2026-10-06, Codex.
- Decision: Store book recommendations before sending, but report delivery errors.
  Rationale: Failed email must not discard the book or claim successful delivery.
  Date/Author: 2026-10-06, Codex.
- Decision: Keep banner form copy optional until published in Sanity.
  Rationale: The existing production document has no form fields. A code deployment
  should preserve the banner while the reviewed content awaits publication.
  Date/Author: 2026-10-06, Codex.

## Outcomes & Retrospective

Implementation passes full validation: 192 tests, site build, Astro checks,
knip and Studio build. Production copy is published and the site is deployed. Both live submission
flows returned 200 with notifications accepted by Resend. The book submission
was stored as well. Direct Gmail inbox access is unavailable; acceptance by the
email provider is verified, not inbox arrival. Retrying a
book recommendation after a delivery error can save a duplicate; the first
recommendation remains inspectable through the existing private stats page.

## Context and Orientation

Astro builds static pages from Sanity. Routes exporting prerender=false run on
Netlify for each request. src/pages/api/recommend.ts already accepted book titles
and used Netlify Blobs, a hosted key/value store, to save them. ContactBand.astro
already appears on the contact and work pages. siteSettings is a Sanity singleton,
a single document holding shared copy. Its contactBand.form object now supplies
all callback form wording. src/client/shell.ts initialises browser behaviour.

## Plan of Work

src/server/email.ts sends plain-text notifications using secrets.ts and the
existing CONTACT_EMAIL constant. src/server/submission.ts bounds both JSON and
native form bodies to 2048 bytes and rejects foreign Origin headers. The callback
route validates one reply address using src/server/contact.ts and meters requests
through the existing rate-limits store. It stores no callback address. The book
route retains its recommendations store and emails each accepted title.

src/components/ContactForm.astro supplies the reusable native form. ContactBand
renders it when Sanity copy exists. src/client/contactForm.ts enhances it with
inline status updates. src/pages/contact/sent.astro supplies the native form's
result page using the same copy and excludes that page from search indexing.

## Concrete Steps

From /Users/hamish/Documents/Personal/astro-blog run pnpm run build, then pnpm run
test, pnpm exec knip and pnpm run studio:build. Successful results have no failed
tests or type errors. The focused notification-delivery test stubs the actual
Blobs and Resend network requests, so running it sends no external messages.

After approval, apply docs/exec-plans/contact-form-copy.json to Sanity project
qnuj1c4o, dataset production. Its mutation changes only contactBand.form in the
existing Site Settings document. Respect SANITY_WRITE_ACK=1 for production write
scripts. Set RESEND_API_KEY and NOTIFICATION_FROM in Netlify's runtime environment.
Use a sender at the Resend-enabled hamishburke.dev domain. Do not print or commit
the API key. Deploy only after approval. Wait several minutes after the content
write and trigger a later build because the first build can race CDN invalidation.

## Validation and Acceptance

Tests must confirm invalid emails and titles are rejected, body sizes are bounded,
rate counters for contact and recommendations are separate, notification recipients
are Hamish's Gmail, contact reply_to is the submitted address, and Resend failures
return errors. The book blob remains when sending fails. Native posts redirect to
the appropriate result page. No external messages are sent by automated tests.

On a deploy preview, inspect the banner on contact and work pages at narrow and
wide widths. Submit a callback email both with JavaScript enabled and disabled,
and confirm Gmail has the notification and replying addresses the visitor.
Submit a book title and confirm Gmail and stats contain it. Verify the final
production deploy permalink on more than one page after publishing Sanity copy.

## Idempotence and Recovery

The content patch sets only one object and is safe to repeat with identical copy.
No schema mirror, dependency change, new blob store or deletion is needed. Keep
existing contact links visible while form copy is absent. If Resend cannot send,
forms report errors rather than claiming delivery. Leave credentials server-side.

## Artifacts and Notes

Focused validation: 16 tests passed, zero failed. Full validation: 192 tests
passed, zero failed; site build, knip and Studio build passed. The reviewable content mutation
is docs/exec-plans/contact-form-copy.json. The Netlify site is hamishswords (29001146-bec3-4edb-8751-9378a0204baa).
The direct Netlify environment API confirmed RESEND_API_KEY was absent.
NOTIFICATION_FROM and RATE_LIMIT_SALT were configured using that API.
The local .env Sanity token returned 401; the existing Sanity CLI login
successfully applied the patch, transaction 4Uon20R3fRb2VIjNABBMS4.

## Interfaces and Dependencies

sendNotification(subject: string, text: string, replyTo?: string): Promise<void>
uses https://api.resend.com/emails. RESEND_API_KEY and NOTIFICATION_FROM are runtime
secrets. ContactFormCopy has lead, emailLabel, button, sending, success, error and
limited strings. The existing @netlify/blobs package provides rate counters and
recommendation storage. No additional dependencies are introduced.

Revision 2026-10-06: recorded implementation and approved copy; production actions
remain pending because AGENTS.md requires approval for content writes and deploys.

Revision 2026-10-06: full validation passed; recorded Netlify site identity and
unverified runtime configuration. No production write or deployment was run.

Revision 2026-10-06: user approved release; published the reviewed copy, configured
sender and rate-limit salt, and verified responsive UI. Deployment awaits the
Resend key requested from the user.

Revision 2026-10-06: after waiting several minutes, rebuilt with the published
copy and confirmed all 192 tests still pass. Verified deploy preview
https://6ac44068bdab5299a38be779--hamishswords.netlify.app contains the banner on
/contact and /work. Invalid JSON submissions return 400, native invalid form
submissions redirect to the error page, and the native result page renders.
Production deployment and real email sending remain pending RESEND_API_KEY.

Manual CLI deployment discovery: the generated .netlify/v1/functions directory
was not picked up by this local CLI invocation, and its legacy internal function
cache omitted SSR. A working preview was uploaded with --no-build,
--skip-functions-cache and --functions /tmp/astro-blog-email-functions. That
temporary directory contains a complete copy of .netlify/v1/functions/ssr and a
copy of session-insights.mts with local source imports resolved to absolute
repository paths. It preserves both the ssr and scheduled session-insights
functions. Verify both names through getDeploy before promoting a manual deploy.
No production deploy was performed. The generated function copies are ignored
or temporary, not source changes. The Resend key remains a required user action.

Revision 2026-10-06: RESEND_API_KEY is configured for production functions.
Production deploy 6ac44158df568e929458aed2 includes ssr and scheduled
session-insights. Its permalink serves the form on /contact and /work.
POST https://hamishburke.dev/api/contact with Hamish's own email returned
200 {"ok":true}. POST /api/recommend with "The Pragmatic Programmer (email
notification test)" returned 200 {"ok":true,"stored":true}. Both responses
require successful Resend acceptance. This deliberately labelled test remains
in the recommendations store. No direct inbox delivery check was possible.

Revision 2026-10-06: feature commit f643e06 is on origin/main. Repository-triggered
production deploy 6ac4419e62a772000833251d is ready, preserving both server and
scheduled functions. Its permalink includes the published form on /contact and
/work, the contact endpoint rejects invalid input with JSON 400, and the native
confirmation page renders. Live notification requests were already accepted
before this source deployment; repeat sending was unnecessary. Resend delivery
report access returned 403 with the sending key, so Gmail inbox arrival is not
claimed. Implementation, publication, source persistence and deployment are
complete. Existing user edits to package.json and .claude/settings.local.json
were excluded from the feature commits.
