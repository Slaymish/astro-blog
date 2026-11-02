#!/usr/bin/env node
// Publish the positioning copy to Sanity.
//
//   node publish-copy.mjs --check     validate against the live documents, no writes, no token
//   node publish-copy.mjs             dry run: Sanity validates the mutations, nothing is stored
//   SANITY_WRITE_ACK=1 node publish-copy.mjs --write   the real patch
//
// Written 2026-11-02 with docs/positioning-2026-11-02/manifest.json. Read AGENTS.md first:
// a write needs a second deploy several minutes later, because the build hook's own deploy
// races the per-query CDN purge.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const projectId = 'qnuj1c4o';
const dataset = 'production';
const apiVersion = '2024-01-01';

const args = new Set(process.argv.slice(2));
const checkOnly = args.has('--check');
const write = args.has('--write');

const manifest = JSON.parse(readFileSync(join(here, 'manifest.json'), 'utf8'));

// House rules for visitor-facing copy. A dash or a semicolon is a hard fail;
// a question mark is only worth a word, because some pages legitimately ask one.
const HARD = new Map([['\u2014', 'em dash'], ['\u2013', 'en dash'], [';', 'semicolon'], ['"', 'straight double quote']]);
const SOFT = new Map([['\u201C', 'curly open quote'], ['\u201D', 'curly close quote'], ['!', 'exclamation']]);

const problems = [];
const warnings = [];

function toBlock(text) {
  return [
    {
      _type: 'block',
      _key: 'positioning2026',
      style: 'normal',
      markDefs: [],
      children: [{ _type: 'span', _key: 'positioning2026span', marks: [], text }],
    },
  ];
}

async function refsBySlug(slugs) {
  const q = `*[_type == "workStory" && slug.current in ${JSON.stringify(slugs)}]{_id, "slug": slug.current}`;
  const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(q)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`featured lookup failed: ${res.status} ${await res.text()}`);
  const ids = new Map((await res.json()).result.map((doc) => [doc.slug, doc._id]));
  const missing = slugs.filter((slug) => !ids.has(slug));
  if (missing.length) throw new Error(`featured slugs match no work story: ${missing.join(', ')}`);
  return slugs.map((slug) => ({ _type: 'reference', _key: `featured-${slug}`, _ref: ids.get(slug) }));
}

async function resolve(patch) {
  const out = {};
  for (const [path, value] of Object.entries(patch)) {
    if (value && typeof value === 'object' && Array.isArray(value.__refsBySlug)) {
      out[path] = await refsBySlug(value.__refsBySlug);
    } else if (value && typeof value === 'object' && '__blockText' in value) {
      out[path] = toBlock(value.__blockText);
    } else {
      out[path] = value;
    }
  }
  return out;
}

function textOf(value) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length && value.every((item) => item && item._ref)) {
    return value.map((item) => item._ref).join(', ');
  }
  if (Array.isArray(value)) {
    return value
      .flatMap((b) => (b && Array.isArray(b.children) ? b.children.map((c) => c.text || '') : []))
      .join('');
  }
  return '';
}

// 1. Field-level limits and punctuation, before anything touches the network.
for (const [docId, { set }] of Object.entries(manifest.docs)) {
  for (const [path, value] of Object.entries(await resolve(set))) {
    const text = textOf(value);
    const limit = manifest.limits[`${docId}.${path}`];
    if (limit && text.length > limit) problems.push(`${docId}.${path}: ${text.length} chars, limit ${limit}`);
    for (const [ch, name] of HARD) if (text.includes(ch)) problems.push(`${docId}.${path}: contains a ${name}`);
    for (const [ch, name] of SOFT) if (text.includes(ch)) warnings.push(`${docId}.${path}: contains a ${name}`);
  }
}

// 2. Every target document must exist, and every array selector must still match.
async function fetchDocs() {
  const q = `*[_id in ${JSON.stringify(Object.keys(manifest.docs))}]`;
  const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(q)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`query failed: ${res.status} ${await res.text()}`);
  const body = await res.json();
  return new Map(body.result.map((d) => [d._id, d]));
}

function getPath(doc, path) {
  const m = path.match(/^([A-Za-z_]+)\[(?:_key=="([^"]+)")\]\.(.+)$/);
  if (m) {
    const [, arr, key, field] = m;
    const item = (doc[arr] || []).find((x) => x._key === key);
    return item === undefined ? undefined : item[field];
  }
  return path.split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), doc);
}

function truncate(s, n = 220) {
  const t = String(s ?? '').replace(/\s+/g, ' ');
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

const docs = await fetchDocs();
const mutations = [];

for (const [docId, { set }] of Object.entries(manifest.docs)) {
  const doc = docs.get(docId);
  if (!doc) {
    problems.push(`${docId}: document not found in ${dataset}`);
    continue;
  }
  const patch = await resolve(set);
  for (const [path, value] of Object.entries(patch)) {
    const current = getPath(doc, path);
    // An absent plain field is a field being added; an absent _key selector means
    // the array was reordered or the item deleted, which a patch would silently no-op.
    if (current === undefined && path.includes('_key==')) {
      problems.push(`${docId}.${path}: the key no longer matches an array item`);
      continue;
    }
    if (current === undefined) {
      console.log(`+ ${docId}.${path} (new field)`);
      continue;
    }
    const before = textOf(current);
    const after = textOf(value);
    if (before === after) {
      console.log(`= ${docId}.${path} unchanged`);
      continue;
    }
    console.log(`~ ${docId}.${path}`);
    console.log(`    was: ${truncate(before)}`);
    console.log(`    now: ${truncate(after)}`);
  }
  mutations.push({ patch: { id: docId, set: patch } });
}

for (const w of warnings) console.log(`warning: ${w}`);

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}

if (checkOnly) {
  console.log(`\nChecked ${Object.keys(manifest.docs).length} documents against ${dataset}. Nothing sent.`);
  process.exit(0);
}

const token = process.env.SANITY_API_TOKEN;
if (!token) {
  console.error('\nSANITY_API_TOKEN is not set. Run --check to validate offline, or ask Elio for the queued token step.');
  process.exit(1);
}
if (write && process.env.SANITY_WRITE_ACK !== '1') {
  console.error('\nRefusing the real write without SANITY_WRITE_ACK=1 (repo guard convention).');
  process.exit(1);
}

const dryRun = !write;
const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/mutate/${dataset}?${dryRun ? 'dryRun=true' : 'returnIds=true'}`;
const res = await fetch(url, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ mutations }),
});
const body = await res.text();
if (!res.ok) {
  console.error(`mutate failed: ${res.status} ${body}`);
  process.exit(1);
}
console.log(`\n${dryRun ? 'Dry run accepted' : 'Wrote'} ${mutations.length} document(s): ${body}`);
if (!dryRun) {
  console.log('Next: wait a few minutes, trigger one build, then check /about and /work (not just /).');
}
