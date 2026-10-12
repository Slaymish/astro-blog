import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { contributionRequest, contributorListing, acceptContribution, expireContributions, consumeLimit, RETENTION_MS } from '../src/server/codexContributions';
import { accountKey, type GithubIdentity } from '../src/server/codexAuth';
import { MemoryStore, configure, sampleReport } from './codex-test-store';
import { POST } from '../src/pages/api/codex-contribute';
const origin = 'https://hamishburke.dev';
beforeEach(configure);
const user = (id = 1): GithubIdentity => ({ id, login: 'User-' + id, sid: crypto.randomUUID(), csrf: crypto.randomUUID(), exp: Date.now() + 3600_000 });
function request(who: GithubIdentity, method = 'POST', body: object = { report: sampleReport(), optIn: false, revision: null }, headers: Record<string, string> = {}) {
  return new Request(origin + '/api/codex-contribute', { method, headers: { origin, 'content-type': 'application/json', 'x-codex-csrf': who.csrf, ...headers }, body: JSON.stringify(body) });
}
function setup() {
  const accounts = new MemoryStore(), limits = new MemoryStore();
  const submit = (who: GithubIdentity, req: Request = request(who)) => contributionRequest(req, { accounts, limits, authenticate: async () => who });
  return { accounts, limits, submit };
}
test('disabled production ingestion returns 503 before authentication or storage', async () => {
  delete process.env.CODEX_CONTRIBUTIONS_ENABLED;
  const response = await POST({ request: request(user()) }); assert.equal(response.status, 503);
});
test('requires verified identity, exact origin and session CSRF, and rejects spoofed attribution', async () => {
  const f = setup(), who = user();
  const unauth = await contributionRequest(request(who), { accounts: f.accounts, limits: f.limits, authenticate: async () => null }); assert.equal(unauth.status, 401);
  for (const headers of [{ origin: 'https://evil.example' }, { origin: '' }, { 'x-codex-csrf': '' }, { 'x-codex-csrf': user(2).csrf }, { 'sec-fetch-site': 'cross-site' }] as Record<string, string>[]) assert.equal((await f.submit(who, request(who, 'POST', undefined, headers))).status, 403);
  for (const extra of [{ github: 'Slaymish' }, { id: 99 }, { login: 'Slaymish' }, { status: 'accepted' }, { avatarUrl: 'https://evil.example' }]) {
    assert.equal((await f.submit(who, request(who, 'POST', { report: sampleReport(), optIn: false, revision: null, ...extra }))).status, 400);
  }
  assert.equal(f.accounts.writes, 0);
});
test('one verified account owns one snapshot; same aggregates from different accounts are accepted independently', async () => {
  const f = setup(), one = user(1), two = user(2);
  assert.equal((await f.submit(one)).status, 201); assert.equal((await f.submit(two)).status, 201);
  assert.equal(f.accounts.entries.size, 2);
  const key = await accountKey(one.id), entry = f.accounts.entries.get(key)!;
  assert.equal((entry.data as { id: number }).id, one.id);
  assert.equal(key.includes('User'), false);
  const changed = sampleReport(); changed.buckets[0].input_tokens = 200; changed.buckets[0].total_tokens = 230;
  const response = await f.submit(one, request(one, 'POST', { report: changed, optIn: true, revision: entry.etag }));
  assert.equal(response.status, 200); assert.equal(f.accounts.entries.size, 2);
  assert.equal((f.accounts.entries.get(key)!.data as { report: typeof changed }).report.buckets[0].input_tokens, 200);
});
test('concurrent creates or stale updates cannot overwrite current data', async () => {
  const f = setup(), who = user();
  const results = await Promise.all([f.submit(who), f.submit(who)]);
  assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
  const entry = f.accounts.entries.get(await accountKey(who.id))!;
  const patch = () => f.submit(who, request(who, 'PATCH', { revision: entry.etag, optIn: true }));
  const updates = await Promise.all([patch(), patch()]); assert.deepEqual(updates.map(r => r.status).sort(), [200, 409]);
});
test('explicit opt-in never approves a report; identical submission preserves review but changed data resets it', async () => {
  const f = setup(), who = user(), key = await accountKey(who.id);
  assert.equal((await f.submit(who, request(who, 'POST', { report: sampleReport(), optIn: true, revision: null }))).status, 201);
  let entry = f.accounts.entries.get(key)!;
  assert.equal((entry.data as { status: string }).status, 'pending_review');
  const fingerprint = (entry.data as { fingerprint: string }).fingerprint;
  assert.equal(await acceptContribution(f.accounts, key, fingerprint, entry.etag), true);
  entry = f.accounts.entries.get(key)!;
  assert.equal((await f.submit(who, request(who, 'POST', { report: sampleReport(), optIn: true, revision: entry.etag }))).status, 200);
  entry = f.accounts.entries.get(key)!;
  assert.equal((entry.data as { status: string }).status, 'accepted');
  const changed = sampleReport(); changed.buckets[0].output_tokens = 50; changed.buckets[0].total_tokens = 150;
  await f.submit(who, request(who, 'POST', { report: changed, optIn: true, revision: entry.etag }));
  assert.equal((f.accounts.entries.get(key)!.data as { status: string }).status, 'pending_review');
  assert.equal(await acceptContribution(f.accounts, key, fingerprint, entry.etag), false);
});
test('withdrawal removes all personal fields and stale submissions cannot resurrect deleted reports, even while paused', async () => {
  const f = setup(), who = user(), key = await accountKey(who.id);
  await f.submit(who); const entry = f.accounts.entries.get(key)!;
  delete process.env.CODEX_CONTRIBUTIONS_ENABLED;
  const response = await f.submit(who, request(who, 'DELETE', { revision: entry.etag })); assert.equal(response.status, 200);
  assert.deepEqual(f.accounts.entries.get(key)!.data, { version: 2, withdrawn: true });
  process.env.CODEX_CONTRIBUTIONS_ENABLED = 'true';
  assert.equal((await f.submit(who)).status, 409);
  assert.equal((await f.submit(who, request(who, 'POST', { revision: entry.etag, report: sampleReport(), optIn: false }))).status, 409);
  const revision = f.accounts.entries.get(key)!.etag;
  assert.equal((await f.submit(who, request(who, 'POST', { revision, report: sampleReport(), optIn: false }))).status, 201);
});
test('only five or more reviewed, opted-in, unexpired accounts produce public profiles, never private report fields', async () => {
  const f = setup();
  for (let id = 1; id <= 5; id++) {
    const who = user(id); await f.submit(who, request(who, 'POST', { report: sampleReport(), optIn: true, revision: null }));
    const key = await accountKey(id), entry = f.accounts.entries.get(key)!;
    if (id < 5) await acceptContribution(f.accounts, key, (entry.data as { fingerprint: string }).fingerprint, entry.etag);
  }
  let listing = await contributorListing(f.accounts); assert.deepEqual(await listing.json(), { contributors: [] });
  const key = await accountKey(5), entry = f.accounts.entries.get(key)!;
  await acceptContribution(f.accounts, key, (entry.data as { fingerprint: string }).fingerprint, entry.etag);
  listing = await contributorListing(f.accounts);
  const data = await listing.json(); assert.equal(data.contributors.length, 5);
  assert.deepEqual(Object.keys(data.contributors[0]).sort(), ['avatarUrl', 'login', 'profileUrl']);
  assert.equal(listing.headers.get('cache-control'), 'no-store');
  assert.doesNotMatch(JSON.stringify(data), /buckets|tokens|fingerprint|expiresAt|revision|csrf|pending_review/);
  const current = f.accounts.entries.get(key)!; delete process.env.CODEX_CONTRIBUTIONS_ENABLED;
  const who = user(5);
  assert.equal((await f.submit(who, request(who, 'PATCH', { revision: current.etag, optIn: false }))).status, 200);
  assert.deepEqual(await (await contributorListing(f.accounts)).json(), { contributors: [] });
  assert.equal((await f.submit(who, request(who, 'PATCH', { revision: f.accounts.entries.get(key)!.etag, optIn: true }))).status, 503);
});
test('expired contributions are hidden immediately and maintenance clears personal data with conditional writes', async () => {
  const f = setup(), who = user(); await f.submit(who);
  const key = await accountKey(who.id), entry = f.accounts.entries.get(key)!;
  const exp = (entry.data as { expiresAt: number }).expiresAt;
  assert.ok(exp <= Date.now() + RETENTION_MS);
  await expireContributions(f.accounts, exp + 1);
  assert.deepEqual(f.accounts.entries.get(key)!.data, { version: 2, withdrawn: true });
});
test('account limits are atomic under concurrency and failures never confirm submission', async () => {
  const limits = new MemoryStore();
  const outcomes = await Promise.all(Array.from({ length: 10 }, () => consumeLimit(limits, 'subject', 'test', 3)));
  assert.equal(outcomes.filter(Boolean).length, 3);
  const f = setup(), who = user(); f.accounts.fail = true;
  assert.equal((await f.submit(who)).status, 503);
  f.accounts.fail = false; f.limits.fail = true;
  assert.equal((await f.submit(who)).status, 503); assert.equal(f.accounts.writes, 0);
  assert.equal((await contributorListing(null)).status, 503);
});
test('streamed and declared oversized payloads, non-JSON, invalid report and nonboolean consent fail', async () => {
  const f = setup(), who = user();
  assert.equal((await f.submit(who, request(who, 'POST', undefined, { 'content-length': '256001' }))).status, 413);
  assert.equal((await f.submit(who, request(who, 'POST', undefined, { 'content-type': 'text/plain' }))).status, 415);
  const large = request(who, 'POST', { report: 'x'.repeat(256_001), optIn: false, revision: null }); assert.equal((await f.submit(who, large)).status, 413);
  for (const body of [{ report: {}, optIn: false, revision: null }, { report: sampleReport(), optIn: 'true', revision: null }, { report: sampleReport(), optIn: false }]) assert.equal((await f.submit(who, request(who, 'POST', body))).status, 400);
  assert.equal(f.accounts.writes, 0);
});

test('unconfirmed writes never report a successful ingestion', async () => {
  const f = setup(), who = user();
  f.accounts.setJSON = async () => ({ modified: true });
  assert.equal((await f.submit(who)).status, 503);
});
