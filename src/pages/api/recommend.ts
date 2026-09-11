/**
 * Receives one book title from the recommendation box on /reading and stores it
 * as a blob. Nothing about the sender is kept: no IP, agent, referrer or
 * cookie, and no reply address, which is why the success state points people at
 * email.
 *
 * Two content types, because the form has to work without JavaScript. JSON in
 * gets JSON back, for the enhanced path; a form-encoded body gets a 303 to
 * /reading/sent, which is what the browser does on its own.
 */

import { stores } from '../../server/blobs';
import {
  MAX_RECOMMENDATION_LENGTH,
  RECOMMEND_LIMIT_PER_WINDOW,
  RECOMMENDATION_STORE,
  cleanRecommendation,
  recommendationKey,
} from '../../server/recommendations';
import { RATE_LIMIT_STORE, clientAddress, consume, counterKey, windowId } from '../../server/rateLimit';
import { secrets } from '../../server/secrets';
import { dayStamp } from '../../server/sessionStore';

export const prerender = false;

/** Generous for `{ "title": "<200 chars>" }`; anything bigger is not a form submission. */
const MAX_BODY_BYTES = 2 * 1024;

type Outcome = 'ok' | 'stored' | 'invalid' | 'limited';

function json(status: number, body: Record<string, unknown>, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

function seeOther(state: 'ok' | 'limited' | 'error'): Response {
  return new Response(null, {
    status: 303,
    headers: { location: `/reading/sent?state=${state}`, 'cache-control': 'no-store' },
  });
}

/** Validates, meters and stores. Shared by both content types. */
async function receive(request: Request, rawTitle: unknown): Promise<Outcome> {
  const title = cleanRecommendation(rawTitle);
  if (!title) return 'invalid';

  const store = stores(RATE_LIMIT_STORE, RECOMMENDATION_STORE);
  // Without the stores there is nothing to write and nothing to meter, which is
  // what `astro dev` and the tests see. Production always resolves them.
  if (!store) return 'ok';

  const key = await counterKey(
    clientAddress(request.headers),
    windowId(),
    secrets.rateLimitSalt(),
    'recommend',
  );
  if (!(await consume(store[RATE_LIMIT_STORE], key, RECOMMEND_LIMIT_PER_WINDOW))) return 'limited';

  await store[RECOMMENDATION_STORE].setJSON(recommendationKey(dayStamp(), crypto.randomUUID()), {
    title,
    receivedAt: new Date().toISOString(),
  });

  return 'stored';
}

export async function POST({ request }: { request: Request }) {
  const contentType = request.headers.get('content-type') ?? '';
  const isForm = contentType.includes('application/x-www-form-urlencoded');

  if (isForm) {
    const form = await request.formData();
    const outcome = await receive(request, form.get('title'));
    if (outcome === 'invalid') return seeOther('error');
    if (outcome === 'limited') return seeOther('limited');
    return seeOther('ok');
  }

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

  const outcome = await receive(request, payload?.title);
  if (outcome === 'invalid') {
    return json(400, { error: 'invalid_title', maxLength: MAX_RECOMMENDATION_LENGTH });
  }
  if (outcome === 'limited') {
    return json(429, { error: 'rate_limited' }, { 'retry-after': '3600' });
  }
  return json(200, { ok: true, stored: outcome === 'stored' });
}
