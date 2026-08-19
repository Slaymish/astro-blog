/**
 * Second copy pass, covering the three published blog posts. Kept separate from
 * copy-humanise.ts because these have live permalinks and an RSS feed, so they
 * were held back for a separate decision.
 *
 *   pnpm exec tsx scripts/copy-humanise-posts.ts            # dry run
 *   pnpm exec tsx scripts/copy-humanise-posts.ts --apply    # write
 *
 * Body edits are substring replacements rather than whole-field rewrites, and
 * each `find` must match exactly once or the script refuses to run.
 */

import { createClient } from '@sanity/client';

/** A whole-field replacement (title, excerpt). */
type FieldEdit = { id: string; path: 'excerpt' | 'title'; before: string; after: string; why: string };

/** A substring replacement inside `markdownBody`. Must match exactly once. */
type Snippet = { id: string; find: string; replace: string; why: string };

const HEALTH = '08be16cc-8610-4145-96dc-88582ac28de0';
const GPU = '516f451a-82b7-4879-b32a-a9ed7eba4941';
const SPLIT = '913864e1-beae-4536-8f6c-a100adb70030';

const fieldEdits: FieldEdit[] = [
  {
    id: HEALTH,
    path: 'excerpt',
    before:
      'A Next.js app that ingests Apple Health exports, normalises them to Postgres, and produces daily/weekly insights with a lightweight GCP pipeline.',
    after:
      'Ingests Apple Health exports, normalises them into Postgres, and turns them into daily and weekly trends on a small GCP pipeline.',
    why: '"lightweight" is a filler adjective, and the app is only partly Next.js: the API is Fastify.'
  },
  {
    id: GPU,
    path: 'excerpt',
    before:
      'An accurate look at GPUShare’s public/private architecture, local and optional cloud inference, estimated usage costs, rendering trust model, and host-dependent limits.',
    after:
      'How GPUShare splits public from private, where the inference actually runs, and what the cost figures do and do not measure.',
    why: 'Five-item laundry list, and "An accurate look at" is a defensive way to open your own post.'
  },
  {
    id: SPLIT,
    path: 'excerpt',
    before:
      'The current GPUShare architecture separates public account middleware from shared-secret hardware services—and makes its routing, cost, rendering, and installer limits explicit.',
    after:
      'GPUShare now separates public account middleware from the shared-secret hardware services, and I have written down where the routing, cost and installer claims break down.',
    why: 'Em dash plus a four-item list. Also puts the author back in his own summary.'
  }
];

const snippets: Snippet[] = [
  {
    id: HEALTH,
    find: 'The code is on [GitHub](https://github.com/Slaymish/HealthAgent) too — if you find any bugs, open an issue.',
    replace: 'The code is on [GitHub](https://github.com/Slaymish/HealthAgent) too. If you find any bugs, open an issue.',
    why: 'Em dash, against the rule in CLAUDE.md.'
  },
  {
    id: GPU,
    find:
      'The current project is an open-source, self-hosted application for local AI inference and queued Blender rendering. It includes password and invite-based accounts, API keys, account and admin views, an OpenAI-compatible chat API, optional cloud-model routing, MCP tool connections, usage accounting, and a public React interface.',
    replace:
      'It is an open-source, self-hosted app for local AI inference and queued Blender rendering. There are accounts and invites, API keys, an OpenAI-compatible chat API, optional cloud routing, MCP tool connections and usage accounting, all behind a React interface.',
    why: 'Nine items in one sentence. "The current project is" is throat-clearing on the second line of the post.'
  },
  {
    id: GPU,
    find:
      'A selected OpenRouter model—or the configured `auto` model when its selection rules choose cloud—sends the request to that provider.',
    replace:
      'A selected OpenRouter model sends the request to that provider, as does the configured `auto` model when its rules pick cloud.',
    why: 'Two em dashes around a parenthetical, which is the construction the rule exists to prevent.'
  },
  {
    id: GPU,
    find:
      'The value of GPUShare is the system design: a usable interface and accounting layer around hardware that remains private, finite, and intermittently available. It is intentionally a trusted-group tool rather than a hyperscale cloud competitor.',
    replace:
      'What I was actually building is the layer around the hardware: an interface and an accounting system for a machine that is private, finite and often switched off. It is a tool for a handful of people I know, and that is the whole scope.',
    why: 'Closing on "The value of X is" is the same self-assessment pattern the work stories had, and "hyperscale cloud competitor" is a straw man nobody suggested.'
  },
  {
    id: SPLIT,
    find: '## Setup automation—and the current regression',
    replace: '## Setup automation, and what I broke',
    why: 'Em dash in a heading, and the plain admission is better than the clinical noun "regression".'
  },
  {
    id: SPLIT,
    find:
      'It is still host-dependent software for a trusted group—not a managed, high-availability, sandboxed, or production-hardened cloud service. No adoption claim is implied.',
    replace:
      'It is still host-dependent software for a trusted group, not a managed or production-hardened service, and I am not claiming anyone else runs it.',
    why: 'Em dash, a four-item negated list, and "No adoption claim is implied" reads like a compliance footer rather than something a person writes on their own blog.'
  }
];

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

