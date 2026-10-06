import assert from 'node:assert/strict';
import test from 'node:test';
import { POST as recommend } from '../src/pages/api/recommend';
import { POST as contact } from '../src/pages/api/contact';
import { sendNotification } from '../src/server/email';

/** Exercise real route + Blobs client + Resend request with no external writes. */
test('notifications reach Hamish, meter submissions and preserve books when Resend fails', async (t) => {
  const previous = { context: process.env.NETLIFY_BLOBS_CONTEXT, key: process.env.RESEND_API_KEY, from: process.env.NOTIFICATION_FROM };
  process.env.NETLIFY_BLOBS_CONTEXT = Buffer.from(JSON.stringify({ siteID: 'test-site', token: 'test-token', edgeURL: 'https://blobs.example' })).toString('base64');
  process.env.RESEND_API_KEY = 'test-resend-key';
  process.env.NOTIFICATION_FROM = 'Website <notifications@hamishburke.dev>';
  const writes: Array<{ path: string; body: Record<string, unknown> }> = [];
  const emails: Record<string, unknown>[] = [];
  let count = 0;
  let emailFails = false;
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    if (url.hostname === 'api.resend.com') {
      emails.push(JSON.parse(String(init?.body)));
      return new Response(JSON.stringify(emailFails ? { error: 'failure' } : { id: 'sent-email' }), { status: emailFails ? 400 : 200 });
    }
    assert.equal(url.hostname, 'blobs.example');
    if (init?.method?.toLowerCase() === 'get') return new Response(JSON.stringify({ n: count }));
    writes.push({ path: url.pathname, body: JSON.parse(String(init?.body)) });
    return new Response(null, { status: 200 });
  });
  t.mock.method(console, 'error', () => {});
  const request = (path: string, body: unknown, form = false) => new Request(`https://hamishburke.dev/api/${path}`, {
    method: 'POST', headers: { 'content-type': form ? 'application/x-www-form-urlencoded' : 'application/json' },
    body: form ? new URLSearchParams(body as Record<string, string>).toString() : JSON.stringify(body),
  });
  try {
    assert.equal((await recommend({ request: request('recommend', { title: 'A <book>' }) })).status, 200);
    assert.equal(emails[0]?.text, 'Someone recommended:\n\nA <book>\n\nSent from the reading page on hamishburke.dev.');
    assert.deepEqual(emails[0]?.to, ['hamishapps@gmail.com']);
    assert.equal(emails[0]?.html, undefined);
    assert.ok(writes.some((write) => write.body.title === 'A <book>'));

    const sent = await contact({ request: request('contact', { email: 'reader@example.com' }, true) });
    assert.equal(sent.headers.get('location'), '/contact/sent?state=ok');
    assert.equal(emails[1]?.reply_to, 'reader@example.com');
    assert.ok(writes.some((write) => write.path.includes('contact-unknown')));
    assert.ok(writes.some((write) => write.path.includes('recommend-unknown')));
    assert.ok(writes.every((write) => !('email' in write.body)));

    count = 5;
    assert.equal((await recommend({ request: request('recommend', { title: 'Limited' }) })).status, 429);
    assert.equal((await contact({ request: request('contact', { email: 'reader@example.com' }) })).status, 429);
    assert.equal(emails.length, 2);

    count = 0;
    emailFails = true;
    assert.equal((await recommend({ request: request('recommend', { title: 'Saved despite email failure' }) })).status, 503);
    assert.ok(writes.some((write) => write.body.title === 'Saved despite email failure'));
    assert.equal((await contact({ request: request('contact', { email: 'reader@example.com' }) })).status, 503);

    delete process.env.RESEND_API_KEY;
    await assert.rejects(sendNotification('Test', 'Test'), /not configured/);
  } finally {
    for (const [name, value] of Object.entries({ NETLIFY_BLOBS_CONTEXT: previous.context, RESEND_API_KEY: previous.key, NOTIFICATION_FROM: previous.from })) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  }
});
