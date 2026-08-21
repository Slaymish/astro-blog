/**
 * Third copy pass. The first two passes (copy-humanise.ts, copy-humanise-posts.ts)
 * fixed vocabulary and sentence-level tells. They left a structural one behind:
 * the site asserts the same thing about Hamish in eight places, in slightly
 * different words. "The write-ups say what didn't work", "what I can talk about
 * honestly", "what I would do differently", "things I have worked out, and things
 * I have not". That formula is now the standard AI-written developer bio, so
 * repeating it reads as generated even though every individual sentence is clean.
 *
 * The rule applied below: cut the claim about the writing, keep or add the thing
 * itself. A page that lists a home lab and a double-entry ledger does not need a
 * sentence promising honesty.
 *
 *   pnpm exec tsx --env-file=.env scripts/copy-depersona.ts            # dry run
 *   pnpm exec tsx --env-file=.env scripts/copy-depersona.ts --apply    # write
 *
 * Requires SANITY_API_TOKEN with write access. Keep scripts/seed-page-copy.ts in
 * step with every edit here, or the next `pnpm run seed:copy` reverts the lot.
 */

import { createClient } from '@sanity/client';

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET || 'production';
const apiVersion = process.env.SANITY_API_VERSION || '2024-01-01';
const token = process.env.SANITY_API_TOKEN;

if (!projectId) {
  console.error('Missing SANITY_PROJECT_ID. Add it to .env.');
  process.exit(1);
}
if (!token) {
  console.error('Missing SANITY_API_TOKEN (Editor scope). Add it to .env. Do not commit it.');
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false });
const apply = process.argv.includes('--apply');

/**
 * `before` is the full live value as captured during the audit. The script
 * re-reads it and refuses to write if it has moved, so a Studio edit made since
 * the audit is never silently overwritten.
 */
type Edit = {
  id: string;
  path: string;
  before: string;
  after: string;
  why: string;
};

