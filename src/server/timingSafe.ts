/**
 * Constant-time string comparison.
 *
 * Shared by every secret check on the site (webhook signatures, bearer
 * tokens). A plain `===` short-circuits on the first differing byte, which
 * leaks the secret one character at a time to anyone able to time responses.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  // Length is not itself secret, and comparing unequal lengths byte-wise
  // would read past the end of the shorter string.
  if (a.length !== b.length) return false;

  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
