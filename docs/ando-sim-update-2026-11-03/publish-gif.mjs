#!/usr/bin/env node
/** Publish only AndoSim's rendered, animated cover. No copy or other docs change. */
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { createReadStream, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const repo = resolve(import.meta.dirname, '../..');
const require = createRequire(resolve(repo, 'package.json'));
const { createClient } = require('@sanity/client');
const gif = resolve(repo, 'docs/example_images/cover-ando-sim.gif');
const id = 'catalogue-backfill-ando-sim';
const alt = 'A teal-and-copper cloth sheet falls onto a faceted rigid sphere and wraps around it in a Blender render baked by AndoSim.';
const readEnv = (path, key) => {
  try {
    const match = readFileSync(path, 'utf8').match(new RegExp(`^${key}=(.*)$`, 'm'));
    return match?.[1].trim().replace(/^["']|["']$/g, '');
  } catch { return undefined; }
};
const projectId = readEnv(resolve(repo, '.env'), 'SANITY_PROJECT_ID') || 'qnuj1c4o';
const dataset = readEnv(resolve(repo, '.env'), 'SANITY_DATASET') || 'production';
const token = process.env.SANITY_API_TOKEN || readEnv(resolve(homedir(), '.hermes/.env'), 'SANITY_API_TOKEN');
const write = process.argv.includes('--write');
if (write && (process.env.SANITY_WRITE_ACK !== '1' || !token)) throw new Error('SANITY_WRITE_ACK=1 and token required');
if (statSync(gif).size < 100_000 || readFileSync(gif).toString('ascii', 0, 6) !== 'GIF89a') throw new Error('Not the rendered GIF');
if (alt.length > 240) throw new Error('Alt text too long');
const client = createClient({ projectId, dataset, apiVersion: '2024-01-01', token, useCdn: false });
const current = await client.fetch('*[_id == $id][0]{_id,cover}', { id });
if (!current) throw new Error(`Missing ${id}`);
console.log(`${write ? 'WRITE' : 'CHECK'} ${id}: ${statSync(gif).size} GIF bytes; current cover ${current.cover?.image?.asset?._ref ?? 'none'}`);
if (write) {
  const asset = await client.assets.upload('image', createReadStream(gif), { filename: 'cover-ando-sim.gif', contentType: 'image/gif' });
  if (!asset._id.startsWith('image-') || !asset._id.endsWith('-gif')) throw new Error(`Unexpected asset ID: ${asset._id}`);
  await client.patch(id).set({ 'cover.kind': 'image', 'cover.alt': alt, 'cover.image': { _type: 'image', asset: { _type: 'reference', _ref: asset._id } } }).unset(['cover.figure']).commit();
  const actual = await client.fetch('*[_id == $id][0]{cover}', { id });
  if (actual.cover?.image?.asset?._ref !== asset._id || actual.cover?.alt !== alt) throw new Error('Read-back differs');
  console.log(`Verified GIF cover: ${asset._id} ${asset.url}`);
}