const projectId = process.env.SANITY_PROJECT_ID;
const token = process.env.SANITY_API_TOKEN;
const apply = process.argv.includes('--apply');

if (!projectId) {
  console.error('Missing SANITY_PROJECT_ID. Add it to .env.');
  process.exit(1);
}
if (apply && !token) {
  console.error('Missing SANITY_API_TOKEN. A write token is required for --apply.');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: process.env.SANITY_API_VERSION || '2024-01-01',
  token,
  useCdn: false
});

const ids = [HEALTH, GPU, SPLIT];
const docs: Record<string, any> = Object.fromEntries(
  (await client.fetch<any[]>('*[_id in $ids]', { ids })).map((d) => [d._id, d])
);

let drift = 0;
let planned = 0;
const bodies: Record<string, string> = {};
const sets: Record<string, Record<string, string>> = {};

for (const edit of fieldEdits) {
  if (docs[edit.id]?.[edit.path] !== edit.before) {
    console.error(`DRIFT  ${edit.id} :: ${edit.path}\n  audit: ${edit.before}\n  live : ${docs[edit.id]?.[edit.path]}\n`);
    drift++;
    continue;
  }
  (sets[edit.id] ??= {})[edit.path] = edit.after;
  planned++;
}

for (const snippet of snippets) {
  const body = bodies[snippet.id] ?? docs[snippet.id]?.markdownBody ?? '';
  const hits = body.split(snippet.find).length - 1;
  if (hits !== 1) {
    console.error(`DRIFT  ${snippet.id} :: markdownBody matched ${hits} times, expected 1\n  find: ${snippet.find.slice(0, 90)}\n`);
    drift++;
    continue;
  }
  bodies[snippet.id] = body.replace(snippet.find, snippet.replace);
  planned++;
}

console.log(`\n${planned} edits planned across ${ids.length} posts. ${drift} drifted.`);

if (drift) {
  console.error('\nRefusing to write: live copy has changed since the audit.');
  process.exit(1);
}
if (!apply) {
  console.log('Dry run. Re-run with --apply to write.');
  process.exit(0);
}

const tx = client.transaction();
for (const id of ids) {
  const set = { ...(sets[id] ?? {}), ...(bodies[id] ? { markdownBody: bodies[id] } : {}) };
  if (Object.keys(set).length) tx.patch(id, (p) => p.set(set));
}
await tx.commit();

// Read back and confirm, rather than trusting the commit.
const after: Record<string, any> = Object.fromEntries(
  (await client.fetch<any[]>('*[_id in $ids]', { ids })).map((d) => [d._id, d])
);
let confirmed = 0;
let failed = 0;
for (const edit of fieldEdits) {
  if (after[edit.id]?.[edit.path] === edit.after) confirmed++;
  else {
    console.error(`NOT WRITTEN  ${edit.id} :: ${edit.path}`);
    failed++;
  }
}
for (const snippet of snippets) {
  const body: string = after[snippet.id]?.markdownBody ?? '';
  if (body.includes(snippet.replace) && !body.includes(snippet.find)) confirmed++;
  else {
    console.error(`NOT WRITTEN  ${snippet.id} :: ${snippet.find.slice(0, 60)}`);
    failed++;
  }
}

console.log(`\nVerified ${confirmed}/${confirmed + failed} edits against the live posts.`);
if (failed) process.exit(1);
console.log('Trigger a Netlify build to publish.');
