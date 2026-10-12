import type { CodexStore } from '../src/server/codexStore';
export class MemoryStore implements CodexStore {
  entries = new Map<string, { data: unknown; etag: string }>();
  writes = 0; fail = false;
  async getWithMetadata(key: string) { if (this.fail) throw new Error('offline'); return structuredClone(this.entries.get(key) ?? null); }
  async setJSON(key: string, data: unknown, options: { onlyIfNew: true } | { onlyIfMatch: string }) {
    if (this.fail) throw new Error('offline');
    const previous = this.entries.get(key);
    if (('onlyIfNew' in options && previous) || ('onlyIfMatch' in options && options.onlyIfMatch !== previous?.etag)) return { modified: false };
    const etag = 'revision-' + ++this.writes;
    this.entries.set(key, { data: structuredClone(data), etag });
    return { modified: true, etag };
  }
  async *list(options: { prefix?: string }) { if (this.fail) throw new Error('offline'); yield { blobs: [...this.entries.keys()].filter(key => key.startsWith(options.prefix || '')).map(key => ({ key })) }; }
  async delete(key: string) { if (this.fail) throw new Error('offline'); this.entries.delete(key); }
}
export const sampleReport = () => ({ schemaVersion: 1 as const, collectorVersion: '0.1.0', dataType: 'aggregate_token_usage' as const, privacy: 'monthly-model-aggregates' as const,
  summary: { filesInspected: 1, usableSessions: 1, snapshotsFound: 2, skippedFiles: 0 },
  buckets: [{ month: '2026-10', model: 'gpt-6.1-sol', sessions: 1, input_tokens: 100, cached_input_tokens: 20, output_tokens: 30, reasoning_output_tokens: 10, total_tokens: 130 }],
});
export function configure() {
  process.env.CODEX_GITHUB_CLIENT_ID = 'test-id'; process.env.CODEX_GITHUB_CLIENT_SECRET = 'test-client-secret';
  process.env.CODEX_AUTH_SECRET = 'test-auth-secret'.repeat(3); process.env.RATE_LIMIT_SALT = 'test-rate-salt';
  process.env.CODEX_CONTRIBUTIONS_ENABLED = 'true'; delete process.env.CODEX_GITHUB_ORIGIN;
}
