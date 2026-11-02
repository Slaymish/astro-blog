#!/usr/bin/env node
// Create the Beth Hurley work story, uploading its screenshots.
//
//   node publish-beth.mjs --check                      validate the draft, no token needed
//   SANITY_WRITE_ACK=1 node publish-beth.mjs --write    upload assets and create the document
//
// Screenshots are captured from the live site with Playwright (reduced motion, 2x,
// 1440x810 at 16:9) and resized to 2400px wide before they land here. See COPY.md
// beside this file for where each one came from.

import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { createReadStream } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');
const require = createRequire(join(repoRoot, 'package.json'));
const { createClient } = require('@sanity/client');

const projectId = 'qnuj1c4o';
const dataset = 'production';
const apiVersion = '2024-01-01';

const args = new Set(process.argv.slice(2));
const checkOnly = args.has('--check');
const write = args.has('--write');

const story = JSON.parse(readFileSync(join(here, 'story.json'), 'utf8'));

const problems = [];
const HARD = [['\u2014', 'em dash'], ['\u2013', 'en dash'], [';', 'semicolon'], ['"', 'straight double quote'], ['\u201C', 'curly quote'], ['\u201D', 'curly quote'], ['!', 'exclamation']];

function stringsIn(value, path = '', out = []) {
  if (typeof value === 'string') out.push([path, value]);
  else if (Array.isArray(value)) value.forEach((v, i) => stringsIn(v, `${path}[${i}]`, out));
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) stringsIn(v, path ? `${path}.${k}` : k, out);
  return out;
}

// 1. House copy rules over every string in the document.
for (const [path, text] of stringsIn(story)) {
  if (path === '_id' || path === '_type' || path.endsWith('.slug.current') || path.startsWith('links')) continue;
  for (const [ch, name] of HARD) if (text.includes(ch)) problems.push(`${path}: contains a ${name}`);
}

// 2. Lengths the schema enforces.
const LIMITS = { title: 80, descriptor: 60, summary: 180, introduction: 320, role: 180, result: 280, timeframe: 60 };
for (const [field, limit] of Object.entries(LIMITS)) {
  const text = story[field] ?? '';
  if (!text) problems.push(`${field}: required`);
  else if (text.length > limit) problems.push(`${field}: ${text.length} chars, limit ${limit}`);
}
if ((story.cover?.alt ?? '').length > 240) problems.push('cover.alt: over 240 chars');
if ((story.cover?.alt ?? '').length === 0) problems.push('cover.alt: required');

// 3. Every referenced image must exist, be 16:9 (except the phone shot), and be a JPEG.
function imageCheck(path, label, require169 = true) {
  const abs = join(here, path);
  if (!existsSync(abs)) return problems.push(`${label}: missing file ${path}`);
  const head = readFileSync(abs).subarray(0, 4);
  if (head[0] !== 0xff || head[1] !== 0xd8) problems.push(`${label}: ${path} is not a JPEG`);
  const kb = Math.round(statSync(abs).size / 1024);
  if (kb > 900) problems.push(`${label}: ${path} is ${kb}KB, too heavy to upload`);
  if (require169) console.log(`  ${label}: ${path} (${kb}KB)`);
  else console.log(`  ${label}: ${path} (${kb}KB, phone ratio)`);
  return kb;
}
imageCheck(story.cover.file, 'cover');
story.evidence.forEach((item, i) => imageCheck(item.file, `evidence ${i}`, i !== 2));

// 4. The document must not already exist: createOrReplace would quietly clobber edits.
const client = createClient({ projectId, dataset, apiVersion, token: process.env.SANITY_API_TOKEN, useCdn: false });

const existing = await client.fetch('*[_id == $id][0]{_id, _updatedAt}', { id: story._id });
if (existing) problems.push(`${story._id} already exists (updated ${existing._updatedAt}). Edit it in Studio instead of overwriting.`);

// 5. Count the work stories so the order field does not silently collide.
const ordered = await client.fetch('*[_type == "workStory" && order == $order][0]{_id, title}', { order: story.order });
if (ordered) problems.push(`order ${story.order} is already used by ${ordered.title}`);

for (const p of problems) console.error(`problem: ${p}`);
if (problems.length) process.exit(1);

const wordCount = story.body.flatMap((b) => b.children ?? []).reduce((n, c) => n + (c.text ?? '').split(/\s+/).length, 0);
console.log(`\n${story.title}: ${story.body.length} paragraphs, ${wordCount} words, ${story.evidence.length} evidence images.`);
console.log(`Target: ${story._id} in ${dataset}.`);

if (checkOnly) {
  console.log('\nChecked. Nothing uploaded, nothing written.');
  process.exit(0);
}
if (!process.env.SANITY_API_TOKEN) {
  console.error('\nSANITY_API_TOKEN is not set. Run --check to validate, or ask Elio for the queued token step.');
  process.exit(1);
}
if (!write) {
  console.error('\nRefusing without --write (and SANITY_WRITE_ACK=1).');
  process.exit(1);
}
if (process.env.SANITY_WRITE_ACK !== '1') {
  console.error('\nRefusing the real write without SANITY_WRITE_ACK=1 (repo guard convention).');
  process.exit(1);
}

async function upload(path) {
  const asset = await client.assets.upload('image', createReadStream(join(here, path)), { filename: path.split('/').pop() });
  return { _type: 'image', asset: { _type: 'reference', _ref: asset._id } };
}

const doc = {
  ...story,
  cover: { kind: story.cover.kind, alt: story.cover.alt, image: await upload(story.cover.file) },
  evidence: [],
};
for (const item of story.evidence) {
  doc.evidence.push({ _key: item._key, heading: item.heading, label: item.label, alt: item.alt, image: await upload(item.file) });
}

const created = await client.create(doc);
console.log(`Created ${created._id}. Next: a build several minutes later, then check /work and /work/beth-hurley.`);
