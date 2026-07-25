/**
 * Reads the latest session-archetype report written by the nightly
 * session-insights function. Token-gated: the report describes visitor
 * behaviour and is not public.
 */

import { getStore } from '@netlify/blobs';

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

  // Length-independent comparison keeps the token from being probed by timing.
  if (provided.length !== expected.length) return unauthorised();
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (mismatch !== 0) return unauthorised();

  const store = getStore('session-insights');
  const latest = await store.get('latest', { type: 'json' });

  if (!latest) {
    return new Response('No report generated yet', { status: 404 });
  }

  return new Response(JSON.stringify(latest, null, 2), {
    status: 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
  });
}
