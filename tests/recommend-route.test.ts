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

test('POST /api/recommend reports unavailable when storage and delivery cannot run', async () => {
  const response = await post(JSON.stringify({ title: 'The Myth of Sisyphus' }));
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const body = await response.json();
  assert.equal(body.error, 'unavailable');
});

function postForm(title: string): Promise<Response> {
  return POST({
    request: new Request('https://hamishburke.dev/api/recommend', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ title }).toString(),
    }),
  });
}

test('a form-encoded post redirects instead of answering JSON, so the form works without scripts', async () => {
  const response = await postForm('The Myth of Sisyphus');

  assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'), '/reading/sent?state=error');
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('a form-encoded post with an unusable title redirects to the error state', async () => {
  assert.equal((await postForm('   ')).headers.get('location'), '/reading/sent?state=error');
  assert.equal((await postForm('')).headers.get('location'), '/reading/sent?state=error');
});

test('a form-encoded post is not answered with a JSON body', async () => {
  const response = await postForm('A Book');

  assert.equal(await response.text(), '');
  assert.equal(response.headers.get('content-type'), null);
});

test('recommendation bounds native form bodies too', async () => {
  assert.equal((await postForm('x'.repeat(3000))).headers.get('location'), '/reading/sent?state=error');
});

test('recommendation rejects null payloads and cross-origin JSON', async () => {
  assert.equal((await post('null')).status, 400);
  const response = await POST({ request: new Request('https://hamishburke.dev/api/recommend', {
    method: 'POST', headers: { origin: 'https://elsewhere.example' }, body: JSON.stringify({ title: 'A Book' }),
  }) });
  assert.equal(response.status, 403);
});
