import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { seal, unseal, readCookie, cookie, AUTH_COOKIE, STATE_COOKIE, identity, digest, SESSION_SECONDS } from '../src/server/codexAuth';
import { startOAuth, finishOAuth, endSession } from '../src/server/codexOAuth';
import { accountStatus } from '../src/server/codexContributions';
import { MemoryStore, configure } from './codex-test-store';
const origin = 'https://hamishburke.dev';
beforeEach(configure);
test('purpose-specific signed cookies reject tampering, oversized, malformed and duplicate values', async () => {
  const secret = 'a'.repeat(40), value = { purpose: 'state', state: 'test', exp: Date.now() + 1000 };
  const token = await seal(value, secret);
  assert.deepEqual(await unseal(token, secret), value);
  assert.equal(await unseal(token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a'), secret), null);
  for (const invalid of ['', 'x'.repeat(4097), token + '.extra', '!bad.x']) assert.equal(await unseal(invalid, secret), null);
  assert.equal(readCookie(new Request(origin, { headers: { cookie: 'codex_gh_state=one; codex_gh_state=two' } }), STATE_COOKIE), undefined);
});
test('session cookie reaches sibling ingestion route; state cookie stays narrow', () => {
  assert.match(cookie(AUTH_COOKIE, 'value', 600), /Path=\/api\/; HttpOnly; Secure; SameSite=Lax; Max-Age=600/);
  assert.match(cookie(STATE_COOKIE, 'value', 600), /Path=\/api\/codex\/github;/);
  assert.doesNotMatch(cookie(AUTH_COOKIE, 'value', 600), /Domain=/);
});
async function flow() {
  const auth = new MemoryStore(), limits = new MemoryStore();
  const start = await startOAuth(new Request(origin + '/api/codex/github/start'), auth);
  const target = new URL(start.headers.get('location')!);
  const stateCookie = start.headers.getSetCookie().find(x => x.startsWith(STATE_COOKIE + '=') && !x.includes('Max-Age=0'))!.split(';')[0];
  const stored = await unseal(stateCookie.slice(STATE_COOKIE.length + 1), process.env.CODEX_AUTH_SECRET!) as { verifier: string };
  assert.equal(target.searchParams.get('code_challenge'), await digest(stored.verifier));
  assert.equal(target.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(target.searchParams.get('scope'), '');
  assert.equal(target.searchParams.get('redirect_uri'), origin + '/api/codex/github/callback');
  const request = new Request(origin + '/api/codex/github/callback?code=test-code&state=' + target.searchParams.get('state'), { headers: { cookie: stateCookie } });
  const calls: { url: string; options: RequestInit | undefined }[] = [];
  const fetcher = (async (url, options) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('access_token')) {
      const body = JSON.parse(String(options?.body)); assert.equal(body.code_verifier, stored.verifier);
      return Response.json({ access_token: 'private-test-token', token_type: 'bearer', scope: '' });
    }
    assert.equal(new Headers(options?.headers).get('authorization'), 'Bearer private-test-token');
    return Response.json({ id: 123, login: 'Verified-User', avatar_url: 'https://untrusted.example/image' });
  }) as typeof fetch;
  return { auth, limits, request, calls, fetcher, stateCookie };
}
test('mocked OAuth verifies numeric identity, returns no token and permits exactly one concurrent callback', async () => {
  const f = await flow();
  const responses = await Promise.all([finishOAuth(f.request, f.auth, f.fetcher, f.limits), finishOAuth(f.request, f.auth, f.fetcher, f.limits)]);
  assert.equal(responses.filter(x => x.headers.get('location')?.endsWith('connected')).length, 1);
  assert.equal(f.calls.length, 2);
  assert.equal([...f.auth.entries.keys()].filter(k => k.startsWith('session/')).length, 1);
  const success = responses.find(x => x.headers.get('location')?.endsWith('connected'))!;
  const sessionCookie = success.headers.getSetCookie().find(x => x.startsWith(AUTH_COOKIE + '=') && !x.includes('Max-Age=0'))!.split(';')[0];
  assert.ok(!sessionCookie.includes('private-test-token'));
  const req = new Request(origin + '/api/codex-contribute', { headers: { cookie: sessionCookie } });
  const user = await identity(req, f.auth); assert.equal(user?.id, 123); assert.equal(user?.login, 'Verified-User');
  const me = await accountStatus(req, f.auth, new MemoryStore());
  const status = await me.json(); assert.equal(status.csrf, user?.csrf); assert.equal(status.revision, null); assert.equal(status.id, undefined);
  const badLogout = await endSession(new Request(origin + '/api/codex/github/logout', { method: 'POST', headers: { cookie: sessionCookie, origin } }), f.auth);
  assert.equal(badLogout.status, 403);
  const logout = await endSession(new Request(origin + '/api/codex/github/logout', { method: 'POST', headers: { cookie: sessionCookie, origin, 'x-codex-csrf': user!.csrf } }), f.auth);
  assert.equal(logout.status, 200); assert.equal(await identity(req, f.auth), null);
  assert.match(logout.headers.getSetCookie().join('\n'), /Path=\/api\/;.*Max-Age=0/);
});
test('missing, mismatched, expired or forged state does not contact GitHub', async () => {
  const f = await flow();
  for (const cookieValue of ['', f.stateCookie + 'tamper', STATE_COOKIE + '=' + await seal({ purpose: 'state', state: 'wrong', verifier: 'v'.repeat(50), exp: Date.now() + 1000 }, process.env.CODEX_AUTH_SECRET!), STATE_COOKIE + '=' + await seal({ purpose: 'state', state: new URL(f.request.url).searchParams.get('state'), verifier: 'v'.repeat(50), exp: Date.now() - 1 }, process.env.CODEX_AUTH_SECRET!)]) {
    const response = await finishOAuth(new Request(f.request.url, { headers: { cookie: cookieValue } }), f.auth, f.fetcher, f.limits);
    assert.match(response.headers.get('location')!, /failed$/);
  }
  assert.equal(f.calls.length, 0);
});
test('GitHub failure consumes state and cannot be retried with the same callback', async () => {
  const f = await flow(); let calls = 0;
  const fail = (async () => { calls++; return new Response(null, { status: 500 }); }) as typeof fetch;
  await finishOAuth(f.request, f.auth, fail, f.limits);
  await finishOAuth(f.request, f.auth, f.fetcher, f.limits);
  assert.equal(calls, 1); assert.equal(f.calls.length, 0);
});
test('extra OAuth scopes, spoofed identity, redirects and storage failures fail closed', async () => {
  for (const mode of ['scope', 'id', 'throw', 'store']) {
    const f = await flow(); if (mode === 'store') f.auth.fail = true;
    let calls = 0;
    const fetcher = (async (_url, options) => {
      assert.equal(options?.redirect, 'error');
      if (mode === 'throw') throw new Error('upstream failure');
      if (calls++ === 0) return Response.json({ access_token: 'token', token_type: 'bearer', scope: mode === 'scope' ? 'repo' : '' });
      return Response.json({ id: mode === 'id' ? '123' : 123, login: 'Verified-User' });
    }) as typeof fetch;
    const response = await finishOAuth(f.request, f.auth, fetcher, f.limits);
    assert.match(response.headers.get('location')!, /failed$/);
    assert.equal([...f.auth.entries.keys()].some(k => k.startsWith('session/')), false);
  }
});
test('arbitrary origins, cross-site initiation, absent config, expired and purpose-confused sessions are rejected', async () => {
  const auth = new MemoryStore();
  assert.equal((await startOAuth(new Request('https://evil.example/api/codex/github/start'), auth)).status, 403);
  assert.equal((await startOAuth(new Request(origin, { headers: { 'sec-fetch-site': 'cross-site' } }), auth)).status, 403);
  assert.equal((await startOAuth(new Request(origin), null)).status, 503);
  for (const token of [{ purpose: 'state', sid: crypto.randomUUID(), exp: Date.now() + SESSION_SECONDS * 1000 }, { purpose: 'session', sid: crypto.randomUUID(), exp: Date.now() - 1 }]) {
    const signed = await seal(token, process.env.CODEX_AUTH_SECRET!);
    assert.equal(await identity(new Request(origin, { headers: { cookie: AUTH_COOKIE + '=' + signed } }), auth), null);
  }
  delete process.env.CODEX_AUTH_SECRET;
  assert.equal((await startOAuth(new Request(origin), auth)).status, 503);
});

test('account ownership stays stable after rotating the session secret', async () => {
  const { accountKey } = await import('../src/server/codexAuth');
  const before = await accountKey(123);
  process.env.CODEX_AUTH_SECRET = 'rotated-secret'.repeat(3);
  assert.equal(await accountKey(123), before);
  assert.notEqual(await accountKey(124), before);
});
