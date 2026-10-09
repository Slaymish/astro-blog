/**
 * Dataset migration for the October 2026 copy move.
 *
 *   pnpm exec tsx --env-file=.env scripts/migrate-2026-10.ts --dry-run
 *   SANITY_WRITE_ACK=1 pnpm exec tsx --env-file=.env scripts/migrate-2026-10.ts
 *
 * The header, footer, work story, post, report and PDF viewer labels moved out
 * of the templates into Site Settings; the home page gained an intro line and
 * lost its "more work" heading; work story links gained a kind, so the work
 * card finds the source code link without matching on its label. Every value
 * set here is what the templates rendered before the move, apart from the new
 * home page intro.
 *
 * Idempotent: every set is absolute and the one unset tolerates an absent
 * field. It overwrites the stale header and footer objects an older version of
 * the site left in Site Settings. Run it before deploying the code that reads
 * these fields; the build fails on an empty Site Settings label.
 */

import { createClient } from '@sanity/client';

const dryRun = process.argv.includes('--dry-run');

const projectId = process.env.SANITY_PROJECT_ID;
const token = process.env.SANITY_API_TOKEN;
if (!projectId) throw new Error('SANITY_PROJECT_ID is not set');
if (!token) throw new Error('SANITY_API_TOKEN is not set');

const client = createClient({
  projectId,
  dataset: process.env.SANITY_DATASET ?? 'production',
  apiVersion: process.env.SANITY_API_VERSION ?? '2024-01-01',
  useCdn: false,
  token,
});

const siteSettings = {
  header: {
    readingLabel: 'Reading',
    aboutLabel: 'About',
    contactLabel: 'Contact',
    navigationLabel: 'Primary navigation',
    homeLinkLabel: 'Hamish Burke, home',
    menuLabel: 'Open navigation menu',
    themeToLightLabel: 'Switch to light theme',
    themeToDarkLabel: 'Switch to dark theme',
  },
  footer: {
    tagline: 'Hamish Burke · Wellington, New Zealand',
    navigationLabel: 'Footer',
    emailLabel: 'Email',
    githubLabel: 'GitHub',
    linkedinLabel: 'LinkedIn',
    cvLabel: 'CV',
    rssLabel: 'RSS',
    privacyLabel: 'Privacy',
    termsLabel: 'Terms',
  },
  newTabNote: 'Opens in a new tab',
  entryLabels: {
    allWorkLabel: 'All work',
    allWritingLabel: 'All writing',
    outcomeHeading: 'Outcome',
    artifactsHeading: 'From this project',
    sourceCodeLabel: 'Source code',
    relatedHeading: 'Related',
    articleLabel: 'Article',
    reportLabel: 'Report',
    readingTimeSuffix: 'min read',
    pdfSizeSuffix: 'MB PDF',
    openPdfLabel: 'Open PDF',
  },
  pdfViewer: {
    previousPage: 'Previous page',
    nextPage: 'Next page',
    zoomOut: 'Zoom out',
    zoomIn: 'Zoom in',
    resetZoom: 'Reset zoom',
    fullscreen: 'Fullscreen',
    loading: 'Loading the PDF.',
    error: 'The PDF did not load in the browser.',
    openDirectly: 'Open it directly',
  },
};

const HOME_INTRO = 'Web developer at Alphero, in Wellington. Most of what’s here I built on my own time, to see how something worked.';

/** The label the work card used to match on before links had a kind. */
const SOURCE_LABEL = 'Source code';

interface StoryLinks {
  _id: string;
  slug: string;
  links: Array<{ _key: string; label: string; kind?: string }> | null;
}

const stories = await client.fetch<StoryLinks[]>(
  `*[_type == "workStory" && !(_id in path("drafts.**"))]{ _id, "slug": slug.current, links[]{ _key, label, kind } }`,
);

const transaction = client.transaction();

transaction.patch('siteSettings', (patch) => patch.set(siteSettings));
console.log('siteSettings: set header, footer, newTabNote, entryLabels, pdfViewer');

transaction.patch('homePage', (patch) => patch.set({ intro: HOME_INTRO }).unset(['moreWorkHeading']));
console.log(`homePage: set intro, unset moreWorkHeading`);

for (const story of stories) {
  const kinds = Object.fromEntries(
    (story.links ?? []).map((link) => [
      `links[_key=="${link._key}"].kind`,
      link.label === SOURCE_LABEL ? 'source' : 'other',
    ]),
  );
  if (Object.keys(kinds).length === 0) continue;
  transaction.patch(story._id, (patch) => patch.set(kinds));
  console.log(`${story.slug}: ${Object.entries(kinds).map(([path, kind]) => `${path}=${kind}`).join(', ')}`);
}

if (dryRun) {
  console.log('\n--dry-run: nothing written.');
} else {
  const result = await transaction.commit();
  console.log(`\nCommitted transaction ${result.transactionId}.`);
}
