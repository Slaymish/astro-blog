import assert from 'node:assert/strict';
import test from 'node:test';
import { GET } from '../src/pages/api/insights';

const TOKEN = 'insights-token-value';
const originalToken = process.env.INSIGHTS_TOKEN;

function get(options: { bearer?: string; query?: string }): Promise<Response> {
  const url = new URL('https://hamishburke.dev/api/insights');
  if (options.query !== undefined) url.searchParams.set('token', options.query);

  const headers = new Headers();
  if (options.bearer !== undefined) headers.set('authorization', `Bearer ${options.bearer}`);

  return GET({ request: new Request(url, { headers }), url } as any);
}

test.beforeEach(() => {
  process.env.INSIGHTS_TOKEN = TOKEN;
});

test.afterEach(() => {
  if (originalToken === undefined) delete process.env.INSIGHTS_TOKEN;
  else process.env.INSIGHTS_TOKEN = originalToken;
});

test('GET /api/insights refuses to serve when no token is configured', async () => {
  delete process.env.INSIGHTS_TOKEN;

  const response = await get({ bearer: 'anything' });
  assert.equal(response.status, 503);
});

test('GET /api/insights rejects a request with no credentials', async () => {
  const response = await get({});
  assert.equal(response.status, 401);
});

test('GET /api/insights rejects a wrong token from either source', async () => {
  assert.equal((await get({ bearer: 'wrong-token-value!!' })).status, 401);
  assert.equal((await get({ query: 'wrong-token-value!!' })).status, 401);
});

test('GET /api/insights rejects a correct prefix of the token', async () => {
  // A prefix must not pass: the compare has to reject on length, not stop at
  // the first matching run of characters.
  assert.equal((await get({ bearer: TOKEN.slice(0, -1) })).status, 401);
  assert.equal((await get({ bearer: `${TOKEN}x` })).status, 401);
});

test('GET /api/insights gets past authentication with the right token', async () => {
  const outcome = await get({ bearer: TOKEN }).then(
    (response) => ({ kind: 'response' as const, status: response.status }),
    (error: unknown) => ({ kind: 'threw' as const, message: String(error) })
  );

  // The blob store is only reached after the token check, and it is
  // unavailable outside Netlify. Failing there proves authentication passed.
  if (outcome.kind === 'threw') {
    assert.match(outcome.message, /Netlify Blobs/);
  } else {
    assert.ok(
      outcome.status !== 401 && outcome.status !== 503,
      `expected the token to be accepted, got ${outcome.status}`
    );
  }
});
