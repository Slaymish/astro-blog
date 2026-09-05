/**
 * Receives one book title from the recommendation box on /reading and stores it
 * as a blob. Nothing about the sender is kept: no IP, agent, referrer or cookie,
 * and no reply address, which is why the success state points people at email.
 */

import { getStore, type Store } from '@netlify/blobs';
import {
  MAX_RECOMMENDATION_LENGTH,
  RECOMMEND_LIMIT_PER_WINDOW,
  RECOMMENDATION_STORE,
  cleanRecommendation,
  recommendationKey
} from '../../lib/recommendations';
import { RATE_LIMIT_STORE, clientAddress, consume, counterKey, windowId } from '../../lib/rateLimit';
import { dayStamp } from '../../lib/sessionStore';

export const prerender = false;

/** Generous for `{ "title": "<200 chars>" }`; anything bigger is not a form submission. */
const MAX_BODY_BYTES = 2 * 1024;

/**
 * Blob stores only exist on Netlify, so `getStore` throws under `astro dev` and
 * in tests. The route then reports success without writing, which keeps the UI
 * testable locally and cannot happen in production where the stores resolve.
 */
function stores(): { rateLimits: Store; recommendations: Store } | null {
  try {
    return { rateLimits: getStore(RATE_LIMIT_STORE), recommendations: getStore(RECOMMENDATION_STORE) };
  } catch {
    return null;
  }
}

function json(status: number, body: Record<string, unknown>, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers }
  });
}

export async function POST({ request }: { request: Request }) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return json(413, { error: 'too_large' });
  }

  let payload: { title?: unknown };
  try {
    payload = JSON.parse(raw);
  } catch {
    return json(400, { error: 'bad_json' });
  }

  const title = cleanRecommendation(payload?.title);
  if (!title) {
    return json(400, { error: 'invalid_title', maxLength: MAX_RECOMMENDATION_LENGTH });
  }

  const store = stores();
  if (!store) {
    return json(200, { ok: true, stored: false });
  }

  const window = windowId();
  const key = await counterKey(clientAddress(request.headers), window, process.env.RATE_LIMIT_SALT ?? '');
  const allowed = await consume(store.rateLimits, key, RECOMMEND_LIMIT_PER_WINDOW);
  if (!allowed) {
    return json(429, { error: 'rate_limited' }, { 'retry-after': '3600' });
  }

  await store.recommendations.setJSON(recommendationKey(dayStamp(), crypto.randomUUID()), {
    title,
    receivedAt: new Date().toISOString()
  });

  return json(200, { ok: true, stored: true });
}
