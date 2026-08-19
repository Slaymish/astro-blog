/**
 * Validation for the two attacker-controlled analytics payloads: the session
 * beacon posted to /api/collect, and the `ref` echoed back by the Cal.com
 * booking webhook.
 *
 * Both arrive from the public internet, so every field is validated rather
 * than trusted. Kept here rather than inline in the routes so the rules are
 * unit-testable without standing up a blob store.
 */

/** A page path as written by the browser: leading slash, no query or fragment. */
export const PATH_PATTERN = /^\/[\w\-/.]*$/;
/** A custom event name, as emitted by the client tracker. */
export const NAME_PATTERN = /^[a-z0-9-]{1,40}$/;
/** The opaque per-visitor nonce shared between beacons and booking links. */
export const NONCE_PATTERN = /^[a-z0-9]{4,32}$/;
/**
 * Where the browser keeps that nonce. Named for booking links because they
 * minted it first; the session beacon reuses the same value as its `s` field,
 * which is what lets a confirmed booking be joined back to a session.
 * Declared here so the client that writes it and the server that validates it
 * cannot drift apart.
 */
export const VISITOR_NONCE_KEY = 'booking-nonce';

/**
 * The most events one beacon may carry. The client tracker imports this to cap
 * its own buffer, so producer and validator agree by construction rather than
 * by two copies of the same number happening to match.
 */
export const MAX_EVENTS = 100;
const MAX_PATH_LENGTH = 120;

interface IncomingEvent {
  t?: unknown;
  p?: unknown;
  n?: unknown;
}

export interface CleanEvent {
  /** Milliseconds since the session started. */
  t: number;
  /** Page path. */
  p: string;
  /** Event name, absent for a plain pageview. */
  n?: string;
}

/**
 * Reduces an untrusted event array to the subset that is well-formed.
 * Malformed entries are dropped rather than rejecting the whole beacon: a
 * single bad event should not lose an otherwise valid session.
 */
export function cleanEvents(events: unknown): CleanEvent[] {
  if (!Array.isArray(events)) return [];

  return events
    .slice(0, MAX_EVENTS)
    .map((raw: IncomingEvent) => {
      const path =
        typeof raw?.p === 'string' && PATH_PATTERN.test(raw.p) ? raw.p.slice(0, MAX_PATH_LENGTH) : null;
      if (!path) return null;

      const offset = typeof raw?.t === 'number' && Number.isFinite(raw.t) ? Math.max(0, Math.round(raw.t)) : 0;
      const name = typeof raw?.n === 'string' && NAME_PATTERN.test(raw.n) ? raw.n : undefined;

      return { t: offset, p: path, ...(name ? { n: name } : {}) } satisfies CleanEvent;
    })
    .filter((event): event is CleanEvent => event !== null);
}

/** The visitor nonce, or null when absent or malformed. */
export function cleanNonce(value: unknown): string | null {
  return typeof value === 'string' && NONCE_PATTERN.test(value) ? value : null;
}

/** `ref` is written by the client as "<path>|<nonce>". Anything else is ignored. */
export function parseBookingRef(raw: unknown): { page: string; nonce: string } | null {
  if (typeof raw !== 'string') return null;

  const [page, nonce] = raw.split('|');
  if (!page || !PATH_PATTERN.test(page)) return null;

  return { page, nonce: cleanNonce(nonce) ?? 'unknown' };
}
