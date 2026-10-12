import { codexStoreName } from './codexDeployment';
import { getStore } from '@netlify/blobs';

/** Strong reads and conditional writes are required for auth and account updates. */
export interface CodexStore {
  getWithMetadata(key: string, options: { type: 'json' }): Promise<{ data: unknown; etag?: string } | null>;
  setJSON(key: string, value: unknown, options: { onlyIfNew: true } | { onlyIfMatch: string }): Promise<{ modified: boolean; etag?: string }>;
  list(options: { prefix?: string; paginate: true }): AsyncIterable<{ blobs: { key: string }[] }>;
  delete(key: string): Promise<unknown>;
}
export function codexStore(name: 'auth' | 'accounts' | 'limits'): CodexStore | null {
  // Deploy previews must never read or mutate the site's production contributions.
  const storeName = codexStoreName(name);
  if (!storeName) return null;
  try { return getStore({ name: storeName, consistency: 'strong' }); }
  catch { return null; }
}
export function writeSucceeded(result: { modified: boolean; etag?: string }): boolean {
  // Some SDK/server failures report modified=true without an ETag. Fail closed.
  return result.modified === true && typeof result.etag === 'string' && result.etag.length > 0;
}
