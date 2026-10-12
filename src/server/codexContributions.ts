import { identity, githubAuthConfig, validMutation, accountKey, validProfile, digest, type GithubIdentity } from './codexAuth';
import { codexStore, writeSucceeded, type CodexStore } from './codexStore';
import { validateUsageReport, reportFingerprint, type UsageReport } from './codexReports';
import { clientAddress, windowId } from './rateLimit';
export const RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
const PUBLIC_MINIMUM = 5;
export const json = (status: number, body: object) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff' },
});
function submissionsOpen(): boolean { return process.env.CODEX_CONTRIBUTIONS_ENABLED === 'true'; }
interface Contribution {
  version: 2; id: number; login: string; report: UsageReport; fingerprint: string;
  optIn: boolean; status: 'pending_review' | 'accepted'; expiresAt: number;
}
function activeContribution(value: unknown, now = Date.now()): Contribution | null {
  if (!value || typeof value !== 'object') return null;
  const x = value as Contribution;
  return x.version === 2 && validProfile(x.id, x.login) && validateUsageReport(x.report) &&
    typeof x.optIn === 'boolean' && (x.status === 'pending_review' || x.status === 'accepted') &&
    typeof x.fingerprint === 'string' && /^[a-f0-9]{64}$/.test(x.fingerprint) &&
    Number.isFinite(x.expiresAt) && x.expiresAt > now ? x : null;
}
const exact = (x: unknown, keys: string[]): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x) &&
  Object.keys(x).length === keys.length && keys.every(k => Object.hasOwn(x, k));
