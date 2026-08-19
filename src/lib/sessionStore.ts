/**
 * Store names and key formats for the analytics blob stores.
 *
 * Three files write or read these keys (the collector, the Cal.com webhook and
 * the nightly synthesis), so the format lives here rather than as string
 * literals in each. Retention depends on the day being recoverable from the
 * key, which is only safe if one module owns both halves.
 */

export const SESSION_STORE = 'sessions';

/**
 * Store holding the nightly report. The scheduled function writes it and
 * /api/insights reads it, so the name belongs here for the same reason the key
 * formats do: more than one file has to agree on it.
 */
export const INSIGHTS_STORE = 'session-insights';

/** The single key in `INSIGHTS_STORE`, overwritten by each nightly run. */
export const LATEST_REPORT_KEY = 'latest';

const CONVERSION_PREFIX = 'conversions/';
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Today as `YYYY-MM-DD`, the day component of every key. */
export function dayStamp(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** `YYYY-MM-DD/<uuid>` — one blob per flushed beacon. */
export function sessionKey(day: string, id: string): string {
  return `${day}/${id}`;
}

/** `conversions/YYYY-MM-DD/<uuid>` — one blob per confirmed booking. */
export function conversionKey(day: string, id: string): string {
  return `${CONVERSION_PREFIX}${day}/${id}`;
}

/** Prefix that lists every session blob for a day, excluding conversions. */
export function sessionPrefix(day: string): string {
  return `${day}/`;
}

/** Prefix that lists every conversion blob for a day. */
export function conversionPrefix(day: string): string {
  return `${CONVERSION_PREFIX}${day}/`;
}

/** True for a confirmed-booking record rather than a browsing session. */
export function isConversionKey(key: string): boolean {
  return key.startsWith(CONVERSION_PREFIX);
}

/** The day a key belongs to, or null if the key does not match either format. */
export function dayFromKey(key: string): string | null {
  const rest = key.startsWith(CONVERSION_PREFIX) ? key.slice(CONVERSION_PREFIX.length) : key;
  const day = rest.split('/')[0];

  return day && DAY_PATTERN.test(day) ? day : null;
}

/**
 * True when a key is old enough to delete. Keys whose day cannot be parsed are
 * never expired: an unrecognised key is more likely a format change than
 * rubbish, and silently deleting it would lose data.
 */
export function isExpiredKey(key: string, cutoffDay: string): boolean {
  const day = dayFromKey(key);
  if (!day) return false;

  return day < cutoffDay;
}

/** The oldest day worth keeping, given a retention period. */
export function retentionCutoff(retentionDays: number, now: Date = new Date()): string {
  return dayStamp(new Date(now.getTime() - retentionDays * 86_400_000));
}
