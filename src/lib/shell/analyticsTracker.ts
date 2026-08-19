/**
 * The client half of the analytics contract validated by `src/lib/analytics.ts`.
 *
 * Two things happen here. Named events go to Umami, which owns the dashboards.
 * The same events are also appended to an ordered sequence that is flushed once
 * per page view to `/api/collect`, because Umami's query API is a paid feature
 * and the nightly synthesis only needs the ordering.
 *
 * This used to be an inline `<script>` in Layout.astro, which meant the code
 * producing the beacon was neither type-checked nor testable against the code
 * validating it. It is a module so that `MAX_EVENTS` has exactly one
 * definition, and so the pure parts below can be unit-tested without a DOM.
 */
import { MAX_EVENTS } from '../analytics';
import { readVisitorNonce } from './visitorNonce';

declare global {
  interface Window {
    umami?: { track?: (name: string, data?: Record<string, unknown>) => void };
  }
}

/** Where the sequence beacon is posted. Handled by `src/pages/api/collect.ts`. */
const COLLECT_ENDPOINT = '/api/collect';

/**
 * Every event name this tracker can emit. `track` only accepts a member, so
 * an event name that would fail the server's `NAME_PATTERN` cannot be
 * introduced without the test in `tests/analytics-tracker.test.ts` failing.
 */
export const ANALYTICS_EVENT_NAMES = [
  'scroll-depth',
  'scroll-depth-final',
  'time-on-page',
  'cv-download',
  'cv-view',
  'email-click',
  'social-share',
  'outbound-click',
  'book-call',
  'work-view'
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

/** Scroll percentages that each fire `scroll-depth` once per page view. */
export const SCROLL_MILESTONES = [25, 50, 60, 75, 90, 100] as const;

/** One entry of the beacon's `e` array. Mirrors `CleanEvent` on the server. */
export interface SequenceEvent {
  t: number;
  p: string;
  n?: string;
}

export interface SequenceBuffer {
  readonly events: SequenceEvent[];
  push(name: AnalyticsEventName, at: number): void;
}

/**
 * The beacon payload as it accumulates. Capped at `MAX_EVENTS` — the same
 * constant `cleanEvents` truncates to — so a buffer that reaches the client
 * cap passes server validation with nothing dropped.
 *
 * `pathname` is captured once. Nothing in this site mutates history, and there
 * is no client-side router, so the path cannot change for the life of the page.
 */
export function createSequenceBuffer(pathname: string, startedAt: number): SequenceBuffer {
  const events: SequenceEvent[] = [{ t: 0, p: pathname }];

  return {
    events,
    push(name, at) {
      if (events.length >= MAX_EVENTS) return;
      events.push({ t: at - startedAt, p: pathname, n: name });
    }
  };
}

/** Scroll position as a whole percentage. Negative document heights yield null. */
export function scrollDepthPercent(scrollY: number, docHeight: number): number | null {
  if (docHeight <= 0) return null;
  return Math.round((scrollY / docHeight) * 100);
}

/** Which social network a share link points at. */
export function sharePlatform(href: string): 'twitter' | 'linkedin' | 'unknown' {
  if (href.includes('twitter.com') || href.includes('x.com')) return 'twitter';
  if (href.includes('linkedin.com')) return 'linkedin';
  return 'unknown';
}

/** Outbound destinations worth counting; anything else is not an event. */
export function outboundDestination(href: string): 'github' | 'linkedin' | null {
  if (href.includes('github.com')) return 'github';
  if (href.includes('linkedin.com')) return 'linkedin';
  return null;
}

/** A CV link that says "download" is a download; everything else is a view. */
export function cvEventName(label: string): AnalyticsEventName {
  return label.toLowerCase().includes('download') ? 'cv-download' : 'cv-view';
}

function onClick(selector: string, handler: (element: Element) => void): void {
  document.querySelectorAll(selector).forEach((element) => {
    element.addEventListener('click', () => handler(element));
  });
}

export function initAnalytics(): void {
  const startedAt = Date.now();
  const pathname = window.location.pathname;
  const sequence = createSequenceBuffer(pathname, startedAt);

  function track(name: AnalyticsEventName, data: Record<string, unknown>): void {
    if (typeof window.umami?.track === 'function') {
      window.umami.track(name, data);
    }
    sequence.push(name, Date.now());
  }

  let sequenceSent = false;
  function flushSequence(): void {
    if (sequenceSent || sequence.events.length === 0) return;
    sequenceSent = true;

    try {
      // sendBeacon survives the page being torn down; fetch often does not.
      // `s` is the same nonce attached to booking links, so a confirmed
      // booking can be joined back to the session that produced it.
      navigator.sendBeacon(
        COLLECT_ENDPOINT,
        new Blob([JSON.stringify({ s: readVisitorNonce(), e: sequence.events })], {
          type: 'application/json'
        })
      );
    } catch {
      // Losing a beacon must never surface to the visitor.
    }
  }

  let maxScroll = 0;
  const firedMilestones = new Set<number>();

  window.addEventListener(
    'scroll',
    () => {
      const percent = scrollDepthPercent(
        window.scrollY,
        document.documentElement.scrollHeight - window.innerHeight
      );
      if (percent === null) return;
      if (percent > maxScroll) maxScroll = percent;

      for (const milestone of SCROLL_MILESTONES) {
        if (percent >= milestone && !firedMilestones.has(milestone)) {
          firedMilestones.add(milestone);
          track('scroll-depth', { depth: milestone, page: pathname });
        }
      }
    },
    { passive: true }
  );

  onClick('a[href*="/cv"], a[href*="cv.pdf"], a[href*="CV"]', (element) => {
    track(cvEventName((element.textContent ?? '').trim()), { page: pathname });
  });

  onClick('a[href^="mailto:"]', () => {
    track('email-click', { page: pathname });
  });

  onClick('.share-link, a[href*="twitter.com/intent"], a[href*="linkedin.com/share"]', (element) => {
    track('social-share', {
      platform: sharePlatform(element.getAttribute('href') || ''),
      page: pathname
    });
  });

  onClick('a[target="_blank"], a[rel*="noopener"]', (element) => {
    const destination = outboundDestination(element.getAttribute('href') || '');
    if (destination) track('outbound-click', { destination, page: pathname });
  });

  onClick('a[href*="cal.com/hamishburke"]', (element) => {
    track('book-call', {
      page: pathname,
      placement: element.closest('header') ? 'header' : 'content'
    });
  });

  onClick('a[href="/work"], a[href^="/work/"]', (element) => {
    track('work-view', { page: pathname, destination: element.getAttribute('href') || '/work' });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'hidden') return;
    track('scroll-depth-final', { depth: maxScroll, page: pathname });
    track('time-on-page', { seconds: Math.round((Date.now() - startedAt) / 1000), page: pathname });
    flushSequence();
  });

  // pagehide covers the cases visibilitychange misses (bfcache, some iOS paths).
  window.addEventListener('pagehide', flushSequence);
}
