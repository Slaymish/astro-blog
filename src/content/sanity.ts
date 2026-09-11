import { createClient } from '@sanity/client';
import { SANITY_API_VERSION, SANITY_DATASET, SANITY_PROJECT_ID } from 'astro:env/server';

const sanity = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  useCdn: true,
});

export const fetchSanity = <T>(query: string, params: Record<string, unknown> = {}) =>
  sanity.fetch<T>(query, params);

/**
 * Reads past the edge CDN. Content written to Sanity takes up to about two
 * minutes to reach a CDN read, so anything that must never be stale (the RSS
 * feed) uses this instead.
 */
export const fetchFreshSanity = <T>(query: string, params: Record<string, unknown> = {}) =>
  sanity.fetch<T>(query, params, { useCdn: false });
