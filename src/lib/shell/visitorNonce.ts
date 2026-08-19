/**
 * The browser half of the visitor nonce contract described in
 * `src/lib/analytics.ts`: an opaque, random, per-browser value kept in
 * localStorage. It is minted by the booking-ref rewriter and read back by the
 * session beacon, which is what joins a confirmed booking to the session that
 * produced it. It identifies a browser, never a person, and is never derived
 * from anything the visitor typed.
 *
 * Every access is wrapped: localStorage throws outright in Safari's private
 * mode and under some cookie-blocking extensions, and losing attribution must
 * never break the page.
 */
import { VISITOR_NONCE_KEY } from '../analytics';

/** Returned in place of a nonce when localStorage is unavailable. */
const NO_STORAGE = 'nostorage';

/** The stored nonce, or an empty string when there is none to read. */
export function readVisitorNonce(): string {
  try {
    return localStorage.getItem(VISITOR_NONCE_KEY) || '';
  } catch {
    return '';
  }
}

/** The stored nonce, minting and persisting one on first use. */
export function ensureVisitorNonce(): string {
  try {
    const existing = localStorage.getItem(VISITOR_NONCE_KEY);
    if (existing) return existing;

    const minted = Math.random().toString(36).slice(2, 10);
    localStorage.setItem(VISITOR_NONCE_KEY, minted);
    return minted;
  } catch {
    return NO_STORAGE;
  }
}
