import assert from 'node:assert/strict';
import test from 'node:test';
import { POST } from '../src/pages/api/contact';
import { cleanContactEmail } from '../src/server/contact';

function post(body: string, headers: Record<string, string> = {}): Promise<Response> {
  return POST({ request: new Request('https://hamishburke.dev/api/contact', { method: 'POST', body, headers }) });
}

test('contact accepts a single trimmed reply address and rejects header injection and lists', () => {
  assert.equal(cleanContactEmail('  reader@example.com  '), 'reader@example.com');
  for (const value of ['', 'bad', 'a@b', 'a@example.com,b@example.com', 'a@example.com\r\nBcc: b@example.com', 'Name <a@example.com>', null, 4]) {
    assert.equal(cleanContactEmail(value), null);
  }
});

test('contact rejects malformed, null and oversized submissions', async () => {
  assert.equal((await post('{bad')).status, 400);
  assert.equal((await post('null')).status, 400);
  assert.equal((await post(JSON.stringify({ email: 'not an email' }))).status, 400);
  assert.equal((await post('x'.repeat(3000))).status, 413);
});

test('contact rejects a cross-origin JSON post', async () => {
  assert.equal((await post(JSON.stringify({ email: 'a@example.com' }), { origin: 'https://elsewhere.example' })).status, 403);
});

test('contact reports unavailable rather than accepting a request it cannot send', async () => {
  const response = await post(JSON.stringify({ email: 'reader@example.com' }));
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('native contact form redirects to an error state when delivery is unavailable', async () => {
  const response = await post('email=reader%40example.com', { 'content-type': 'application/x-www-form-urlencoded' });
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'), '/contact/sent?state=error');
});

test('contact honeypot absorbs bot submissions without sending', async () => {
  assert.equal((await post(JSON.stringify({ email: 'bot@example.com', website: 'spam' }))).status, 200);
});
