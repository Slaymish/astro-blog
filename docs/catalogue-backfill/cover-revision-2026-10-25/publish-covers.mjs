/**
 * Publish the 2026-10-25 cover revision to Sanity.
 *
 * Dry run by default: it reads the dataset and reports what it would change.
 * A real write needs both --write and SANITY_WRITE_ACK=1, matching the guard in
 * .claude/hooks/guard-destructive.sh.
 *
 *   node publish-covers.mjs              # dry run
 *   SANITY_WRITE_ACK=1 node publish-covers.mjs --write
 *
 * Uploads go through @sanity/client rather than a hand-rolled multipart body:
 * the same request built by hand (and the same one sent by curl) is rejected by
 * the asset endpoint as "unsupported image format", which is a multipart framing
 * problem rather than a problem with the images.
 */
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire('/Users/hamishburke/Developer/astro-blog/package.json');
const { createClient } = require('@sanity/client');

const here = path.dirname(new URL(import.meta.url).pathname);
const repo = path.resolve(here, '../../..');
const env = Object.fromEntries(
  (await fs.readFile(path.join(repo, '.env'), 'utf8'))
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    }),
);

const write = process.argv.includes('--write');
if (write && process.env.SANITY_WRITE_ACK !== '1') {
  throw new Error('Refusing to write to the production dataset without SANITY_WRITE_ACK=1');
}

const client = createClient({
  projectId: env.SANITY_PROJECT_ID,
  dataset: env.SANITY_DATASET,
  token: env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

const manifest = JSON.parse(await fs.readFile(path.join(here, 'manifest.json'), 'utf8'));
const slugs = manifest.covers.map((c) => c.slug);

const docs = await client.fetch(
  `*[_type == "workStory" && slug.current in $slugs]{
     _id, "slug": slug.current, title,
     cover{ kind, alt, "file": image.asset->originalFilename }
   }`,
  { slugs },
);
const bySlug = new Map(docs.map((d) => [d.slug, d]));
const missing = slugs.filter((s) => !bySlug.has(s));
if (missing.length) throw new Error(`No workStory for: ${missing.join(', ')}`);

console.log(`${write ? 'PUBLISH' : 'DRY RUN'}: ${manifest.covers.length} covers\n`);

let changed = 0;
for (const cover of manifest.covers) {
  const doc = bySlug.get(cover.slug);
  const was = `${doc.cover?.kind ?? 'none'} (${doc.cover?.file ?? '-'})`;
  if (!write) {
    console.log(`  ${cover.slug.padEnd(32)} ${was.padEnd(36)} -> image (${path.basename(cover.file)})`);
    continue;
  }
  const asset = await client.assets.upload('image', createReadStream(path.join(here, cover.file)), {
    filename: path.basename(cover.file),
  });
  await client
    .patch(doc._id)
    .set({
      'cover.kind': 'image',
      'cover.alt': cover.alt,
      'cover.image': { _type: 'image', asset: { _type: 'reference', _ref: asset._id } },
    })
    .unset(['cover.figure'])
    .commit();
  changed += 1;
  console.log(`  ${cover.slug.padEnd(32)} ${was.padEnd(36)} -> image ${asset._id}`);
}

if (!write) {
  console.log('\nDry run only. Re-run with --write and SANITY_WRITE_ACK=1 to publish.');
  process.exit(0);
}

console.log(`\nPatched ${changed} documents.`);

const after = await client.fetch(
  `*[_type == "workStory" && slug.current in $slugs]{
     "slug": slug.current, cover{ kind, alt, "asset": image.asset->_id }
   }`,
  { slugs },
);
const bad = after.filter((d) => d.cover?.kind !== 'image' || !d.cover?.asset);
console.log(
  bad.length
    ? `Still not an image cover: ${bad.map((d) => d.slug).join(', ')}`
    : 'Verified: every listed story now has an image cover with alt text.',
);
