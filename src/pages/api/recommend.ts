/** Anonymous book recommendations are stored and emailed to Hamish. */
import { stores } from '../../server/blobs';
import { sendNotification } from '../../server/email';
import { MAX_RECOMMENDATION_LENGTH, RECOMMEND_LIMIT_PER_WINDOW, RECOMMENDATION_STORE, cleanRecommendation, recommendationKey } from '../../server/recommendations';
import { RATE_LIMIT_STORE, clientAddress, consume, counterKey, windowId } from '../../server/rateLimit';
import { secrets } from '../../server/secrets';
import { dayStamp } from '../../server/sessionStore';
import { isNativeForm, submissionBody, submissionJson, submissionRedirect } from '../../server/submission';

export const prerender = false;

export async function POST({ request }: { request: Request }): Promise<Response> {
  const form = isNativeForm(request);
  const result = (status: number, error?: string): Response => form
    ? submissionRedirect('/reading/sent', status === 200 ? 'ok' : status === 429 ? 'limited' : 'error')
    : submissionJson(status, error ? { error, ...(error === 'invalid_title' ? { maxLength: MAX_RECOMMENDATION_LENGTH } : {}) } : { ok: true, stored: true }, status === 429 ? { 'retry-after': '3600' } : {});
  const body = await submissionBody(request);
  if (body instanceof Response) return form ? result(body.status, 'bad_body') : body;
  const title = cleanRecommendation(body.title);
  if (!title) return result(400, 'invalid_title');

  try {
    const store = stores(RATE_LIMIT_STORE, RECOMMENDATION_STORE);
    if (!store) return result(503, 'unavailable');
    const key = await counterKey(clientAddress(request.headers), windowId(), secrets.rateLimitSalt(), 'recommend');
    if (!(await consume(store[RATE_LIMIT_STORE], key, RECOMMEND_LIMIT_PER_WINDOW))) return result(429, 'rate_limited');
    // Keep the recommendation in /stats even when email delivery fails.
    await store[RECOMMENDATION_STORE].setJSON(recommendationKey(dayStamp(), crypto.randomUUID()), {
      title, receivedAt: new Date().toISOString(),
    });
    await sendNotification('A book recommendation for you', `Someone recommended:\n\n${title}\n\nSent from the reading page on hamishburke.dev.`);
    return result(200);
  } catch {
    console.error('Book recommendation notification failed');
    return result(503, 'unavailable');
  }
}
