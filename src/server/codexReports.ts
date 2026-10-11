/** Strict v1 report validation. No user-supplied attribution is accepted. */
export interface UsageBucket {
  month: string; model: string; sessions: number; input_tokens: number;
  cached_input_tokens: number; output_tokens: number;
  reasoning_output_tokens: number; total_tokens: number;
}
export interface UsageReport {
  schemaVersion: 1; collectorVersion: string;
  dataType: 'aggregate_token_usage'; privacy: 'monthly-model-aggregates';
  summary: { filesInspected: number; usableSessions: number; snapshotsFound: number; skippedFiles: number };
  buckets: UsageBucket[];
}
const rootKeys = ['schemaVersion', 'collectorVersion', 'dataType', 'privacy', 'summary', 'buckets'];
const summaryKeys = ['filesInspected', 'usableSessions', 'snapshotsFound', 'skippedFiles'];
const bucketKeys = ['month', 'model', 'sessions', 'input_tokens', 'cached_input_tokens', 'output_tokens', 'reasoning_output_tokens', 'total_tokens'];
function exact(value: unknown, fields: string[]): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) &&
    Object.keys(value).length === fields.length && fields.every(k => Object.hasOwn(value, k));
}
function uint(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}
export function validateUsageReport(value: unknown): UsageReport | null {
  if (!exact(value, rootKeys) || value.schemaVersion !== 1 ||
    typeof value.collectorVersion !== 'string' || !/^\d+\.\d+\.\d+$/.test(value.collectorVersion) ||
    value.dataType !== 'aggregate_token_usage' || value.privacy !== 'monthly-model-aggregates' ||
    !exact(value.summary, summaryKeys) || !summaryKeys.every(k => uint((value.summary as Record<string, unknown>)[k])) ||
    !Array.isArray(value.buckets) || value.buckets.length < 1 || value.buckets.length > 240) return null;
  const summary = value.summary as unknown as UsageReport['summary'];
  let sessions = 0;
  const seen = new Set<string>();
  for (const item of value.buckets) {
    if (!exact(item, bucketKeys) || typeof item.month !== 'string' ||
      !/^\d{4}-(0[1-9]|1[0-2])$/.test(item.month) ||
      typeof item.model !== 'string' || !/^[A-Za-z0-9._-]{1,80}$/.test(item.model) ||
      !bucketKeys.slice(2).every(k => uint(item[k]))) return null;
    const row = item as unknown as UsageBucket;
    const key = row.month + ':' + row.model;
    if (seen.has(key) || row.sessions < 1 || row.cached_input_tokens > row.input_tokens ||
      row.reasoning_output_tokens > row.output_tokens ||
      (row.total_tokens > 0 && row.total_tokens < row.input_tokens + row.output_tokens)) return null;
    seen.add(key);
    sessions += row.sessions;
    if (!Number.isSafeInteger(sessions)) return null;
  }
  if (sessions !== summary.usableSessions || summary.filesInspected < sessions ||
    summary.skippedFiles > summary.filesInspected ||
    summary.snapshotsFound < summary.usableSessions) return null;
  return value as unknown as UsageReport;
}
export async function reportFingerprint(report: UsageReport): Promise<string> {
  const canonical = JSON.stringify(report.buckets.map(b => [
    b.month, b.model, b.sessions, b.input_tokens, b.cached_input_tokens,
    b.output_tokens, b.reasoning_output_tokens, b.total_tokens,
  ]).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))));
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical));
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
}
