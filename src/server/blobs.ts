import { getStore, type Store } from '@netlify/blobs';

/**
 * Named Netlify Blobs stores, or null when they are unavailable.
 *
 * Blob stores only exist on Netlify. `astro dev` has no site id or token, so
 * `getStore` throws there and in tests. Resolving every store a route needs
 * together means a route either has all of them or none: without them there is
 * nothing to write, and so nothing to meter either.
 */
export function stores<T extends string>(...names: T[]): Record<T, Store> | null {
  try {
    return Object.fromEntries(names.map((name) => [name, getStore(name)])) as Record<T, Store>;
  } catch {
    return null;
  }
}
