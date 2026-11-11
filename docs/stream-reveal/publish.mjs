/**
 * Publish the stream-reveal article as a `post`, so it reaches the writing feed
 * that /work and /writing read. Until now the copy existed only as the scaffold
 * page src/pages/notes/one-view-of-the-answer.astro (deleted in the same change)
 * and as markdown in docs/stream-reveal/post-body.md.
 *
 * Dry run by default: it reads the dataset and reports what it would write.
 * A real write needs both --write and SANITY_WRITE_ACK=1.
 *
 *   node docs/stream-reveal/publish.mjs              # dry run
 *   SANITY_WRITE_ACK=1 node docs/stream-reveal/publish.mjs --write
 *
 * The token comes from SANITY_API_TOKEN in the environment, not from .env.
 */
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const repo = path.resolve(here, '../..');
const require = createRequire(path.join(repo, 'package.json'));
const { createClient } = require('@sanity/client');

const env = Object.fromEntries(
  (await fs.readFile(path.join(repo, '.env'), 'utf8'))
    .split('\n')
    .filter((line) => line.includes('=') && !line.trim().startsWith('#'))
    .map((line) => {
      const at = line.indexOf('=');
      return [line.slice(0, at).trim(), line.slice(at + 1).trim().replace(/^["']|["']$/g, '')];
    }),
);

const write = process.argv.includes('--write');
if (write && process.env.SANITY_WRITE_ACK !== '1') {
  throw new Error('Refusing to write to the production dataset without SANITY_WRITE_ACK=1');
}

const token = process.env.SANITY_API_TOKEN;
if (!token) throw new Error('SANITY_API_TOKEN is not in the environment');

const client = createClient({
  projectId: env.SANITY_PROJECT_ID,
  dataset: env.SANITY_DATASET,
  token,
  apiVersion: env.SANITY_API_VERSION ?? '2024-01-01',
  useCdn: false,
});

const SLUG = 'one-view-of-the-answer';
const ID = `post-${SLUG}`;
const TITLE = 'Testing six ways to show an AI answer';
const EXCERPT =
  'Streaming an AI answer a character at a time keeps moving the text while you try to read it. I tried six ways of showing the same answer and counted how often each one moves.';
const PUBLISHED_AT = '2026-11-07T00:00:00.000Z';
const TAGS = ['Product design', 'UX design', 'AI'];
const VALUE_SCORE = 70;
const VALUE_REASON =
  'A written argument carried by a demonstration that measures its own claim: the reflow cost of six ways of drawing one answer, observed in the page, with the column it cannot measure labelled as the animation.';

const body = (await fs.readFile(path.join(here, 'post-body.md'), 'utf8')).trim();

// The schema caps the excerpt at 240 and the route only renders markers that
// arrive as a whole paragraph of their own.
if (EXCERPT.length > 240) throw new Error(`Excerpt is ${EXCERPT.length} characters, the schema caps it at 240`);
const markers = body.split('\n').filter((line) => /^\{\{[a-z0-9-]+\}\}$/.test(line.trim()));
if (markers.length !== 1 || String(markers[0]).trim() !== '{{stream-reveal}}') {
  throw new Error(`Expected exactly one {{stream-reveal}} line, found ${JSON.stringify(markers)}`);
}

const doc = {
  _id: ID,
  _type: 'post',
  title: TITLE,
  slug: { _type: 'slug', current: SLUG },
  publishedAt: PUBLISHED_AT,
  excerpt: EXCERPT,
  tags: TAGS,
  markdownBody: body,
  related: [],
  valueScore: VALUE_SCORE,
  valueReason: VALUE_REASON,
};

console.log(`post:   ${TITLE}`);
console.log(`slug:   /posts/${SLUG}`);
console.log(`date:   ${PUBLISHED_AT} (${new Date(PUBLISHED_AT).toLocaleDateString('en-NZ', { timeZone: 'Pacific/Auckland', dateStyle: 'long' })} in Wellington)`);
console.log(`excerpt ${EXCERPT.length}/240, body ${body.length} characters, tags ${TAGS.join(', ')}, value ${VALUE_SCORE}`);
console.log(`has {{stream-reveal}}: ${markers.length === 1}`);

const existing = await client.fetch(
  `*[_type == "post" && (_id == $id || slug.current == $slug)]{_id, "slug": slug.current, title, "bodyLength": length(markdownBody)}`,
  { id: ID, slug: SLUG },
);
const update = process.argv.includes('--update');

if (existing.length && !update) {
  throw new Error(`Already present, refusing to replace it: ${JSON.stringify(existing)}`);
}

if (update && !existing.length) {
  throw new Error('--update needs a document that already exists; run without it to create one');
}

if (update) {
  const current = existing[0];
  console.log(`\nupdate: ${current._id} body ${current.bodyLength} -> ${body.length} characters`);
  if (!write) {
    console.log('Dry run. Re-run with SANITY_WRITE_ACK=1 and --write --update to patch it.');
    process.exit(0);
  }
  const patched = await client
    .patch(current._id)
    .set({ title: TITLE, markdownBody: body, excerpt: EXCERPT })
    .commit();
  const readBack = await client.fetch(
    `*[_id == $id][0]{"bodyLength": length(markdownBody), "excerptLength": length(excerpt), "hasMarker": markdownBody match "*{{stream-reveal}}*", "matches": markdownBody == $body, title}`,
    { id: current._id, body },
  );
  console.log('patched:', JSON.stringify(patched._id));
  console.log('read back:', JSON.stringify(readBack, null, 2));
  process.exit(0);
}

if (!write) {
  console.log('\nDry run. Re-run with SANITY_WRITE_ACK=1 and --write to create it.');
  process.exit(0);
}

const created = await client.create(doc);
const readBack = await client.fetch(
  `*[_id == $id][0]{_id, title, "slug": slug.current, publishedAt, valueScore, "tags": tags, "excerptLength": length(excerpt), "bodyLength": length(markdownBody), "hasMarker": markdownBody match "*{{stream-reveal}}*"}`,
  { id: created._id },
);
console.log('\ncreated:', JSON.stringify(created._id));
console.log('read back:', JSON.stringify(readBack, null, 2));
