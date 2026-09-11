/**
 * Writes a markdown twin beside every built HTML page, so the content
 * negotiation in netlify/edge-functions/markdown.ts has something to serve.
 * Runs after `astro build`; without it the edge function finds no twin and
 * every request falls back to HTML.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { htmlToMarkdown } from '../src/content/htmlToMarkdown';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

/** The static 410 body has no layout, so no <main> to convert. */
const SKIPPED = new Set(['410.html']);

function htmlFiles(dir: string, found: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) htmlFiles(path, found);
    else if (name.endsWith('.html') && !SKIPPED.has(name)) found.push(path);
  }
  return found;
}

const files = htmlFiles(dist);
for (const file of files) {
  writeFileSync(file.replace(/\.html$/, '.md'), htmlToMarkdown(readFileSync(file, 'utf8')), 'utf8');
}

console.log(`Wrote ${files.length} markdown twins.`);
