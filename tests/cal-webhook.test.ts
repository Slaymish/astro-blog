import assert from 'node:assert/strict';
import test from 'node:test';
import { createHmac } from 'node:crypto';
import { POST } from '../src/pages/api/cal-webhook';

const SECRET = 'test-webhook-secret';
const originalFetch = globalThis.fetch;
const originalSecret = process.env.CAL_WEBHOOK_SECRET;

interface UmamiCall {
  name?: string;
  data?: { page?: string; nonce?: string };
  url?: string;
}

/** Captures the Umami beacon so the parsed ref can be asserted on. */
function captureUmami(): { calls: UmamiCall[] } {
  const captured: { calls: UmamiCall[] } = { calls: [] };

  globalThis.fetch = (async (_url: string, init: { body: string }) => {
    captured.calls.push(JSON.parse(init.body).payload);
    return new Response('ok', { status: 200 });
  }) as unknown as typeof fetch;

  return captured;
}

function sign(body: string): string {
  return createHmac('sha256', SECRET).update(body).digest('hex');
}

function request(body: string, signature: string): Request {
  return new Request('https://hamishburke.dev/api/cal-webhook', {
    method: 'POST',
    headers: { 'x-cal-signature-256': signature },
    body
  });
}

test.beforeEach(() => {
  process.env.CAL_WEBHOOK_SECRET = SECRET;
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalSecret === undefined) delete process.env.CAL_WEBHOOK_SECRET;
  else process.env.CAL_WEBHOOK_SECRET = originalSecret;
});

test('POST /api/cal-webhook refuses to run without a configured secret', async () => {
  delete process.env.CAL_WEBHOOK_SECRET;

  const body = JSON.stringify({ triggerEvent: 'BOOKING_CREATED' });
  const response = await POST({ request: request(body, 'whatever') } as any);

  assert.equal(response.status, 503);
});

test('POST /api/cal-webhook rejects a forged signature', async () => {
  const body = JSON.stringify({ triggerEvent: 'BOOKING_CREATED' });
  const response = await POST({ request: request(body, sign('a different body')) } as any);

  assert.equal(response.status, 401);
});

test('POST /api/cal-webhook rejects a missing signature', async () => {
  const body = JSON.stringify({ triggerEvent: 'BOOKING_CREATED' });
  const response = await POST({
    request: new Request('https://hamishburke.dev/api/cal-webhook', { method: 'POST', body })
  } as any);

  assert.equal(response.status, 401);
});

test('POST /api/cal-webhook rejects a body that was tampered with after signing', async () => {
  const signed = JSON.stringify({ triggerEvent: 'BOOKING_CREATED', payload: { metadata: { ref: '/contact|aaaa1111' } } });
  const tampered = JSON.stringify({ triggerEvent: 'BOOKING_CREATED', payload: { metadata: { ref: '/evil|bbbb2222' } } });

  const response = await POST({ request: request(tampered, sign(signed)) } as any);

  assert.equal(response.status, 401);
});

test('POST /api/cal-webhook rejects malformed JSON even when correctly signed', async () => {
  const body = 'not json at all';
  const response = await POST({ request: request(body, sign(body)) } as any);

  assert.equal(response.status, 400);
});

test('POST /api/cal-webhook acknowledges triggers it does not handle', async () => {
  const body = JSON.stringify({ triggerEvent: 'BOOKING_CANCELLED' });
  const response = await POST({ request: request(body, sign(body)) } as any);

  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'Ignored');
});

test('POST /api/cal-webhook forwards the parsed ref on a valid booking', async () => {
  const captured = captureUmami();
  const body = JSON.stringify({
    triggerEvent: 'BOOKING_CREATED',
    payload: { metadata: { ref: '/contact|a1b2c3d4' } }
  });

  const response = await POST({ request: request(body, sign(body)) } as any);

  assert.equal(response.status, 200);
  assert.equal(captured.calls.length, 1);
  assert.equal(captured.calls[0].name, 'booking-confirmed');
  assert.deepEqual(captured.calls[0].data, { page: '/contact', nonce: 'a1b2c3d4' });
});

test('POST /api/cal-webhook records a booking whose ref is missing or hostile', async () => {
  const captured = captureUmami();
  const body = JSON.stringify({
    triggerEvent: 'BOOKING_CREATED',
    payload: { metadata: { ref: 'https://evil.example|a1b2c3d4' } }
  });

  const response = await POST({ request: request(body, sign(body)) } as any);

  // The booking still counts; only the attribution is dropped.
  assert.equal(response.status, 200);
  assert.deepEqual(captured.calls[0].data, { page: 'unattributed', nonce: 'unknown' });
});
