/**
 * Reads the latest session-archetype report written by the nightly
 * session-insights function. Token-gated: the report describes visitor
 * behaviour and is not public.
 */

import { getStore } from '@netlify/blobs';
import { INSIGHTS_STORE, LATEST_REPORT_KEY } from '../../lib/sessionStore';
import { timingSafeEqual } from '../../lib/timingSafe';

export const prerender = false;

function unauthorised() {
  return new Response('Unauthorised', { status: 401 });
}

export async function GET({ request, url }: { request: Request; url: URL }) {
  const expected = process.env.INSIGHTS_TOKEN;
  if (!expected) {
    return new Response('INSIGHTS_TOKEN not configured', { status: 503 });
  }

  const provided =
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    url.searchParams.get('token') ??
    '';

  // Constant-time so the token cannot be recovered by timing the response.
  if (!timingSafeEqual(provided, expected)) return unauthorised();

  const store = getStore(INSIGHTS_STORE);
  const latest = await store.get(LATEST_REPORT_KEY, { type: 'json' });

  if (!latest) {
    return new Response('No report generated yet', { status: 404 });
  }

  return new Response(JSON.stringify(latest, null, 2), {
    status: 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
  });
}
