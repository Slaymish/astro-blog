# Interaction QA, 10 October 2026

The scroll smoothing was committed as `b015db0`. This pass concentrates on interruption and navigation around the homepage opening, with representative checks of the site's other interactive features. QA fixes are local and uncommitted.

## Findings fixed

The logo's interruption listeners previously attached after `document.fonts.ready`. Scrolling or typing while fonts were loading could reveal the introduction and then start a late logo animation. The listeners now attach before the await, and restored scroll positions, fragment navigation or an already revealed introduction skip the sequence. Completion clears the fallback timer and repeated initialisation cannot restart a completed name.

Leaving or hiding the page now settles the name and introduction immediately, rather than preserving partial opening states for browser back. A reduced-motion change reveals a pending introduction immediately, and resizing or changing motion preference cancels an active name relocation.

Pending wheel easing is cancelled when the tab becomes hidden, so its remaining movement cannot resume on return.

## Browser checks

Tested against the local dev site in the Codex in-app browser on macOS, at the default viewport, 320 × 740 and 1200 × 800. The tested pages reported no horizontal overflow.

| Scenario | Observed result |
| --- | --- |
| Reload, then immediately press Page Down | Name completes; introduction reveals; subsequent input does not replay either transition. |
| Scroll down, reload at that position | Position restored at 1473px; name and introduction already complete. |
| Return to top; navigate to About or a case study and use browser back | Completed opening stays stable; no repeated logo sequence. |
| Keyboard arrival and skip link | Tab reveals the introduction, focuses Skip to content; Enter targets `#main` with the main area below the sticky header. |
| Mobile menu | Escape closes and restores summary focus; outside click closes; following a link closes; changing to desktop closes an open disclosure. |
| Work filters | Writing plus AI showed four entries; reload retained both filters; back restored Writing alone with five entries. |
| Teaser pause and scrolling away/back | Manually paused clip remains paused; the other visible clip can play independently. |
| Contact form | Empty and malformed email blocked locally; form stayed idle. No mail was sent. |
| Reading recommendation | Empty recommendation blocked locally; no recommendation was submitted. |
| PDF report | Home Lab report loaded 13 pages; next/previous worked; zoom reached 125% and reset to 100%; no document overflow or alert. |
| GPU calculator | Model and EU preset updated results; out-of-range typed tariff did not introduce NaN or Infinity. |
| Image and script smoke checks | Case-study images loaded; browser error log was empty in the checked interactions. |
| Missing route and private stats | Missing route returned 404; stats returned 503 with its local access token unconfigured. |

## Regression checks

The new `tests/name-morph.test.ts` holds fonts unresolved while simulating early input, resizing, hiding, navigation away, restored positions and preference changes. It verifies that the ordinary name is immediately available and late font completion cannot start another animation. It also covers the font-loading timeout.

Additional hero tests cover reduced-motion changes, resizing during relocation, and preparing a stable page for return. The wheel tests cover hiding a tab in the middle of eased travel, alongside distance preservation, reversal, precision gestures, nested regions, modified input and document bounds.

Final validation: `pnpm run build`, post-build `pnpm run test` (216 passed), and `pnpm exec knip` passed. `pnpm run studio:build` also passed. Existing Studio warnings remain: no appId and the configured auto-update runtime serves Sanity 6.18.0 while local packages are 6.12.0. No dependencies were changed.

## Coverage limits

Live contact/recommendation delivery was not sent; endpoint behaviour is covered by mocked route and delivery tests. Production Netlify redirects, edge markdown negotiation and deployed caches cannot be reproduced by the local dev server; build-output, redirect and edge-function unit tests passed. No deployment or production dataset write occurred.

Reduced-motion transitions and delayed-font races were exercised with deterministic unit fixtures. This browser surface does not expose JavaScript disabling or network throttling, so this pass does not claim live emulation of those environments. The fallback heading remains ordinary server-rendered HTML, and the complete generated site passed its output checks.

## Follow-up: brief opening pause

At the user's request, the first downward wheel gesture at the top now holds the opening for 400ms. The name settles in 400ms and the text reveal uses an 80ms delay plus 320ms duration. Held wheel deltas are discarded; there is no queued movement on release. Keyboard, touch, direction reversal, modified gestures, nested scroll regions, resize, hiding and reduced motion remain escape routes or bypasses.

In the browser, the first wheel gesture left scrollY at zero with the brief reveal active. After the deadline the next wheel gesture moved to 720px and the text clip was fully open. Returning to the top and scrolling again moved normally; reloading at 720px revealed the intro without applying the hold. Unit tests cover the 400ms timer, one-time release, reversal and alternative input, restored positions and nested scroll regions. The updated build, knip and all 221 tests passed. This is a local, uncommitted trial.
