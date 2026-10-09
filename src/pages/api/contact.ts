import { stores } from '../../server/blobs';
import { cleanContactEmail } from '../../server/contact';
import { sendNotification } from '../../server/email';
import { RATE_LIMIT_STORE, clientAddress, consume, counterKey, windowId } from '../../server/rateLimit';
import { secrets } from '../../server/secrets';
import { isNativeForm, submissionBody, submissionJson, submissionRedirect } from '../../server/submission';

export const prerender = false;

export async function POST({ request }: { request: Request }): Promise<Response> {
  const form = isNativeForm(request);
  const result = (status: number, error?: string): Response => form
    ? submissionRedirect('/contact/sent', status === 200 ? 'ok' : status === 429 ? 'limited' : 'error')
    : submissionJson(status, error ? { error } : { ok: true }, status === 429 ? { 'retry-after': '3600' } : {});
  const body = await submissionBody(request);
  if (body instanceof Response) return form ? result(body.status, 'bad_body') : body;
  const email = cleanContactEmail(body.email);
  if (!email) return result(400, 'invalid_email');
  // A hidden field catches basic bots without collecting more visitor data.
  if (body.website) return result(200);

  try {
    const store = stores(RATE_LIMIT_STORE);
    if (!store) return result(503, 'unavailable');
    const key = await counterKey(clientAddress(request.headers), windowId(), secrets.rateLimitSalt(), 'contact');
    if (!(await consume(store[RATE_LIMIT_STORE], key, 5))) return result(429, 'rate_limited');
    await sendNotification('Someone would like to hear from you', `Please get in touch with ${email}.\n\nSent from the contact banner on hamishburke.dev.`, email);
    return result(200);
  } catch {
    console.error('Contact notification failed');
    return result(503, 'unavailable');
  }
}
