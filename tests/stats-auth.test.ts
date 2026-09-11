import assert from 'node:assert/strict';
import test from 'node:test';
import { STATS_COOKIE, authoriseStats } from '../src/server/statsAuth';

const URL_BASE = 'https://hamishburke.dev/stats';
const SECRET = 'a-long-enough-secret';

const request = (headers: Record<string, string> = {}) => new Request(URL_BASE, { headers });

test('an unset token leaves the page unconfigured rather than open', () => {
  assert.equal(authoriseStats(request(), new URL(URL_BASE), undefined).kind, 'unconfigured');
  assert.equal(authoriseStats(request(), new URL(URL_BASE), '').kind, 'unconfigured');
});

test('no credential at all is unauthorised', () => {
  assert.equal(authoriseStats(request(), new URL(URL_BASE), SECRET).kind, 'unauthorised');
});

test('a correct query token redirects and sets an HttpOnly, Secure, SameSite cookie', () => {
  const result = authoriseStats(request(), new URL(`${URL_BASE}?token=${SECRET}`), SECRET);
  assert.equal(result.kind, 'redirect');
  assert(result.kind === 'redirect');
  assert.match(result.setCookie, new RegExp(`^${STATS_COOKIE}=`));
  assert.match(result.setCookie, /HttpOnly/);
  assert.match(result.setCookie, /Secure/);
  assert.match(result.setCookie, /SameSite=Strict/);
  assert.match(result.setCookie, /Path=\/stats/);
});

test('a wrong query token is unauthorised, and is not turned into a cookie', () => {
  const result = authoriseStats(request(), new URL(`${URL_BASE}?token=wrong`), SECRET);
  assert.equal(result.kind, 'unauthorised');
});

test('the cookie is accepted, including when it needed URL encoding', () => {
  assert.equal(
    authoriseStats(request({ cookie: `${STATS_COOKIE}=${SECRET}` }), new URL(URL_BASE), SECRET).kind,
    'ok',
  );
  const awkward = 'secret with spaces/and+symbols';
  assert.equal(
    authoriseStats(
      request({ cookie: `${STATS_COOKIE}=${encodeURIComponent(awkward)}` }),
      new URL(URL_BASE),
      awkward,
    ).kind,
    'ok',
  );
});

test('the cookie is found alongside other cookies', () => {
  assert.equal(
    authoriseStats(
      request({ cookie: `theme=dark; ${STATS_COOKIE}=${SECRET}; other=1` }),
      new URL(URL_BASE),
      SECRET,
    ).kind,
    'ok',
  );
});

test('a bearer token is accepted', () => {
  assert.equal(
    authoriseStats(request({ authorization: `Bearer ${SECRET}` }), new URL(URL_BASE), SECRET).kind,
    'ok',
  );
});

test('a prefix of the secret is rejected everywhere it could be presented', () => {
  const prefix = SECRET.slice(0, 5);
  assert.equal(
    authoriseStats(request({ authorization: `Bearer ${prefix}` }), new URL(URL_BASE), SECRET).kind,
    'unauthorised',
  );
  assert.equal(
    authoriseStats(request({ cookie: `${STATS_COOKIE}=${prefix}` }), new URL(URL_BASE), SECRET).kind,
    'unauthorised',
  );
  assert.equal(
    authoriseStats(request(), new URL(`${URL_BASE}?token=${prefix}`), SECRET).kind,
    'unauthorised',
  );
});
