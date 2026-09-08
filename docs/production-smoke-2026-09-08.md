# September redesign: production smoke test

Run on 8 September 2026, approximately 22:15–22:30 NZST, against https://hamishburke.dev.

The public routes, redirects, retired-content responses, CV PDF and booking calendar passed. Repository fixes for canonical URLs and navigation are verified locally but are not deployed. Analytics receiver health and the deployed event emitter passed the checks below; dashboard ingestion and completed-booking attribution remain unverified.

## Production results

| Check | Observed result |
| --- | --- |
| `/`, `/work`, `/about`, `/cv` | HTTP 200; rendered in the browser with the September content and layout. Homepage features You Inc, Sprint Coach and Home Lab. Work lists seven stories. |
| CV | About's CV link opens `/cv`. The academic archive is clearly labelled. `/cv.pdf` returns 200, `application/pdf`, and valid PDF file magic. |
| Booking | `/contact`, `/work/sprint-coach` and `/work/brontehf` expose the Cal.com link. Browser execution appends `metadata[ref]` containing the source path and a shared visitor nonce. The calendar loads in Pacific/Auckland and offers 30-minute slots on 9 September. No appointment was created. |
| Booking placement | No booking links on `/`, `/work`, `/about` or `/cv`, consistent with the current templates. Professional stories and Contact retain booking access. |
| Legacy index | `/projects` and `/projects/` return 301 to `/work`. |
| Legacy projects | Each of `/projects/sprint-coach`, `/projects/brontehf`, `/projects/you-inc`, `/projects/gpu-share` and `/projects/health-agent` returns 301 to its corresponding `/work/` URL. Every destination returns 200. |
| Legacy post | `/posts/gpu-share` returns 301 to `/posts/building-a-private-ai-server-for-friends`, which returns 200. |
| Retired projects | `/projects/bedroom-layout-designer`, `/projects/drop-eta`, `/projects/otto`, `/projects/piano-improvisation-helper` and `/projects/wiki-router` each return 410 with the “No longer published” document. `/projects/otto/` also returns 410. |
| Retired report | `/reports/a-survey-of-nosql-databases-and-polyglot-persistence-patterns` returns 410 with the same document. |
| Host redirects | HTTP and HTTPS www requests for `/work` each return 301 to `https://hamishburke.dev/work`. |
| Discovery | `/sitemap.xml`, `/robots.txt` and `/llms.txt` return 200 with the expected content types. |
| Private endpoints | Unauthenticated `/stats` and `/api/insights` return 401. An unsigned POST to `/api/cal-webhook` returns 401, “Invalid signature”. |

## Repository fixes

1. Production `/` declared `/index.html` as canonical; `/work` declared `/work.html`. This also affected Open Graph and structured page metadata. Astro supplies output filenames during file-format prerendering. `publicPathFromAstro` now normalizes these to public routes before canonical generation. Explicit canonical overrides retain precedence. The sitemap and crawl helpers already use public paths and needed no changes.
2. The same filename mismatch prevented the homepage logo and index navigation from receiving their active state. Header now uses the shared public-path helper.
3. Desktop anchors had `role="listitem"`, overriding their link role. The production accessibility tree exposed Work, Writing, About and Email as text. Removed the inappropriate list roles, preserving native anchor semantics.

Validation: 94 tests passed; `pnpm run build` completed with zero Astro errors, warnings or hints. Generated HTML was inspected for canonical and Open Graph URLs, homepage/index active attributes, and removal of anchor role overrides. Regression tests cover prerender filenames, normal public routes and canonical overrides. `git diff --check` passed.

## Analytics evidence and limits

- The production HTML contains Umami's configured website ID and the complete inline shell. Once deferred scripts ran, booking refs appeared and no errors were reported by the available browser console inspection.
- Executed the exact deployed inline shell in an isolated DOM fixture. Click, scroll and visibility handlers emitted all ten names: `book-call`, `cv-download`, `cv-view`, `email-click`, `outbound-click`, `scroll-depth`, `scroll-depth-final`, `social-share`, `time-on-page`, and `work-view`. It made 16 Umami calls and one deduplicated collector beacon containing 17 sequence entries. Booking metadata matched the beacon nonce. This checks the deployed emitter, not real-browser network delivery.
- A labelled synthetic `book-call` POST to `https://gateway.umami.is/api/send` returned 200. It carries `data.smoke_test = "2026-09-08"`. A collector probe using nonce `smoke20260908`, a `/contact` pageview and `book-call` returned 204. These probes may appear in analytics and should be excluded from interpretation of real visitor activity.
- A successful HTTP response does not prove persistence: the collector deliberately returns 204 even when storage is unavailable or a write fails. Umami dashboard access redirected to login. No authenticated dashboard, blob readback or completed Cal.com webhook was available for verification.

## External configuration and follow-up

- Cloudflare Rocket Loader is enabled: production HTML rewrites both the Umami script and shell module types. Booking refs were absent on the initial browser snapshot and appeared later. The shell eventually ran, so this is a deferred-execution observation, not a confirmed permanent analytics outage. If early clicks are missing in Umami, review Rocket Loader for this site and repeat the browser-to-dashboard check. No Cloudflare settings or CSP permissions were changed.
- Python urllib probes received 403 while curl and browser requests succeeded. The exact filtering rule was not established; these responses were not counted as failed public routes.
- No confirmed DNS, redirect, calendar-availability or analytics-receiver configuration failure was found. Outstanding external verification is authenticated Umami event ingestion, collector blob persistence, and real completed-booking attribution through Cal.com. No booking or CMS write was performed to force those checks.

The source fixes require a normal deployment and a short production recheck of metadata and navigation. No deployment was performed during this smoke test.