const edits: Edit[] = [
  // -------------------------------------------------------------------------
  // siteSettings: the line that prompted this pass. It appears on every page.
  // -------------------------------------------------------------------------
  {
    id: 'siteSettings',
    path: 'footer.tagline',
    before: 'Building things and writing about them, from Wellington, NZ.',
    after: 'Software developer, Wellington, New Zealand.',
    why: 'This is the exact LinkedIn-bio formula ("I build stuff, then write about it"). It sits in the footer of every page, directly under the logo, where a plain factual line does the same job without claiming a personality.'
  },

  // -------------------------------------------------------------------------
  // homePage
  // -------------------------------------------------------------------------
  {
    id: 'homePage',
    path: 'hero.lede',
    before:
      'I build things I want to exist, and I publish them. The code is public and the write-ups say what didn’t work.',
    after: 'I build things I want to exist. Most of the source is on GitHub.',
    why: 'Kept the first clause, which is a claim about what he does, and cut the second, which is a claim about how candid he is. "The source is on GitHub" is checkable; "the write-ups say what didn\'t work" is the thing every generated bio says.'
  },
  {
    id: 'homePage',
    path: 'seo.description',
    before:
      'Software developer in Wellington, New Zealand. I build things in the open and write up what happened, including what did not work.',
    after:
      'Software developer in Wellington, New Zealand. Independent projects, client work, and notes on AI and software systems.',
    why: 'Same formula a third time, and this is the string AI search engines quote back. Replaced the self-characterisation with what the site actually contains.'
  },

  // -------------------------------------------------------------------------
  // aboutPage
  // -------------------------------------------------------------------------
  {
    id: 'aboutPage',
    path: 'seo.description',
    before:
      'Hamish Burke is a web developer at Alphero in Wellington, New Zealand, who builds and writes up independent projects.',
    after:
      'Hamish Burke is a web developer at Alphero in Wellington, New Zealand, with a master’s in computer science from Victoria University of Wellington.',
    why: 'Traded the "builds and writes up" formula for a fact already stated further down the same page.'
  },
  {
    id: 'aboutPage',
    path: 'portrait.body',
    before:
      'There’s no NDA-covered client work on this site. What’s here is what I can talk about honestly: things I built myself, finished freelance work, and technical studies where the limitations are written down alongside the results.',
    after:
      'There’s no NDA-covered client work on this site. What’s here is what I’m free to publish: things I built myself, finished freelance work, and a few technical studies.',
    why: '"what I can talk about honestly" announces the honesty instead of demonstrating it, and the trailing clause about limitations restated the same promise a second time in one sentence.'
  },
  {
    id: 'aboutPage',
    path: 'capabilities.items[2].title',
    before: 'Saying what actually happened',
    after: 'Writing it down',
    why: 'The purest version of the formula, presented as a skill. The section is headed "What I\'m working on getting good at", so a real practice belongs here rather than a virtue.'
  },
  {
    id: 'aboutPage',
    path: 'capabilities.items[2].body',
    before: 'Reporting results as they came out rather than as I would have liked them to.',
    after: 'Keeping design notes and known limits current, while I still remember why I picked one option over another.',
    why: 'Describes an actual habit instead of asserting integrity.'
  },

  // -------------------------------------------------------------------------
  // Index pages: each one ended with a sentence promising the same thing.
  // -------------------------------------------------------------------------
  {
    id: 'projectsIndexPage',
    path: 'hero.intro',
    before:
      'Projects I started myself, usually to find out whether something was possible. Each one says what the question was, what I built, and what I would do differently.',
    after:
      'Projects I started myself, usually to find out whether something was possible. A home lab, a self-hosted finance ledger, a GPU sharing platform.',
    why: 'Dropped the three-part promise and named three of the projects actually listed below it. Concrete nouns do the work the promise was doing.'
  },
  {
    id: 'projectsIndexPage',
    path: 'seo.description',
    before:
      'Independent projects built by Hamish Burke, each written up around the question that started it.',
    after:
      'Independent projects by Hamish Burke, including a home lab, a self-hosted finance ledger, and a GPU sharing platform.',
    why: 'Same reasoning as the intro, and this is the string that gets quoted in search results.'
  },
  {
    id: 'workIndexPage',
    path: 'hero.intro',
    before:
      'Client websites, products I built for myself, and a few technical studies. Each one says what the problem was and what happened.',
    after: 'Client websites, products I built for myself, and a few technical studies.',
    why: 'The first sentence already says what the page is. The second was the formula again.'
  },
  {
    id: 'writingIndexPage',
    path: 'hero.intro',
    before: 'Things I have worked out, and things I have not. Mostly AI and software systems.',
    after: 'Mostly AI and software systems, written while I’m still working them out.',
    why: 'Kept the idea once, on the page where it describes the posts rather than the author, but without the "X, and not X" parallelism.'
  },
  {
    id: 'writingIndexPage',
    path: 'seo.description',
    before:
      'Notes on AI and software systems by Hamish Burke, including the things he has not figured out yet.',
    after: 'Notes on AI and software systems by Hamish Burke.',
    why: 'The trailing clause was the eighth instance of the formula.'
  },

  // -------------------------------------------------------------------------
  // contactPage
  // -------------------------------------------------------------------------
  {
    id: 'contactPage',
    path: 'availabilityNote',
    before:
      'I work full time at Alphero and take on a small number of independent projects alongside it. If you have something that fits, say what the problem is and I will tell you honestly whether I am the right person for it.',
    after:
      'I work full time at Alphero and take on a small number of independent projects alongside it. If you have something that fits, say what the problem is and I’ll tell you whether I’m the right person for it.',
    why: 'Cut "honestly", which was doing nothing the sentence did not already do, and used contractions to match the rest of the site.'
  },

  // -------------------------------------------------------------------------
  // homePage "Currently": the heading and the body directly beneath it were the
  // same sentence twice, both leaning on "actually". The previous pass swapped
  // flowery copy for a plain-spoken register and then repeated its own tics.
  // -------------------------------------------------------------------------
  {
    id: 'homePage',
    path: 'currently.heading',
    before: 'Learning how software actually gets made.',
    after: 'Learning how software gets made.',
    why: 'The heading and the body under it both said "learning how software actually gets built". Dropped the intensifier here and the duplicate clause in the body.'
  },
  {
    id: 'homePage',
    path: 'currently.body',
    before:
      'I\u2019m a junior developer at Alphero, learning how software actually gets built for real organisations. That\u2019s the part side projects don\u2019t teach you, and it\u2019s most of what I\u2019m doing right now.',
    after:
      'I\u2019m a junior developer at Alphero. That\u2019s where I\u2019m learning the parts side projects don\u2019t teach you, and it\u2019s most of what I\u2019m doing right now.',
    why: 'Removed the clause the heading already carries, so the section says one thing once.'
  }
];

