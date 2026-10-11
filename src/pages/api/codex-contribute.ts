/** Opt-in report ingestion. No public listing, attribution or raw session history. */
import { stores } from '../../server/blobs';
import { validateUsageReport, reportFingerprint } from '../../server/codexReports';
import { clientAddress, consume, counterKey, RATE_LIMIT_STORE, windowId } from '../../server/rateLimit';
import { secrets } from '../../server/secrets';

export const prerender = false;
const STORE = 'codex-usage-reports';
const MAX_BYTES = 256_000;
const json = (status: number, body: object) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

export async function POST({ request }: { request: Request }): Promise<Response> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return json(415, { error: 'json_required' });
  const length = Number(request.headers.get('content-length'));
  if (Number.isFinite(length) && length > MAX_BYTES) return json(413, { error: 'too_large' });
  let body: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BYTES) return json(413, { error: 'too_large' });
    body = JSON.parse(raw);
  } catch { return json(400, { error: 'invalid_json' }); }
  // Reject all extra fields, including unverified GitHub usernames and consent flags.
  const report = validateUsageReport(body);
  if (!report) return json(400, { error: 'invalid_report' });
  if (!secrets.rateLimitSalt()) return json(503, { error: 'unavailable' });
  const store = stores(RATE_LIMIT_STORE, STORE);
  if (!store) return json(503, { error: 'unavailable' });
  try {
    const key = await counterKey(clientAddress(request.headers), windowId(), secrets.rateLimitSalt(), 'codex');
    if (!(await consume(store[RATE_LIMIT_STORE], key, 5))) return json(429, { error: 'rate_limited' });
    const fingerprint = await reportFingerprint(report);
    const existing = await store[STORE].get(fingerprint);
    if (existing !== null) return json(409, { error: 'already_submitted' });
    // Only aggregate report data. No IP, user agent, GitHub handle or session transcripts.
    await store[STORE].setJSON(fingerprint, { report, receivedAt: new Date().toISOString(), status: 'pending_review' });
    return json(201, { ok: true, status: 'pending_review' });
  } catch {
    return json(503, { error: 'unavailable' });
  }
}
