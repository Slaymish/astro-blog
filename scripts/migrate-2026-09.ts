/**
 * Dataset migration for the September 2026 rewrite.
 *
 *   pnpm run migrate additive --dry-run
 *   SANITY_WRITE_ACK=1 pnpm run migrate additive
 *   pnpm run migrate subtractive --dry-run
 *   SANITY_WRITE_ACK=1 pnpm run migrate subtractive
 *
 * The additive mode adds every field the new site reads and is harmless to the
 * old site. The subtractive mode removes what the old site read and is
 * irreversible; run it only once the new site is live. Both modes are
 * idempotent: every set is absolute, every unset tolerates an absent field,
 * image uploads reuse an existing asset with the same original filename, and
 * array keys are derived from position rather than minted fresh.
 */

import { createClient, type SanityClient } from '@sanity/client';
import { readFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const MODES = ['additive', 'subtractive'] as const;
type Mode = (typeof MODES)[number];

const mode = process.argv[2] as Mode;
const dryRun = process.argv.includes('--dry-run');

if (!MODES.includes(mode)) {
  console.error(`usage: migrate-2026-09.ts <${MODES.join('|')}> [--dry-run]`);
  process.exit(1);
}

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

// ---------------------------------------------------------------- primitives

type Json = Record<string, unknown>;

const block = (style: 'normal' | 'h2', text: string, index: number): Json => ({
  _type: 'block',
  _key: `b${index}`,
  style,
  markDefs: [],
  children: [{ _type: 'span', _key: `s${index}`, marks: [], text }],
});

const imageRef = (assetId: string): Json => ({
  _type: 'image',
  asset: { _type: 'reference', _ref: assetId },
});

const docRef = (id: string, index: number): Json => ({
  _type: 'reference',
  _ref: id,
  _key: `r${index}`,
});

const keyed = <T extends Json>(items: T[], prefix: string): Json[] =>
  items.map((item, index) => ({ ...item, _key: `${prefix}${index}` }));

/** Drops the decorative arrow glyphs the old templates baked into link labels. */
const stripArrow = (label: string): string => label.replace(/[\s ]*[→↗↘➜»›]+[\s ]*$/u, '').trim();

// ------------------------------------------------------------ schema limits

/** Maximum lengths the Milestone 3 schema declares, checked before committing. */
const LIMITS: Record<string, number> = {
  'seo.title': 70,
  'seo.description': 200,
  introduction: 320,
  'cover.alt': 240,
  'figure.label': 40,
  'figure.title': 60,
  'fact.label': 40,
  'fact.value': 40,
  'fact.note': 80,
  'figure.footnote': 160,
  'link.label': 30,
  'evidence.alt': 240,
  'evidence.label': 40,
  'evidence.heading': 80,
  'evidence.caption': 240,
  resultHeading: 40,
};

const violations: string[] = [];

/** Records a length violation rather than throwing, so one run reports them all. */
function check(limitKey: keyof typeof LIMITS | string, where: string, value: string | undefined): void {
  const max = LIMITS[limitKey];
  if (max === undefined || value === undefined) return;
  if ([...value].length > max) {
    violations.push(`${where}: ${limitKey} is ${[...value].length} characters, limit ${max}`);
  }
}

// ------------------------------------------------------------------ content

interface FigureFact {
  label: string;
  value: string;
  note: string;
}

interface FigureCover {
  kind: 'figure';
  alt: string;
  figure: { label: string; title: string; facts: FigureFact[]; footnote: string };
}

interface ImageCover {
  kind: 'image';
  alt?: string;
  imageFile?: string;
}

interface Link {
  label: string;
  href: string;
  external?: boolean;
}

interface EvidenceItem {
  imageFile: string;
  alt: string;
  label: string;
  heading: string;
  caption: string;
}

interface StoryPlan {
  introduction: string;
  links: Link[];
  cover: FigureCover | ImageCover;
  evidence?: EvidenceItem[];
  /** Slugs or document ids, resolved to references in order. */
  artifacts: string[];
  kind?: 'professional' | 'independent' | 'research';
  resultHeading?: string;
  body?: Array<['normal' | 'h2', string]>;
}

/**
 * Every image the additive step uploads. All six are already Sanity assets, so
 * a re-run reuses them by original filename and never reads these paths; they
 * are kept here as the record of where each asset came from. Restore them from
 * git history (`git show main:public/images/<path>`) if an upload is ever needed
 * again.
 */
const IMAGES = {
  sprintCoachHome: 'work/sprint-coach-home.webp',
  sprintCoachContact: 'work/sprint-coach-contact.webp',
  bronteProjects: 'work/bronte-projects.webp',
  bronteCms: 'work/bronte-cms.webp',
  youIncDashboard: 'work/youinc-demo-dashboard.png',
  healthAgentStatus: 'posts/status_screenshot.png',
} as const;

const POST_GPU_SHARE = '516f451a-82b7-4879-b32a-a9ed7eba4941';
const POST_SPLITTING_THE_STACK = '913864e1-beae-4536-8f6c-a100adb70030';
const POST_HEALTH_AGENT = '08be16cc-8610-4145-96dc-88582ac28de0';
const REPORT_HOME_LAB = '8b2b8d26-cbbe-462a-abb1-c5f34078f13a';
const REPORT_WILDFIRE = '64644895-0cdc-4c42-a73f-171531516fc4';

/**
 * Post cover alt text. Neither cover carried alt text, and both the new schema
 * and validatePosts require it once an image is set.
 */
const POST_COVER_ALT: Record<string, string> = {
  [POST_GPU_SHARE]:
    'A dark illustration of two wireframe globes, each with a lightning bolt at its centre, beside a panel of text lines.',
  [POST_HEALTH_AGENT]:
    'The HealthAgent status view: daily trends and projections built from Apple Health exports.',
};

const STORIES: Record<string, StoryPlan> = {
  'sprint-coach': {
    introduction:
      'Nathan’s coaching business grew by word of mouth. His first website needed to show athletes and parents who they would be training with, and make the next step easy.',
    links: [{ label: 'Visit site', href: 'https://sprintcoach.co.nz', external: true }],
    cover: { kind: 'image', imageFile: IMAGES.sprintCoachHome },
    evidence: [
      {
        imageFile: IMAGES.sprintCoachContact,
        alt: 'The Sprint Coach enquiry form, with name, email, enquiry type, and message fields beside the coach’s contact details.',
        label: 'Enquiry flow',
        heading: 'The one moving part on a static site',
        caption:
          'Every page is prerendered. The enquiry form is the only route that reaches a server, sending notification and confirmation email over authenticated SMTP.',
      },
    ],
    artifacts: [],
  },

  brontehf: {
    introduction:
      'Brontë brought the design. I built a portfolio they could keep updating themselves, with an editing workflow that preserves their visual direction.',
    links: [{ label: 'Visit site', href: 'https://brontehf.nz', external: true }],
    cover: {
      kind: 'image',
      imageFile: IMAGES.bronteProjects,
      alt: 'BrontëHF’s public projects page showing a filterable grid of portfolio work.',
    },
    evidence: [
      {
        imageFile: IMAGES.bronteCms,
        alt: 'The BrontëHF project editor beside a live preview of the Tei project page.',
        label: 'Publishing workflow',
        heading: 'Edit and preview in one place',
        caption: 'Project content can be edited while checking the published result in the same workspace.',
      },
    ],
    artifacts: [],
  },

  'gpu-share': {
    introduction:
      'My desktop GPU sits idle most of the day. I built a way for friends to share it for local AI and rendering, with the limits of a home machine visible.',
    links: [
      { label: 'Visit site', href: 'https://gpu-share.vercel.app/login', external: true },
      { label: 'Source code', href: 'https://github.com/Slaymish/GPUShare', external: true },
    ],
    cover: {
      kind: 'figure',
      alt: 'Two layers: an always-on cloud layer holding accounts, ledger and invoices, and a home GPU host running Ollama and Blender that connects outbound through a tunnel with no open ports.',
      figure: {
        label: 'Idle GPU, billed at cost',
        title: 'Two services, one trust boundary',
        facts: [
          { label: 'Always on', value: 'Accounts · ledger · invoices', note: 'Reachable with your PC off' },
          { label: 'Outbound tunnel', value: 'No open ports', note: 'The host connects out; nothing connects in' },
          { label: 'Your machine', value: 'Ollama · Blender', note: 'Only while powered on' },
        ],
        footnote: 'kWh rate × GPU watts = price. No markup.',
      },
    },
    artifacts: [POST_GPU_SHARE, POST_SPLITTING_THE_STACK],
  },

  'you-inc': {
    introduction:
      'I wanted one view of what I own, owe, earn and spend. I built a finance product around a ledger, then removed the SaaS layer so it could belong to the person running it.',
    links: [
      { label: 'Try demo', href: 'https://youinc.net', external: true },
      { label: 'Source code', href: 'https://github.com/Slaymish/YouInc', external: true },
    ],
    cover: {
      kind: 'image',
      imageFile: IMAGES.youIncDashboard,
      alt: 'You Inc dashboard with sample cashflow, income, expenses and recurring payments.',
    },
    artifacts: [],
    resultHeading: 'Where it stands',
    body: [
      ['h2', 'A ledger before a dashboard'],
      [
        'normal',
        'I wanted a coherent view of what I own, owe, earn and spend. That needed a real accounting model underneath. Synced transactions enter a double-entry ledger where every posting must balance; cashflow, net worth and runway are different views of the same data.',
      ],
      ['h2', 'Make uncertainty visible'],
      [
        'normal',
        'Rules route known transactions. Anything uncertain stays in suspense for review instead of quietly disappearing or being treated as a confident classification. Akahu bank sync feeds the ledger, with credentials encrypted in Supabase Vault and kept out of the browser.',
      ],
      ['h2', 'Taking the SaaS layer out'],
      [
        'normal',
        'The first version had accounts, paid plans and billing. But holding other people’s bank credentials brought an obligation that went well beyond building a useful finance tool. I removed the commercial layer and made You Inc self-hosted and MIT licensed. The person running it supplies their own database and Akahu credentials.',
      ],
    ],
  },

  'health-agent': {
    introduction:
      'My nutrition and activity lived in different apps. I brought their Apple Health exports together so I could see the trends in one place.',
    links: [
      { label: 'Visit site', href: 'https://health.hamishburke.dev', external: true },
      { label: 'Source code', href: 'https://github.com/Slaymish/HealthAgent', external: true },
    ],
    cover: {
      kind: 'image',
      imageFile: IMAGES.healthAgentStatus,
      alt: 'The HealthAgent status view: daily trends and projections built from Apple Health exports.',
    },
    artifacts: [POST_HEALTH_AGENT],
  },

  'home-lab': {
    introduction:
      'What would happen if I lost the machine running my home services? I built a small server around that question, then tested a full recovery.',
    links: [],
    cover: {
      kind: 'figure',
      alt: 'A single 8GB Raspberry Pi reached by two paths: a Cloudflare Tunnel for public services and Tailscale for admin. A recovery restore was measured at 1 hour 45 minutes against a 2 hour target.',
      figure: {
        label: 'One 5W host, two doors',
        title: 'Raspberry Pi 4 · 8GB',
        facts: [
          { label: 'Public', value: 'Cloudflare Tunnel', note: 'Photos · files · calendar' },
          { label: 'Admin', value: 'Tailscale', note: 'SSH · Postgres · SMB' },
          { label: 'Memory', value: '7.26 GB allocated', note: '9.25% headroom' },
          { label: 'Restore tested', value: '1h 45m', note: 'Under a 2h target' },
        ],
        footnote: '',
      },
    },
    artifacts: [REPORT_HOME_LAB],
  },

  'wildfire-pyspark': {
    kind: 'research',
    introduction:
      'A model can look accurate while missing the fires that matter most. I explored that problem across 1.88 million wildfire records.',
    links: [],
    cover: {
      kind: 'figure',
      alt: 'Recorded random-forest results: class G recall rose from zero to 0.7518 with weighting; class G precision was 0.0099 and overall accuracy was 32 percent.',
      figure: {
        label: 'PySpark experiment',
        title: '1.88M records',
        facts: [
          { label: 'Class G recall', value: '0 → 0.7518', note: 'With class weighting' },
          { label: 'Weighted class G precision', value: '0.0099', note: '' },
          { label: 'Weighted overall accuracy', value: '32%', note: '' },
        ],
        footnote:
          'Recorded random-forest results. Class weighting finds more rare fires, with many more false positives.',
      },
    },
    artifacts: [REPORT_WILDFIRE],
  },
};

// --------------------------------------------------------------- singletons

const HOME_PAGE = {
  _id: 'homePage',
  _type: 'homePage',
  seo: {
    title: 'Hamish Burke',
    description:
      'Software, small systems, and the decisions behind them. Selected work and writing by Hamish Burke in Wellington.',
  },
  eyebrow: 'Software developer · Wellington, NZ',
  heading: 'Hamish Burke',
  lede: 'I build software, from a coach’s first website to tools I run on my own hardware.',
  intro:
    'I’m interested in what makes a system useful, what it takes to keep it running, and when to make it smaller.',
  aboutLabel: 'About me',
  /** Resolved to workStory references, in this order. */
  featuredSlugs: ['you-inc', 'sprint-coach', 'home-lab'],
  leadLinkLabel: 'Why I took the SaaS layer out',
  moreWorkHeading: 'More work',
  allWorkLabel: 'All work',
  writingLabel: 'Writing',
  writingEntryId: POST_GPU_SHARE,
  writingBlurb:
    'A GPU for friends sounds simple. Here’s what happens when accounts, costs, and a machine that sometimes switches off enter the picture.',
  writingLinkLabel: 'Read the story',
  allWritingLabel: 'All writing',
  readingLabel: 'Reading',
  readingText: 'I’m trying to make more time for reading, the piano, and being away from a screen.',
  readingLinkLabel: 'On my bookshelf',
} as const;

const WORK_INDEX_PAGE = {
  _id: 'workIndexPage',
  _type: 'workIndexPage',
  seo: { title: 'Work', description: 'Client websites, independent software, and research by Hamish Burke.' },
  hero: {
    eyebrow: 'Work',
    headlineLines: ['Things I’ve made.'],
    intro: 'Client websites, independent software, and research.',
  },
} as const;

const READING_PAGE = {
  _id: 'readingPage',
  _type: 'readingPage',
  seo: { title: 'Reading', description: 'What Hamish Burke is reading, has read, and hopes to read next.' },
  eyebrow: 'Reading',
  headline: 'Books.',
  quote: { text: 'Tell me what you read and I’ll tell you who you are.', attribution: 'François Mauriac' },
  groups: { reading: 'Reading now', toRead: 'Next', read: 'Read' },
  recommend: {
    lead: 'Read something I should have? Tell me what to pick up next.',
    placeholder: 'A book you think I’d get something out of',
    button: 'Recommend me a book',
    empty: 'Need a title to go on, even a rough one.',
    sending: 'Sending it over.',
    error: 'That didn’t go through, so give it one more try or just email it to me.',
    limited: 'You’ve sent me a few already, thanks. Email me the rest and I’ll go through them properly.',
    success:
      'Got it, thanks. If you want to tell me how you came across it, or what it triggered for you, email me, as the title on its own only tells me so much and the story behind a recommendation is the part I actually enjoy.',
  },
} as const;

const ABOUT_PROJECTS = [
  {
    heading: 'Taking the SaaS layer out of You Inc',
    body: 'I built the accounts, plans and billing around You Inc, then took them all back out again. Running a finance service meant I was taking responsibility for other people’s bank credentials, and once I actually sat with that, a tool people could run themselves on their own machine made a lot more sense.',
    link: { _type: 'ctaLink', label: 'The You Inc story', href: '/work/you-inc' },
  },
  {
    heading: 'Running a server at home',
    body: 'Got into running a server at home (and a GPU a few of us share) as it keeps handing me concrete questions I don’t get from work, like how you actually recover a machine, who can reach it from outside, and what happens when it just switches off one day.',
    link: { _type: 'ctaLink', label: 'Testing a full recovery', href: '/work/home-lab' },
  },
];

const GITHUB_CHANNEL_NOTE = 'Most of what is on the work page has source behind it.';

// ------------------------------------------------------------------ helpers

let uploaded = 0;
let reused = 0;

/** Returns the asset id for a local image, reusing an existing upload by filename. */
async function ensureImage(relativePath: string): Promise<string> {
  const name = basename(relativePath);
  const existing = await client.fetch<string | null>(
    '*[_type=="sanity.imageAsset" && originalFilename==$name][0]._id',
    { name },
  );
  if (existing) {
    reused += 1;
    return existing;
  }
  if (dryRun) return `<upload:${name}>`;
  const body = await readFile(join(repoRoot, 'migration-assets', relativePath));
  const asset = await client.assets.upload('image', body, { filename: name });
  uploaded += 1;
  return asset._id;
}

interface CurrentStory {
  _id: string;
  slug: { current: string };
  graphic?: { alt?: string };
  cover?: { alt?: string };
}

// ------------------------------------------------------------------ additive

async function additive(): Promise<void> {
  const [stories, post, coveredPosts, about, notFound] = await Promise.all([
    client.fetch<CurrentStory[]>('*[_type=="workStory"]{_id, slug, graphic, cover}'),
    client.fetch<{ markdownBody?: string } | null>('*[_id==$id][0]{markdownBody}', { id: POST_GPU_SHARE }),
    client.fetch<Array<{ _id: string; coverImage?: { alt?: string; asset?: unknown } }>>(
      '*[_id in $ids]{_id, coverImage}',
      { ids: Object.keys(POST_COVER_ALT) },
    ),
    client.fetch<Json | null>('*[_id=="aboutPage"][0]'),
    client.fetch<Json | null>('*[_id=="notFoundPage"][0]'),
  ]);

  const bySlug = new Map(stories.map((s) => [s.slug.current, s]));
  for (const slug of Object.keys(STORIES)) {
    if (!bySlug.has(slug)) throw new Error(`No workStory with slug "${slug}" in the dataset`);
  }
  if (!post) throw new Error(`Post ${POST_GPU_SHARE} is missing`);
  if (!about) throw new Error('aboutPage is missing');
  if (!notFound) throw new Error('notFoundPage is missing');

  // Resolve every image up front so the transaction holds only document mutations.
  const assetIds = new Map<string, string>();
  for (const relativePath of new Set(Object.values(IMAGES))) {
    assetIds.set(relativePath, await ensureImage(relativePath));
  }

  const tx = client.transaction();
  const describe: string[] = [];

  // 1. The GPU post: new slug, new component marker.
  const markdownBody = (post.markdownBody ?? '').replace('{{interactive}}', '{{gpu-calculator}}');
  if (!markdownBody.includes('{{gpu-calculator}}')) {
    throw new Error(`Post ${POST_GPU_SHARE} has neither {{interactive}} nor {{gpu-calculator}}`);
  }
  tx.patch(POST_GPU_SHARE, (p) =>
    p.set({ 'slug.current': 'building-a-private-ai-server-for-friends', markdownBody }),
  );
  describe.push(`patch post ${POST_GPU_SHARE}: slug -> building-a-private-ai-server-for-friends, marker -> {{gpu-calculator}}`);

  // 1b. Post cover alt text.
  for (const [id, alt] of Object.entries(POST_COVER_ALT)) {
    const current = coveredPosts.find((candidate) => candidate._id === id);
    if (!current?.coverImage?.asset) continue;
    const value = current.coverImage.alt ?? alt;
    tx.patch(id, (p) => p.set({ 'coverImage.alt': value }));
    describe.push(`patch post ${id}: coverImage.alt`);
  }

  // 2. Work stories.
  for (const [slug, planned] of Object.entries(STORIES)) {
    const current = bySlug.get(slug)!;
    const where = `workStory ${slug}`;

    const cover: Json =
      planned.cover.kind === 'figure'
        ? {
            kind: 'figure',
            alt: planned.cover.alt,
            figure: {
              label: planned.cover.figure.label,
              title: planned.cover.figure.title,
              facts: keyed(planned.cover.figure.facts as unknown as Json[], 'f'),
              footnote: planned.cover.figure.footnote,
            },
          }
        : {
            kind: 'image',
            // The alt the old graphic carried is the alt the cover keeps.
            alt: planned.cover.alt ?? current.graphic?.alt ?? current.cover?.alt ?? '',
            image: imageRef(assetIds.get(planned.cover.imageFile!)!),
          };

    check('cover.alt', where, cover.alt as string);
    check('introduction', where, planned.introduction);
    check('resultHeading', where, planned.resultHeading);
    if (planned.cover.kind === 'figure') {
      check('figure.label', where, planned.cover.figure.label);
      check('figure.title', where, planned.cover.figure.title);
      check('figure.footnote', where, planned.cover.figure.footnote);
      for (const fact of planned.cover.figure.facts) {
        check('fact.label', `${where} fact "${fact.label}"`, fact.label);
        check('fact.value', `${where} fact "${fact.label}"`, fact.value);
        check('fact.note', `${where} fact "${fact.label}"`, fact.note);
      }
    }
    for (const link of planned.links) check('link.label', where, link.label);

    const fields: Json = {
      introduction: planned.introduction,
      links: keyed(planned.links as unknown as Json[], 'l'),
      cover,
      artifacts: planned.artifacts.map(docRef),
    };

    if (planned.evidence) {
      fields.evidence = planned.evidence.map((item, index) => {
        check('evidence.alt', `${where} evidence ${index}`, item.alt);
        check('evidence.label', `${where} evidence ${index}`, item.label);
        check('evidence.heading', `${where} evidence ${index}`, item.heading);
        check('evidence.caption', `${where} evidence ${index}`, item.caption);
        return {
          _key: `e${index}`,
          image: imageRef(assetIds.get(item.imageFile)!),
          alt: item.alt,
          label: item.label,
          heading: item.heading,
          caption: item.caption,
        };
      });
    } else {
      fields.evidence = [];
    }

    if (planned.kind) fields.kind = planned.kind;
    if (planned.resultHeading) fields.resultHeading = planned.resultHeading;
    if (planned.body) fields.body = planned.body.map(([style, text], index) => block(style, text, index));

    tx.patch(current._id, (p) => p.set(fields));
    describe.push(
      `patch ${current._id} (${slug}): introduction, ${planned.links.length} link(s), ${planned.cover.kind} cover, ` +
        `${(fields.evidence as Json[]).length} evidence, ${planned.artifacts.length} artifact(s)` +
        `${planned.kind ? `, kind -> ${planned.kind}` : ''}` +
        `${planned.resultHeading ? `, resultHeading -> ${planned.resultHeading}` : ''}` +
        `${planned.body ? `, body -> ${planned.body.length} blocks` : ''}`,
    );
  }

  // 3. homePage.
  check('seo.title', 'homePage', HOME_PAGE.seo.title);
  check('seo.description', 'homePage', HOME_PAGE.seo.description);
  const { featuredSlugs, writingEntryId, ...homeRest } = HOME_PAGE;
  const homeDoc: Json = {
    ...homeRest,
    featured: featuredSlugs.map((slug, index) => docRef(bySlug.get(slug)!._id, index)),
    writingEntry: { _type: 'reference', _ref: writingEntryId },
  };
  tx.createOrReplace(homeDoc as never);
  describe.push(`createOrReplace homePage (featured: ${featuredSlugs.join(', ')})`);

  // 4. workIndexPage and readingPage.
  check('seo.title', 'workIndexPage', WORK_INDEX_PAGE.seo.title);
  check('seo.description', 'workIndexPage', WORK_INDEX_PAGE.seo.description);
  tx.createOrReplace(WORK_INDEX_PAGE as never);
  describe.push('createOrReplace workIndexPage');

  check('seo.title', 'readingPage', READING_PAGE.seo.title);
  check('seo.description', 'readingPage', READING_PAGE.seo.description);
  tx.createOrReplace(READING_PAGE as never);
  describe.push('createOrReplace readingPage');

  // 5. aboutPage.
  const hero = about.hero as { intro?: string } | undefined;
  const portrait = about.portrait as { imageAlt?: string; largeCopy?: unknown } | undefined;
  const backgroundNow = about.background as { links?: Array<Json & { href?: string; label?: string }> } | undefined;
  const aboutFields: Json = {
    eyebrow: 'About',
    heading: 'Hi, I’m Hamish.',
    intro: hero?.intro ?? (about.intro as string) ?? '',
    portraitAlt: portrait?.imageAlt ?? (about.portraitAlt as string) ?? '',
    projects: keyed(ABOUT_PROJECTS as unknown as Json[], 'p'),
  };
  // The old page nested largeCopy under portrait, which the subtractive step unsets.
  const largeCopy = portrait?.largeCopy ?? about.largeCopy;
  if (largeCopy) aboutFields.largeCopy = largeCopy;
  if (backgroundNow?.links) {
    aboutFields['background.links'] = backgroundNow.links
      .filter((link) => link.href !== '/projects')
      .map((link) => ({ ...link, label: stripArrow(link.label ?? '') }));
  }
  if (!aboutFields.intro) throw new Error('aboutPage has no hero.intro or intro to carry forward');
  if (!aboutFields.portraitAlt) throw new Error('aboutPage has no portrait.imageAlt or portraitAlt to carry forward');
  tx.patch('aboutPage', (p) => p.set(aboutFields));
  describe.push(
    `patch aboutPage: eyebrow, heading, intro, portraitAlt, 2 projects` +
      `${largeCopy ? ', largeCopy lifted out of portrait' : ''}` +
      `, background.links ${backgroundNow?.links?.length ?? 0} -> ${(aboutFields['background.links'] as Json[] | undefined)?.length ?? 0}`,
  );

  // 6. notFoundPage and contactPage.
  const suggestions = (notFound.suggestions as Array<Json & { href?: string }> | undefined) ?? [];
  const keptSuggestions = suggestions.filter((s) => s.href !== '/projects');
  tx.patch('notFoundPage', (p) => p.set({ suggestions: keptSuggestions }));
  describe.push(`patch notFoundPage: suggestions ${suggestions.length} -> ${keptSuggestions.length}`);

  tx.patch('contactPage', (p) => p.set({ 'channels[_key=="github"].note': GITHUB_CHANNEL_NOTE }));
  describe.push('patch contactPage: channels[github].note');

  await commit(tx, describe, `Uploaded ${uploaded} images (${reused} reused)`);
}

// --------------------------------------------------------------- subtractive

const STORY_FIELDS_TO_UNSET = [
  'status',
  'service',
  'metric',
  'problem',
  'interventions',
  'question',
  'built',
  'learned',
  'differently',
  'graphic',
  'primaryArtifact',
  'supportingArtifacts',
  'narrative',
];

const POST_FIELDS_TO_UNSET = ['body', 'interactiveElement'];
const ABOUT_FIELDS_TO_UNSET = ['hero', 'portrait', 'capabilities', 'contactHeading'];
const SITE_SETTINGS_FIELDS_TO_UNSET = ['header', 'footer'];
const GHOST_TYPES = ['project', 'aphorism', 'projectsIndexPage'];

async function subtractive(): Promise<void> {
  const [storyIds, postIds, ghostIds] = await Promise.all([
    client.fetch<string[]>('*[_type=="workStory"]._id'),
    client.fetch<string[]>('*[_type=="post"]._id'),
    client.fetch<string[]>('*[_type in $types]._id', { types: GHOST_TYPES }),
  ]);

  const tx = client.transaction();
  const describe: string[] = [];

  for (const id of storyIds) tx.patch(id, (p) => p.unset(STORY_FIELDS_TO_UNSET));
  describe.push(`unset ${STORY_FIELDS_TO_UNSET.length} legacy fields on ${storyIds.length} work stories`);

  for (const id of postIds) tx.patch(id, (p) => p.unset(POST_FIELDS_TO_UNSET));
  describe.push(`unset ${POST_FIELDS_TO_UNSET.join(', ')} on ${postIds.length} posts`);

  tx.patch('aboutPage', (p) => p.unset(ABOUT_FIELDS_TO_UNSET));
  describe.push(`unset ${ABOUT_FIELDS_TO_UNSET.join(', ')} on aboutPage`);

  tx.patch('siteSettings', (p) => p.unset(SITE_SETTINGS_FIELDS_TO_UNSET));
  describe.push(`unset ${SITE_SETTINGS_FIELDS_TO_UNSET.join(', ')} on siteSettings`);

  // Only ids a preceding fetch found, so a re-run deletes nothing that is gone.
  for (const id of ghostIds) tx.delete(id);
  describe.push(`delete ${ghostIds.length} ghost documents (${GHOST_TYPES.join(', ')})`);

  await commit(tx, describe, `Unset legacy fields on ${storyIds.length + postIds.length + 2} documents`);
}

// -------------------------------------------------------------------- commit

async function commit(
  tx: ReturnType<SanityClient['transaction']>,
  describe: string[],
  summary: string,
): Promise<void> {
  if (violations.length > 0) {
    console.error('Schema length limits would be exceeded:');
    for (const v of violations) console.error(`  ${v}`);
    process.exit(1);
  }

  for (const line of describe) console.log(`  ${line}`);
  console.log('');
  console.log(summary);

  if (dryRun) {
    console.log(JSON.stringify(tx.toJSON(), null, 2));
    console.log('');
    console.log(`Dry run: ${tx.toJSON().length} mutations, nothing written.`);
    return;
  }

  if (!process.env.SANITY_WRITE_ACK) {
    console.error('Refusing to write without SANITY_WRITE_ACK=1.');
    process.exit(1);
  }

  const result = await tx.commit({ visibility: 'async' });
  console.log(`Transaction committed: ${result.transactionId}`);
}

console.log(`${mode}${dryRun ? ' (dry run)' : ''} against ${client.config().dataset}`);
console.log('');
await (mode === 'additive' ? additive() : subtractive());
