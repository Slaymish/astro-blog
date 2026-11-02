#!/usr/bin/env node
/**
 * Update the AndoSim work story: copy, plus a real render as its cover.
 *
 * Modes:
 *   node publish.mjs --check          public read, no token, prints before/after
 *   node publish.mjs                  authenticated dry run (?dryRun=true)
 *   SANITY_WRITE_ACK=1 node publish.mjs --write
 *
 * Cover source: docs/example_images/cover-ando-sim.png, rendered from
 * AndoSim's own bake (docs/example_images/render_demo.py, --scene drape).
 */
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../..');
const require = createRequire(join(repo, 'package.json'));

const env = {};
for (const line of readFileSync(join(repo, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const project = env.SANITY_PROJECT_ID;
const dataset = env.SANITY_DATASET || 'production';
const api = `https://${project}.api.sanity.io/v2024-01-01`;
const tokenFrom = (path) => {
  try {
    const m = readFileSync(path, 'utf8').match(/^SANITY_API_TOKEN=(.*)$/m);
    return m ? m[1].trim().replace(/^["']|["']$/g, '') : null;
  } catch {
    return null;
  }
};
const token = env.SANITY_API_TOKEN || tokenFrom(join(homedir(), '.hermes/.env'));

const manifest = JSON.parse(readFileSync(join(here, 'manifest.json'), 'utf8'));
const [docId, ops] = Object.entries(manifest.docs)[0];
const mode = process.argv.includes('--write') ? 'write' : process.argv.includes('--check') ? 'check' : 'dry';

const FIELDS = ['summary', 'introduction', 'result', 'role', 'descriptor'];

const fetchDoc = async () => {
  const q = encodeURIComponent(`*[_id == $id][0]`);
  const url = `${api}/data/query/${dataset}?query=${q}&$id=${encodeURIComponent(JSON.stringify(docId))}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`read failed: ${res.status} ${await res.text()}`);
  return (await res.json()).result;
};

const blockText = (text) => [
  {
    _type: 'block',
    _key: Math.random().toString(16).slice(2, 14),
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: Math.random().toString(16).slice(2, 14),
        marks: [],
        text,
      },
    ],
  },
];

const checkText = (field, value, limit) => {
  const problems = [];
  if (limit && value.length > limit) problems.push(`${value.length}/${limit} characters`);
  for (const [name, re] of [
    ['em dash', /[–—]/],
    ['semicolon', /;/],
    ['straight double quote', /"/],
    ['exclamation mark', /!/],
  ]) {
    if (re.test(value)) problems.push(`contains ${name}`);
  }
  if (problems.length) console.log(`  ! ${field}: ${problems.join(', ')}`);
  return problems.length === 0;
};

const run = async () => {
  const current = await fetchDoc();
  if (!current) throw new Error(`document ${docId} not found`);

  console.log(`mode: ${mode}  doc: ${docId}  slug: ${manifest.slug}`);
  let ok = true;

  for (const field of FIELDS) {
    if (!(field in ops.set)) continue;
    const next = ops.set[field];
    console.log(`\n[${field}] ${next.length}/${manifest.limits[field] ?? '-'}`);
    console.log(`  was: ${current[field] ?? '(unset)'}`);
    console.log(`  now: ${next}`);
    ok = checkText(field, next, manifest.limits[field]) && ok;
  }

  if (Array.isArray(ops.set.body)) {
    console.log(`\n[body] ${ops.set.body.length} paragraphs`);
    ops.set.body.forEach((block, i) => {
      const text = block.__blockText ?? '(malformed block)';
      console.log(`  ${i + 1}. ${text}`);
      ok = checkText(`body[${i}]`, text, null) && ok;
    });
  }

  const cover = ops.set.cover;
  if (cover) {
    const file = resolve(repo, cover.image);
    console.log(`\n[cover] ${cover.image}`);
    if (!existsSync(file)) {
      console.log('  ! file missing');
      ok = false;
    } else {
      const size = readFileSync(file).length;
      console.log(`  ${size} bytes, alt ${cover.alt.length}/240`);
      if (cover.alt.length > 240) ok = false;
      console.log(`  was: ${current.cover?.alt ?? '(none)'}`);
    }
  }

  if (!ok) {
    console.log('\nFAILED: fix the problems above before writing.');
    process.exit(1);
  }
  if (mode === 'check') {
    console.log('\ncheck passed, nothing written');
    return;
  }

  const mutations = [];
  if (cover && mode === 'write') {
    const { createClient } = require('@sanity/client');
    const client = createClient({ projectId: project, dataset, token, apiVersion: '2024-01-01' });
    const asset = await client.assets.upload('image', createReadStream(join(here, cover.image)), {
      filename: 'cover-ando-sim.png',
    });
    console.log(`\nuploaded ${asset._id}`);
    mutations.push({
      patch: {
        id: docId,
        set: {
          'cover.kind': 'image',
          'cover.alt': cover.alt,
          'cover.image': { _type: 'image', asset: { _type: 'reference', _ref: asset._id } },
        },
        unset: ['cover.figure'],
      },
    });
  }

  const set = {};
  for (const [key, value] of Object.entries(ops.set)) {
    if (key === 'cover') continue;
    set[key] = Array.isArray(value) && value[0]?.__blockText
      ? value.map((b) => blockText(b.__blockText))
      : value;
  }
  mutations.push({ patch: { id: docId, set } });

  if (mode !== 'write') {
    // Dry run keeps the patch shape identical, minus the asset upload.
    mutations[mutations.length - 1].patch.set['cover.kind'] = 'image';
  }

  const dry = mode !== 'write';
  const res = await fetch(`${api}/data/mutate/${dataset}${dry ? '?dryRun=true' : ''}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ mutations }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`mutate failed: ${res.status} ${body}`);
  console.log(`\n${dry ? 'dry run ok' : 'written'}: ${body.slice(0, 400)}`);
};

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
