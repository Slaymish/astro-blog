/**
 * One-shot migration for the landing redesign (docs/design/specs/design-landing-datasheet-index.md).
 *
 * Patches rather than replaces: `pnpm run seed:copy` uses createOrReplace across every
 * singleton, so running it here would revert unrelated hand edits on other pages.
 *
 * Pass --apply to write. Without it the script prints what it would do and exits.
 */
import { createClient } from '@sanity/client';

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET ?? 'production';
const token = process.env.SANITY_API_TOKEN;
const apply = process.argv.includes('--apply');

if (!projectId) throw new Error('SANITY_PROJECT_ID is required.');
if (!token) throw new Error('SANITY_API_TOKEN is required. Add it to .env. Do not commit it.');

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: process.env.SANITY_API_VERSION ?? '2024-01-01',
  useCdn: false
});

const HOME_SET = {
  fold: {
    name: 'Hamish Burke',
    position: 'Alphero, Wellington · since 2026',
    sourceLink: {
      _type: 'ctaLink',
      label: 'github.com/Slaymish',
      href: 'https://github.com/Slaymish',
      external: true,
      ariaLabel: 'Hamish Burke on GitHub'
    }
  },
  indexSection: {
    projectsLink: { _type: 'ctaLink', label: 'All projects', href: '/projects' },
    writingLink: { _type: 'ctaLink', label: 'All writing', href: '/writing' }
  }
};

/** Fields the redesign deletes. Unset so Studio does not show orphaned data. */
const HOME_UNSET = ['hero', 'interests', 'currently', 'projectsSection', 'workSection', 'writingSection'];

/**
 * The index metric for each story, taken from the measurement already in its own
 * `result` prose. Numbers that flatter and numbers that do not are treated the same.
 */
const METRICS: Record<string, string> = {
  'sprint-coach': 'Live at sprintcoach.co.nz · enquiry form, local SEO, launch checklist',
  brontehf: 'Live portfolio · publishing workflow the client runs without me',
  'gpu-share': 'Auth, MCP routing, queued rendering · no adoption claim',
  'you-inc': 'MIT and self-hosted · Akahu sync into a balanced double-entry ledger',
  'health-agent': 'Daily Apple Health exports into Postgres · insight backends optional',
  'home-lab': 'Full restore in 1h45 · 96GB offsite at $2.82/month',
  'wildfire-pyspark': 'Recall 0 → 0.7518 · accuracy fell to 32%, precision 0.0099'
};

async function migrate() {
  const stories = await client.fetch<{ _id: string; slug: string; title: string }[]>(
    '*[_type == "workStory"]{_id, "slug": slug.current, title}'
  );

  const missing = stories.filter((story) => !METRICS[story.slug]);
  if (missing.length > 0) {
    throw new Error(`No metric written for: ${missing.map((s) => s.slug).join(', ')}`);
  }

  console.log(`${apply ? 'Applying' : 'Dry run'} against ${projectId}/${dataset}\n`);
  console.log('homePage');
  console.log(`  set    fold, indexSection`);
  console.log(`  unset  ${HOME_UNSET.join(', ')}\n`);
  for (const story of stories) {
    console.log(`${story.title}\n  metric  ${METRICS[story.slug]}`);
  }

  if (!apply) {
    console.log('\nNothing written. Re-run with --apply.');
    return;
  }

  const transaction = client.transaction();
  transaction.patch('homePage', (patch) => patch.set(HOME_SET).unset(HOME_UNSET));
  for (const story of stories) {
    transaction.patch(story._id, (patch) => patch.set({ metric: METRICS[story.slug] }));
  }
  await transaction.commit();
  console.log(`\nPatched homePage and ${stories.length} work stories.`);
}

migrate().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});
