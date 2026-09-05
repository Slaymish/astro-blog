import assert from 'node:assert/strict';
import test from 'node:test';
import { POST } from '../src/pages/api/recommend';

function post(body: string): Promise<Response> {
  return POST({ request: new Request('https://hamishburke.dev/api/recommend', { method: 'POST', body }) });
}

test('POST /api/recommend rejects malformed JSON', async () => {
  const response = await post('{not json');
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'bad_json' });
});

test('POST /api/recommend rejects an empty or missing title', async () => {
  assert.equal((await post(JSON.stringify({}))).status, 400);
  assert.equal((await post(JSON.stringify({ title: '   ' }))).status, 400);
  assert.equal((await post(JSON.stringify({ title: 7 }))).status, 400);
});

test('POST /api/recommend rejects an oversized body before parsing', async () => {
  const response = await post(JSON.stringify({ title: 'x'.repeat(5000) }));
  assert.equal(response.status, 413);
});

test('POST /api/recommend accepts a title and does not cache the reply', async () => {
  const response = await post(JSON.stringify({ title: 'The Myth of Sisyphus' }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const body = await response.json();
  assert.equal(body.ok, true);
  // Outside Netlify there is no blob store, so the route reports the write it skipped.
  assert.equal(body.stored, false);
});
