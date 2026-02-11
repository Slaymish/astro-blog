import assert from 'node:assert/strict';
import test from 'node:test';
import { GET } from '../src/pages/api/pdf';

const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('GET /api/pdf rejects non-PDF upstream content', async () => {
  globalThis.fetch = async () =>
    new Response('<html>not a pdf</html>', {
      status: 200,
      headers: { 'content-type': 'text/html' }
    });

  const request = new Request(
    'https://hamishburke.dev/api/pdf?url=https%3A%2F%2Fcdn.sanity.io%2Ffiles%2Fproject%2Ftest'
  );

  const response = await GET({ request } as any);
  assert.equal(response.status, 415);
});

test('GET /api/pdf blocks upstream redirects', async () => {
  globalThis.fetch = async () =>
    new Response(null, {
      status: 302,
      headers: { location: 'https://example.com/redirect.pdf' }
    });

  const request = new Request(
    'https://hamishburke.dev/api/pdf?url=https%3A%2F%2Fcdn.sanity.io%2Ffiles%2Fproject%2Ftest.pdf'
  );

  const response = await GET({ request } as any);
  assert.equal(response.status, 502);
});
