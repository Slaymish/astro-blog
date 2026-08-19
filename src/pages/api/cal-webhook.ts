/**
 * Cal.com booking webhook.
 *
 * Records a *completed* booking as an analytics event. Without this the site
 * can only measure booking-link clicks, which is a proxy — someone can click
 * through and never book.
 *
 * No attendee data is read or stored: only the `ref` we attached to the booking
 * link (page path plus an opaque nonce) is forwarded.
 */

import { getStore } from '@netlify/blobs';
import { parseBookingRef } from '../../lib/analytics';
import { SESSION_STORE, conversionKey, dayStamp } from '../../lib/sessionStore';
import { timingSafeEqual } from '../../lib/timingSafe';

export const prerender = false;

const UMAMI_ENDPOINT = 'https://cloud.umami.is/api/send';
const UMAMI_WEBSITE_ID = '3b77a67f-19f6-4f3c-a7ab-8af0d58bfbc6';
const SITE_HOSTNAME = 'hamishburke.dev';

async function hmacSha256Hex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function POST({ request }: { request: Request }) {
  const secret = process.env.CAL_WEBHOOK_SECRET;
  if (!secret) {
    return new Response('Webhook secret not configured', { status: 503 });
  }

  const rawBody = await request.text();
  const provided = request.headers.get('x-cal-signature-256') ?? '';
  const expected = await hmacSha256Hex(secret, rawBody);

  if (!provided || !timingSafeEqual(provided.toLowerCase(), expected)) {
    return new Response('Invalid signature', { status: 401 });
  }

  let event: { triggerEvent?: string; payload?: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response('Malformed payload', { status: 400 });
  }

  if (event.triggerEvent !== 'BOOKING_CREATED') {
    // Acknowledge other triggers so Cal.com does not retry them.
    return new Response('Ignored', { status: 200 });
  }

  const metadata = (event.payload?.metadata ?? {}) as Record<string, unknown>;
  const ref = parseBookingRef(metadata.ref);

  // Also record the conversion alongside the collected sessions. The nightly
  // synthesis reads the blob store, not Umami, so a booking written only to
  // Umami would be invisible to the analysis that exists to explain bookings.
  try {
    const day = dayStamp();
    await getStore(SESSION_STORE).setJSON(conversionKey(day, crypto.randomUUID()), {
      day,
      visitor: ref?.nonce ?? null,
      page: ref?.page ?? null,
      confirmedAt: new Date().toISOString()
    });
  } catch {
    // Never fail the webhook over analytics bookkeeping — Cal.com would retry.
  }

  await fetch(UMAMI_ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      // Umami rejects requests without a User-Agent.
      'user-agent': 'hamishburke.dev-cal-webhook'
    },
    body: JSON.stringify({
      type: 'event',
      payload: {
        website: UMAMI_WEBSITE_ID,
        hostname: SITE_HOSTNAME,
        url: ref?.page ?? '/',
        name: 'booking-confirmed',
        data: {
          page: ref?.page ?? 'unattributed',
          nonce: ref?.nonce ?? 'unknown'
        }
      }
    })
  }).catch(() => {
    // A failed analytics write must not make Cal.com retry a valid booking.
  });

  return new Response('OK', { status: 200 });
}
