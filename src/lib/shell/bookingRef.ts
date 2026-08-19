/**
 * Attributes completed bookings back to the page that produced them.
 *
 * Every page is prerendered, so the ref cannot be baked into the href at build
 * time. It is appended in the browser instead: Cal.com echoes `metadata[ref]`
 * on its BOOKING_CREATED webhook, which `/api/cal-webhook` parses back into a
 * page and a nonce via `parseBookingRef`.
 *
 * The format is "<path>|<nonce>" and is validated server-side; see
 * `PATH_PATTERN` and `NONCE_PATTERN` in `src/lib/analytics.ts`.
 */
import { ensureVisitorNonce } from './visitorNonce';

const CAL_LINK_SELECTOR = 'a[href*="cal.com/"]';
const REF_PARAM = 'metadata[ref]';

export function initBookingRef(): void {
  const ref = window.location.pathname + '|' + ensureVisitorNonce();

  document.querySelectorAll<HTMLAnchorElement>(CAL_LINK_SELECTOR).forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || href.includes(REF_PARAM)) return;

    link.setAttribute(
      'href',
      href + (href.includes('?') ? '&' : '?') + REF_PARAM + '=' + encodeURIComponent(ref)
    );
  });
}
