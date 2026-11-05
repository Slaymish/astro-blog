#!/usr/bin/env node
// Remove the dead about-page fields and de-duplicate the live copy.
//
//   node publish-copy.mjs --check     validate against the live document, no token, no writes
//   node publish-copy.mjs             dry run: Sanity validates the mutation, nothing is stored
//   SANITY_WRITE_ACK=1 node publish-copy.mjs --write   the real patch
//
// Why: aboutPage still carries `hero` and `portrait` from an older schema. Neither is in
// src/sanity/schemaTypes/aboutPage.ts any more and neither is in the getAboutPage() projection,
// so nothing renders them, but both still say "Web developer at Alphero" while every rendered
// title says "software engineer". The live page also printed the same thesis twice: `intro`
// ("the same two questions, who is allowed to reach a system...") and `largeCopy` ("they come
// back to the same thing, a system somebody else can reach..."). This patch drops the dead
// fields and gives `largeCopy` the concrete job it was competing for: which projects these are.

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

async function resolve(set) {
  const out = {};
  for (const [path, value] of Object.entries(set)) {
    out[path] = value && typeof value === 'object' && '__blockText' in value ? toBlock(value.__blockText) : value;
  }
  return out;
}

function textOf(value) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value
      .flatMap((b) => (b && Array.isArray(b.children) ? b.children.map((c) => c.text || '') : []))
      .join('');
  }
  return '';
}

// 1. House rules and limits, before anything touches the network.
for (const [docId, ops] of Object.entries(manifest.docs)) {
  for (const [path, value] of Object.entries(await resolve(ops.set || {}))) {
    const text = textOf(value);
    const limit = manifest.limits[`${docId}.${path}`];
    if (limit && text.length > limit) problems.push(`${docId}.${path}: ${text.length} chars, limit ${limit}`);
    for (const [ch, name] of HARD) if (text.includes(ch)) problems.push(`${docId}.${path}: contains a ${name}`);
    for (const [ch, name] of SOFT) if (text.includes(ch)) warnings.push(`${docId}.${path}: contains a ${name}`);
    console.log(`  ${text.length} chars: ${text}`);
  }
}

// 2. Target documents exist, and every field being unset is actually present.
async function fetchDocs() {
  const q = `*[_id in ${JSON.stringify(Object.keys(manifest.docs))}]`;
  const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(q)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`query failed: ${res.status} ${await res.text()}`);
  return new Map((await res.json()).result.map((d) => [d._id, d]));
}

function truncate(s, n = 220) {
  const t = String(s ?? '').replace(/\s+/g, ' ');
  return t.length > n ? `${t.slice(0, n)}...` : t;
}

const docs = await fetchDocs();
const mutations = [];

for (const [docId, ops] of Object.entries(manifest.docs)) {
  const doc = docs.get(docId);
  if (!doc) {
    problems.push(`${docId}: document not found in ${dataset}`);
    continue;
  }
  const set = await resolve(ops.set || {});
  for (const [path, value] of Object.entries(set)) {
    const current = doc[path];
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
  for (const path of ops.unset || []) {
    if (doc[path] === undefined) {
      warnings.push(`${docId}.${path} is already absent`);
      continue;
    }
    console.log(`- ${docId}.${path}: ${truncate(JSON.stringify(doc[path]))}`);
  }
  const patch = { id: docId, set };
  if (ops.unset && ops.unset.length) patch.unset = ops.unset;
  mutations.push({ patch });
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
  console.error('\nSANITY_API_TOKEN is not set. Run --check to validate offline.');
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
  console.log('Next: wait a few minutes, check /about and /, then trigger one build if the CDN is stale.');
}
