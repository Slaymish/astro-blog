/**
 * Browser behaviour belonging to the document shell, booted by Layout.astro
 * through this one entry point. Mirrors `src/lib/circuit/`: the Astro
 * component renders markup and imports a module, rather than carrying a
 * hundred lines of untyped inline script.
 *
 * One entry point rather than several because Astro hoists every bundled
 * `<script>` on a page into shared chunks; wrapping one in `{article && ...}`
 * makes the tag conditional but the hoisting is not, which shuffled the
 * chunk assignment and dropped the circuit overlay from non-article pages.
 *
 * `theme.ts` is deliberately absent: it holds build-time constants for the two
 * scripts that must stay inline, not runtime behaviour.
 */
import { initAmbientBackground } from './ambientBackground';
import { initAnalytics } from './analyticsTracker';
import { initBookingRef } from './bookingRef';
import { initCodeCopy } from './codeCopy';

export function initShell(): void {
  initAmbientBackground();
  // Before the tracker: this is what mints the visitor nonce the beacon reads.
  initBookingRef();
  initAnalytics();
  // A no-op unless the page rendered `.prose pre`, which only article pages do.
  initCodeCopy();
}