function readPath(doc: unknown, path: string): unknown {
  return path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .reduce<unknown>((node, key) => (node == null ? undefined : (node as Record<string, unknown>)[key]), doc);
}

const ids = [...new Set(edits.map((e) => e.id))];
const docs: Record<string, any> = Object.fromEntries(
  (await client.fetch<any[]>('*[_id in $ids]', { ids })).map((d) => [d._id, d])
);

let drift = 0;
let planned = 0;
let satisfied = 0;
const patches: { id: string; set: Record<string, unknown> }[] = [];

for (const id of ids) {
  const doc = docs[id];
  if (!doc) {
    console.error(`MISSING DOCUMENT: ${id}`);
    drift++;
    continue;
  }

  const set: Record<string, unknown> = {};
  for (const edit of edits.filter((e) => e.id === id)) {
    const live = readPath(doc, edit.path);
    if (live === edit.after) {
      console.log(`already applied  ${id} :: ${edit.path}\n`);
      satisfied++;
      continue;
    }
    if (live !== edit.before) {
      console.error(`DRIFT  ${id} :: ${edit.path}\n  audit: ${edit.before}\n  live : ${live}\n`);
      drift++;
      continue;
    }
    console.log(`${id} :: ${edit.path}`);
    console.log(`  -  ${edit.before}`);
    console.log(`  +  ${edit.after}`);
    console.log(`  why: ${edit.why}\n`);
    set[edit.path] = edit.after;
    planned++;
  }

  if (Object.keys(set).length) patches.push({ id, set });
}

console.log(
  `${planned} edits planned across ${ids.length} documents. ${satisfied} already applied. ${drift} drifted.`
);

if (drift) {
  console.error('\nRefusing to write: live copy has changed since the audit. Re-run the audit first.');
  process.exit(1);
}

if (!planned) {
  console.log('Nothing to do: every edit is already applied.');
  process.exit(0);
}

if (!apply) {
  console.log('Dry run. Re-run with --apply to write.');
  process.exit(0);
}

const tx = client.transaction();
for (const patch of patches) tx.patch(patch.id, (p) => p.set(patch.set));
await tx.commit();

// Array-index patch paths can no-op rather than throw, so read everything back
// and assert each edit actually landed.
const after: Record<string, any> = Object.fromEntries(
  (await client.fetch<any[]>('*[_id in $ids]', { ids })).map((d) => [d._id, d])
);

let confirmed = 0;
let failed = 0;
for (const edit of edits) {
  if (readPath(after[edit.id], edit.path) === edit.after) confirmed++;
  else {
    console.error(`NOT WRITTEN  ${edit.id} :: ${edit.path}`);
    failed++;
  }
}

console.log(`\nVerified ${confirmed}/${confirmed + failed} edits against the live documents.`);
if (failed) {
  console.error('Some edits did not land. Re-run the dry run to see the current state.');
  process.exit(1);
}
console.log('Trigger a Netlify build to publish.');
