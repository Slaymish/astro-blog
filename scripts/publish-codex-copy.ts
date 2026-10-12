import { readFile } from 'node:fs/promises';
import { createClient } from '@sanity/client';
import { validateCodexCopy } from '../src/content/codexUsage';
const document = JSON.parse(await readFile(new URL('../docs/codex-usage-page.seed.json', import.meta.url), 'utf8'));
if (!validateCodexCopy(document)) throw new Error('Incomplete seed copy');
if (!process.argv.includes('--publish')) {
  console.log(JSON.stringify(document, null, 2));
} else {
  if (process.env.SANITY_WRITE_ACK !== '1' || !process.env.SANITY_API_TOKEN) throw new Error('Publishing approved copy requires SANITY_WRITE_ACK=1 and SANITY_API_TOKEN');
  const client = createClient({ projectId: process.env.SANITY_PROJECT_ID || 'qnuj1c4o', dataset: process.env.SANITY_DATASET || 'production', apiVersion: '2024-01-01', token: process.env.SANITY_API_TOKEN, useCdn: false });
  // Additive, never overwrite existing editorial work. Edit an existing singleton through Studio.
  await client.createIfNotExists({ ...document, _id: 'codexUsagePage', _type: 'codexUsagePage' });
  console.log('Copy document created if absent. Wait several minutes before a fresh build to allow CDN queries to purge.');
}
