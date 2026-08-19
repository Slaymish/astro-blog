/**
 * Fixed-window rate limiting for unauthenticated write endpoints.
 *
 * /api/collect accepts anonymous writes into a blob store. Per-request size is
 * bounded, but request *count* was not, which left the store a free write
 * primitive: a loop could mint unlimited objects, growing storage cost and
 * crowding real sessions out of the nightly report's sample.
 *
 * Callers are identified by a salted hash of their IP. The raw address is
 * never written anywhere, which keeps the collector's promise that it stores
 * no IP address intact: the hash exists only inside a counter key that is
 * pruned nightly.
 *
 * This is a cost and abuse guard, not a security boundary. The read-modify-
 * write below races under concurrency and may undercount, which is an
 * acceptable trade for not needing a transactional store.
 */

/**
 * The subset of Netlify's Blobs Store this module needs, so tests can fake it.
 *
 * Both methods resolve `unknown` because neither result is read here. Narrowing
 * `setJSON` to `Promise<void>` would reject the real Store, whose write resolves
 * a `WriteResult`, while a fake that resolves nothing still satisfies `unknown`.
 */
export interface CounterStore {
  get(key: string, options: { type: 'json' }): Promise<unknown>;
  setJSON(key: string, value: unknown): Promise<unknown>;
}

export const RATE_LIMIT_STORE = 'rate-limits';

/** Requests permitted per client per window. Generous for a human browsing. */
export const COLLECT_LIMIT_PER_WINDOW = 120;

/** Bucket used when no client address can be resolved from the request. */
const SHARED_BUCKET = 'unknown';

/**
 * The current fixed window as `YYYY-MM-DDTHH`. Hourly buckets keep the key
 * space small enough to prune cheaply while still bounding a sustained flood.
 */
export function windowId(now: Date = new Date()): string {
  return now.toISOString().slice(0, 13);
}

/**
 * Netlify sets `x-nf-client-connection-ip` on every request; `x-forwarded-for`
 * is the fallback for local dev and other runtimes.
 */
export function clientAddress(headers: Headers): string | null {
  const direct = headers.get('x-nf-client-connection-ip');
  if (direct) return direct.trim() || null;

  const forwarded = headers.get('x-forwarded-for');
  if (!forwarded) return null;

  return forwarded.split(',')[0]?.trim() || null;
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Counter key for one client in one window.
 *
 * The window id is mixed into the hash as well as the key, so the same address
 * produces a different hash each hour and the keys cannot be correlated across
 * windows to reconstruct a visit history.
 */
export async function counterKey(address: string | null, window: string, salt: string): Promise<string> {
  if (!address) return `${window}/${SHARED_BUCKET}`;

  const digest = await sha256Hex(`${salt}:${window}:${address}`);
  return `${window}/${digest.slice(0, 32)}`;
}

/**
 * Records one request against `key`. Returns false once the limit is reached,
 * in which case nothing is written.
 */
export async function consume(store: CounterStore, key: string, limit: number): Promise<boolean> {
  let count = 0;
  try {
    const current = (await store.get(key, { type: 'json' })) as { n?: unknown } | null;
    if (typeof current?.n === 'number' && Number.isFinite(current.n)) {
      count = current.n;
    }
  } catch {
    // An unreadable counter must not take the endpoint down. Treating it as
    // zero fails open for one request, which is the right trade for a guard
    // whose only job is bounding cost.
    count = 0;
  }

  if (count >= limit) return false;

  try {
    await store.setJSON(key, { n: count + 1 });
  } catch {
    // Same reasoning: a failed counter write should not reject a real beacon.
  }

  return true;
}

/** True when a counter key belongs to a window at or before `cutoffWindow`. */
export function isExpiredCounter(key: string, cutoffWindow: string): boolean {
  const window = key.split('/')[0];
  if (!window) return false;

  return window < cutoffWindow;
}