async function boundedJSON(request: Request): Promise<unknown> {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) throw new Error('json_required');
  if (Number(request.headers.get('content-length')) > 256_000) throw new Error('too_large');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('invalid_json');
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 256_000) { await reader.cancel(); throw new Error('too_large'); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch (error) { if (error instanceof Error && error.message === 'too_large') throw error; throw new Error('invalid_json'); }
  finally { reader.releaseLock(); }
}
/** Atomic hourly slots, fail closed on storage failure. No raw address or account ID in keys. */
export async function consumeLimit(store: CodexStore, subject: string, scope: string, limit: number): Promise<boolean> {
  const salt = process.env.RATE_LIMIT_SALT;
  if (!salt) throw new Error('Missing rate limit salt');
  const hour = windowId();
  const key = hour + '/' + await digest(`${salt}:${scope}:${hour}:${subject}`);
  // Slots are filled in order and immutable until expiry, so a full window costs one read.
  if (await store.getWithMetadata(key + '/' + (limit - 1), { type: 'json' })) return false;
  for (let slot = 0; slot < limit; slot++) {
    const result = await store.setJSON(key + '/' + slot, { exp: Date.now() + 48 * 3600_000 }, { onlyIfNew: true });
    if (writeSucceeded(result)) return true;
    if (result.modified) throw new Error('Unconfirmed rate-limit write');
  }
  return false;
}
interface Dependencies { accounts: CodexStore | null; limits: CodexStore | null; authenticate: (request: Request) => Promise<GithubIdentity | null> }
export async function contributionRequest(request: Request, deps: Dependencies = {
  accounts: codexStore('accounts'), limits: codexStore('limits'), authenticate: identity,
}): Promise<Response> {
  // Withdrawal and consent removal remain available while new submissions are paused.
  if (request.method === 'POST' && !submissionsOpen()) return json(503, { error: 'contributions_not_open' });
  try {
    const user = await deps.authenticate(request);
    if (!user) return json(401, { error: 'sign_in_required' });
    if (!validMutation(request, user)) return json(403, { error: 'csrf_failed' });
    const body = await boundedJSON(request);
    const fields = request.method === 'POST' ? ['report', 'optIn', 'revision'] : request.method === 'PATCH' ? ['optIn', 'revision'] : ['revision'];
    if (!exact(body, fields) || !(body.revision === null || (typeof body.revision === 'string' && body.revision.length <= 200)) ||
        (request.method !== 'DELETE' && typeof body.optIn !== 'boolean')) return json(400, { error: 'invalid_submission' });
    const report = request.method === 'POST' ? validateUsageReport(body.report) : null;
    if (request.method === 'POST' && !report) return json(400, { error: 'invalid_report' });
    const store = deps.accounts;
    if (!store) return json(503, { error: 'unavailable' });
    const key = await accountKey(user.id);
    // GET /me supplies a revision. A stale tab must never restore a withdrawn report.
    const previous = await store.getWithMetadata(key, { type: 'json' });
    if ((previous?.etag ?? null) !== body.revision || (previous && !previous.etag)) return json(409, { error: 'changed_reload' });
    const current = activeContribution(previous?.data);
    if (current && current.id !== user.id) throw new Error('Account mismatch');
    let next: object;
    if (request.method === 'DELETE') {
      // Keep an empty conditional-write tombstone, with no report, identity, consent or fingerprint.
      // Deleting the key outright would allow an old create request to resurrect a withdrawn report.
      next = { version: 2, withdrawn: true };
    } else if (request.method === 'PATCH') {
      if (!current) return json(404, { error: 'no_contribution' });
      if (!submissionsOpen() && body.optIn === true) return json(503, { error: 'contributions_not_open' });
      next = { ...current, login: user.login, optIn: body.optIn };
    } else {
      if (!deps.limits || !process.env.RATE_LIMIT_SALT) return json(503, { error: 'unavailable' });
      if (!(await consumeLimit(deps.limits, String(user.id), 'account', 5)) ||
          !(await consumeLimit(deps.limits, clientAddress(request.headers) || 'unknown', 'address', 20))) return json(429, { error: 'rate_limited' });
      const fingerprint = await reportFingerprint(report!);
      // One full snapshot per account. Same data from a different account is independent.
      // Identical resubmissions keep the existing review and retention deadline.
      next = { version: 2, id: user.id, login: user.login, report, fingerprint, optIn: body.optIn,
        status: current?.fingerprint === fingerprint ? current.status : 'pending_review',
        expiresAt: current?.fingerprint === fingerprint ? current.expiresAt : Date.now() + RETENTION_MS };
    }
    const result = await store.setJSON(key, next, previous?.etag ? { onlyIfMatch: previous.etag } : { onlyIfNew: true });
    if (!result.modified) return json(409, { error: 'changed_reload' });
    if (!writeSucceeded(result)) throw new Error('Unconfirmed account write');
    return json(request.method === 'POST' && !current ? 201 : 200, {
      ok: true, status: request.method === 'DELETE' ? 'withdrawn' : (next as Contribution).status, revision: result.etag,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (['json_required', 'too_large', 'invalid_json'].includes(message)) return json(message === 'too_large' ? 413 : message === 'json_required' ? 415 : 400, { error: message });
    return json(503, { error: 'unavailable' });
  }
}
export async function contributorListing(store: CodexStore | null = codexStore('accounts')): Promise<Response> {
  if (!store) return json(503, { error: 'unavailable' });
  try {
    const profiles = new Map<number, string>(); let scanned = 0;
    for await (const page of store.list({ prefix: 'account/', paginate: true })) {
      for (const blob of page.blobs) {
        if (++scanned > 1000) return json(503, { error: 'unavailable' });
        const record = activeContribution((await store.getWithMetadata(blob.key, { type: 'json' }))?.data);
        if (record?.status === 'accepted' && record.optIn && blob.key === await accountKey(record.id)) profiles.set(record.id, record.login);
      }
    }
    // Suppress the entire list, with no low-count disclosure. No usage buckets are public.
    const contributors = profiles.size < PUBLIC_MINIMUM ? [] : [...profiles].map(([id, login]) => ({
      login, profileUrl: `https://github.com/${login}`, avatarUrl: `https://avatars.githubusercontent.com/u/${id}?s=96`,
    })).sort((a, b) => a.login.localeCompare(b.login));
    return json(200, { contributors });
  } catch { return json(503, { error: 'unavailable' }); }
}
/** Moderation must name the exact report fingerprint and revision it reviewed. */
export async function acceptContribution(store: CodexStore, key: string, fingerprint: string, revision: string): Promise<boolean> {
  const entry = await store.getWithMetadata(key, { type: 'json' });
  const record = activeContribution(entry?.data);
  if (!record || record.status !== 'pending_review' || entry?.etag !== revision || record.fingerprint !== fingerprint ||
      key !== await accountKey(record.id) || await reportFingerprint(record.report) !== fingerprint) return false;
  return writeSucceeded(await store.setJSON(key, { ...record, status: 'accepted' }, { onlyIfMatch: revision }));
}
export async function expireContributions(store: CodexStore, now = Date.now()): Promise<void> {
  for await (const page of store.list({ prefix: 'account/', paginate: true })) {
    for (const blob of page.blobs) {
      const entry = await store.getWithMetadata(blob.key, { type: 'json' });
      const record = entry?.data as Contribution | undefined;
      if (record?.report && typeof record.expiresAt === 'number' && record.expiresAt <= now && entry?.etag) {
        const result = await store.setJSON(blob.key, { version: 2, withdrawn: true }, { onlyIfMatch: entry.etag });
        if (result.modified && !writeSucceeded(result)) throw new Error('Unconfirmed expiry');
      }
    }
  }
}
export async function accountStatus(request: Request, auth: CodexStore | null = codexStore('auth'), accounts: CodexStore | null = codexStore('accounts')): Promise<Response> {
  try {
    const user = await identity(request, auth);
    const signInAvailable = !!auth && !!process.env.RATE_LIMIT_SALT && githubAuthConfig()?.origin === new URL(request.url).origin;
    if (!user) return json(200, { authenticated: false, submissionsOpen: submissionsOpen(), signInAvailable });
    if (!accounts) return json(503, { error: 'unavailable' });
    const entry = await accounts.getWithMetadata(await accountKey(user.id), { type: 'json' });
    if (entry && !entry.etag) return json(503, { error: 'unavailable' });
    const record = activeContribution(entry?.data);
    if (record && record.id !== user.id) throw new Error('Account mismatch');
    return json(200, { authenticated: true, login: user.login, csrf: user.csrf, submissionsOpen: submissionsOpen(), signInAvailable,
      revision: entry?.etag ?? null, contribution: record ? { status: record.status, optIn: record.optIn } : null });
  } catch { return json(503, { error: 'unavailable' }); }
}
