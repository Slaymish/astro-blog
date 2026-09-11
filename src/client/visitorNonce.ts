/**
 * The browser half of the visitor nonce contract in `src/server/analytics.ts`:
 * an opaque random value kept in sessionStorage for the life of one tab. The
 * booking-ref rewriter mints it and the session beacon reads it back, which is
 * what joins a confirmed booking to the session that produced it. It never
 * identifies a person and is never derived from anything the visitor typed.
 *
 * Every access is wrapped: sessionStorage throws outright in Safari's private
 * mode and under some cookie-blocking extensions, and losing attribution must
 * never break the page.
 */
import { VISITOR_NONCE_KEY } from '../server/analytics';

/** Returned in place of a nonce when sessionStorage is unavailable. */
const NO_STORAGE = 'nostorage';

/** The stored nonce, or an empty string when there is none to read. */
export function readVisitorNonce(): string {
  try {
    return sessionStorage.getItem(VISITOR_NONCE_KEY) || '';
  } catch {
    return '';
  }
}

/** The stored nonce, minting and persisting one on first use. */
export function ensureVisitorNonce(): string {
  try {
    const existing = sessionStorage.getItem(VISITOR_NONCE_KEY);
    if (existing) return existing;

    const minted = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    sessionStorage.setItem(VISITOR_NONCE_KEY, minted);
    return minted;
  } catch {
    return NO_STORAGE;
  }
}
