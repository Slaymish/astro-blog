import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seal, unseal, readCookie, cookie } from '../src/server/codexAuth';
const secret = 'a'.repeat(40);
test('signed state round trips', async () => {
  const token = await seal({ state: 'test', exp: Date.now() + 1000 }, secret);
  assert.deepEqual(await unseal(token, secret), { state: 'test', exp: (await unseal(token, secret) as {exp:number}).exp });
  assert.equal(await unseal(token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a'), secret), null);
});
test('cookies are httpOnly and secure', () => {
  const header = cookie('codex_gh_state', 'value', 600);
  assert.match(header, /HttpOnly; Secure; SameSite=Lax/);
  assert.equal(readCookie(new Request('https://hamishburke.dev', { headers: { cookie: 'other=1; codex_gh_state=value' } }), 'codex_gh_state'), 'value');
});
