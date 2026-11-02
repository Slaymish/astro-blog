#!/usr/bin/env node
// Publish the Grid Diffusion AD paper as a Report, and link it from the work story.
//
//   node publish-paper.mjs --check                     validate, no token needed
//   SANITY_WRITE_ACK=1 node publish-paper.mjs --write   upload the PDF and create the Report
//
// The work story patch lives in docs/positioning-2026-11-02/manifest.json, which
// references report-grid-diffusion-anomaly-detection by id. Run that one after this.

import { readFileSync, existsSync, statSync, createReadStream } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

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

const report = JSON.parse(readFileSync(join(here, 'report.json'), 'utf8'));
const problems = [];

const HARD = [['\u2014', 'em dash'], ['\u2013', 'en dash'], [';', 'semicolon'], ['"', 'straight double quote'], ['\u201C', 'curly quote'], ['\u201D', 'curly quote'], ['!', 'exclamation']];

function stringsIn(value, path = '', out = []) {
  if (typeof value === 'string') out.push([path, value]);
  else if (Array.isArray(value)) value.forEach((v, i) => stringsIn(v, `${path}[${i}]`, out));
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) stringsIn(v, path ? `${path}.${k}` : k, out);
  return out;
}

for (const [path, text] of stringsIn(report)) {
  if (path === 'pdfNote' || path.endsWith('.current') || path === '_id' || path === '_type') continue;
  for (const [ch, name] of HARD) if (text.includes(ch)) problems.push(`${path}: contains a ${name}`);
}

if ((report.description ?? '').length > 300) problems.push(`description: ${report.description.length} chars, limit 300`);

const pdf = join(here, report.pdfFile);
if (!existsSync(pdf)) problems.push(`missing PDF: ${report.pdfFile}`);
else {
  const head = readFileSync(pdf).subarray(0, 5).toString('latin1');
  if (head !== '%PDF-') problems.push(`${report.pdfFile} does not start with %PDF-`);
  console.log(`PDF: ${report.pdfFile} (${Math.round(statSync(pdf).size / 1024)}KB)`);
}

const client = createClient({ projectId, dataset, apiVersion, token: process.env.SANITY_API_TOKEN, useCdn: false });

if (await client.fetch('*[_id == $id][0]._id', { id: report._id })) {
  problems.push(`${report._id} already exists. Edit it in Studio rather than replacing the PDF under it.`);
}

const story = await client.fetch('*[_id == "catalogue-backfill-grid-diffusion-ad"][0]{"slug": slug.current, "artifacts": coalesce(count(artifacts), 0)}');
if (!story) problems.push('work story catalogue-backfill-grid-diffusion-ad not found, so the story cannot link the paper');
else if (story.artifacts > 0) console.log(`note: the story already has ${story.artifacts} artifact(s); the manifest sets the list, so check it.`);

for (const p of problems) console.error(`problem: ${p}`);
if (problems.length) process.exit(1);

const words = report.body.flatMap((b) => b.children ?? []).reduce((n, c) => n + (c.text ?? '').split(/\s+/).length, 0);
console.log(`\n${report.title}`);
console.log(`${report.body.length} paragraphs, ${words} words, ${report.description.length} char description.`);
console.log(`Target: ${report._id}, slug /reports/${report.slug.current}`);

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

const asset = await client.assets.upload('file', createReadStream(pdf), { filename: 'grid-diffusion-anomaly-detection.pdf', contentType: 'application/pdf' });
const doc = { ...report, pdfFile: { _type: 'file', asset: { _type: 'reference', _ref: asset._id } } };
delete doc.pdfNote;
const created = await client.create(doc);
console.log(`Created ${created._id}. Now run the copy manifest, which links it from the story.`);
