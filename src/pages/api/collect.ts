/**
 * First-party session-sequence collector.
 *
 * Umami Cloud keeps the dashboards, but its query API is a paid feature. The
 * nightly synthesis only needs ordered event sequences, so we collect those
 * ourselves: one batched beacon per session, stored as one blob per session.
 *
 * Deliberately stores no IP address, user agent, referrer or cookie. The
 * session id is a random per-tab value generated in the browser and is not
 * linkable to a person.
 */

import { getStore } from '@netlify/blobs';

export const prerender = false;

const MAX_BODY_BYTES = 8 * 1024;
const MAX_EVENTS = 100;
const PATH_PATTERN = /^\/[\w\-/.]*$/;
const NAME_PATTERN = /^[a-z0-9-]{1,40}$/;
const NONCE_PATTERN = /^[a-z0-9]{4,32}$/;

interface IncomingEvent {
  t?: unknown;
  p?: unknown;
  n?: unknown;
}

interface CleanEvent {
  /** Milliseconds since the session started. */
  t: number;
  /** Page path. */
  p: string;
  /** Event name, absent for a plain pageview. */
  n?: string;
}

/**
 * Everything is attacker-controlled, so each field is validated rather than
 * trusted — an unbounded blob store is otherwise a free write primitive.
 */
function clean(events: unknown): CleanEvent[] {
  if (!Array.isArray(events)) return [];

  return events
    .slice(0, MAX_EVENTS)
    .map((raw: IncomingEvent) => {
      const path = typeof raw?.p === 'string' && PATH_PATTERN.test(raw.p) ? raw.p.slice(0, 120) : null;
      if (!path) return null;

      const offset = typeof raw?.t === 'number' && Number.isFinite(raw.t) ? Math.max(0, Math.round(raw.t)) : 0;
      const name = typeof raw?.n === 'string' && NAME_PATTERN.test(raw.n) ? raw.n : undefined;

      return { t: offset, p: path, ...(name ? { n: name } : {}) } satisfies CleanEvent;
    })
    .filter((event): event is CleanEvent => event !== null);
}

export async function POST({ request }: { request: Request }) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return new Response(null, { status: 413 });
  }

  let payload: { s?: unknown; e?: unknown };
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response(null, { status: 400 });
  }

  const events = clean(payload.e);
  if (events.length === 0) {
    return new Response(null, { status: 204 });
  }

  // The same opaque nonce that is attached to booking links, so a confirmed
  // booking can be joined back to the session that produced it.
  const visitor = typeof payload.s === 'string' && NONCE_PATTERN.test(payload.s) ? payload.s : null;

  const day = new Date().toISOString().slice(0, 10);
  // One blob per session: concurrent sessions never contend for the same key.
  const key = `${day}/${crypto.randomUUID()}`;

  try {
    await getStore('sessions').setJSON(key, { day, visitor, events });
  } catch {
    // Losing an analytics beacon must never surface to the visitor.
    return new Response(null, { status: 204 });
  }

  return new Response(null, { status: 204 });
}
