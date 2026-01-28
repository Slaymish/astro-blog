import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

const projectId =
  import.meta.env.PUBLIC_SANITY_PROJECT_ID ||
  import.meta.env.SANITY_PROJECT_ID ||
  process.env.SANITY_PROJECT_ID ||
  '';
const dataset =
  import.meta.env.PUBLIC_SANITY_DATASET ||
  import.meta.env.SANITY_DATASET ||
  process.env.SANITY_DATASET ||
  'production';
const apiVersion =
  import.meta.env.PUBLIC_SANITY_API_VERSION ||
  import.meta.env.SANITY_API_VERSION ||
  process.env.SANITY_API_VERSION ||
  '2024-01-01';

if (!projectId) {
  throw new Error('Missing SANITY_PROJECT_ID. Add it to your .env file.');
}

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false
});

const builder = imageUrlBuilder(sanityClient);

export const urlFor = (source: unknown) => builder.image(source as any);

export async function fetchSanity<T>(query: string, params: Record<string, unknown> = {}) {
  return sanityClient.fetch<T>(query, params);
}
