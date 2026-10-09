/**
 * Browser behaviour belonging to the document shell, booted by Base.astro
 * through this one entry point.
 *
 * One entry point rather than several because Astro hoists every bundled
 * `<script>` on a page into shared chunks; wrapping one in `{article && ...}`
 * makes the tag conditional but the hoisting is not, which shuffled the chunk
 * assignment and once dropped a shell script from non-article pages. The
 * page-specific initialisers below are no-ops when their markup is absent.
 */
import { initAnalytics } from './analyticsTracker';
import { initBookingRef } from './bookingRef';
import { initCodeCopy } from './codeCopy';
import { initContactForms } from './contactForm';
import { initRecommendForm } from './recommendForm';
import { initNavigation } from './navigation';
import { initTheme } from './theme';
import { initFeedFilter } from './feedFilter';
import { initWheelScroll } from './wheelScroll';

export function initShell(): void {
  initTheme();
  initNavigation();
  initWheelScroll();
  // Before the tracker: this is what mints the visitor nonce the beacon reads.
  initBookingRef();
  initAnalytics();
  initCodeCopy();
  initRecommendForm();
  initContactForms();
  initFeedFilter();
}
