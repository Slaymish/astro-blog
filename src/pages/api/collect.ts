/**
 * First-party session-sequence collector.
 *
 * Umami Cloud keeps the dashboards, but its query API is a paid feature. The
 * nightly synthesis only needs ordered event sequences, so we collect those
 * ourselves: one batched beacon per page view, stored as one blob per beacon.
 *
 * Deliberately stores no IP address, user agent, referrer or cookie. The
 * visitor id is a random value minted in the browser and kept in localStorage;
 * it is not linkable to a person.
 */

import { getStore } from '@netlify/blobs';
import { cleanEvents, cleanNonce } from '../../lib/analytics';
import {
  COLLECT_LIMIT_PER_WINDOW,
  RATE_LIMIT_STORE,
  clientAddress,
  consume,
  counterKey,
  windowId
} from '../../lib/rateLimit';
import { SESSION_STORE, dayStamp, sessionKey } from '../../lib/sessionStore';

export const prerender = false;

const MAX_BODY_BYTES = 8 * 1024;

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

  const events = cleanEvents(payload.e);
  if (events.length === 0) {
    return new Response(null, { status: 204 });
  }

  // Metered here rather than at the top of the handler: the resource being
  // protected is the blob write, and a malformed request never reaches one.
  const window = windowId();
  const key = await counterKey(clientAddress(request.headers), window, process.env.RATE_LIMIT_SALT ?? '');
  const allowed = await consume(
    getStore(RATE_LIMIT_STORE),
    key,
    COLLECT_LIMIT_PER_WINDOW
  );

  if (!allowed) {
    return new Response(null, { status: 429, headers: { 'retry-after': '3600' } });
  }

  // The same opaque nonce that is attached to booking links, so a confirmed
  // booking can be joined back to the session that produced it.
  const visitor = cleanNonce(payload.s);

  const day = dayStamp();
  // One blob per beacon: concurrent sessions never contend for the same key.
  try {
    await getStore(SESSION_STORE).setJSON(sessionKey(day, crypto.randomUUID()), { day, visitor, events });
  } catch {
    // Losing an analytics beacon must never surface to the visitor.
    return new Response(null, { status: 204 });
  }

  return new Response(null, { status: 204 });
}
