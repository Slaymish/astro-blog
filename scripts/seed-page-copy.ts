/**
 * Seeds the page-copy singletons in Sanity with the copy that previously lived
 * in the Astro templates. Safe to re-run: each document is written by fixed ID.
 *
 *   npm run seed:copy
 *
 * Requires SANITY_API_TOKEN with write access.
 */

import { createClient } from '@sanity/client';
import { BOOKING_URL, CONTACT_EMAIL } from '../src/lib/site';

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET || 'production';
const apiVersion = process.env.SANITY_API_VERSION || '2024-01-01';
const token = process.env.SANITY_API_TOKEN;

if (!projectId) {
  console.error('Missing SANITY_PROJECT_ID. Add it to .env.');
  process.exit(1);
}

if (!token) {
  console.error(
    'Missing SANITY_API_TOKEN.\n' +
      'Create an Editor token at https://sanity.io/manage → API → Tokens, then add\n' +
      'SANITY_API_TOKEN=... to your .env file. Do not commit it.'
  );
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false });

/** Each entry is a singleton written by fixed ID, so the shapes deliberately differ. */
type SeedDocument = { _id: string; _type: string } & Record<string, unknown>;

const documents: SeedDocument[] = [
  {
    _id: 'siteSettings',
    _type: 'siteSettings',
    header: {
      // Order leaves room for /now to be inserted after Writing without rebalancing.
      // Writing sits in the footer, not the header: the last post is from March
      // 2026, and a stale section does not earn top-level placement. Promote it
      // back when the cadence justifies it.
      navLinks: [
        { _key: 'projects', _type: 'ctaLink', label: 'Projects', href: '/projects' },
        { _key: 'work', _type: 'ctaLink', label: 'Work', href: '/work' },
        { _key: 'about', _type: 'ctaLink', label: 'About', href: '/about' },
        { _key: 'contact', _type: 'ctaLink', label: 'Contact', href: '/contact' }
      ]
    },
    footer: {
      tagline: 'Software developer, Wellington, New Zealand.',
      navLinks: [
        { _key: 'projects', _type: 'ctaLink', label: 'Projects', href: '/projects' },
        { _key: 'writing', _type: 'ctaLink', label: 'Writing', href: '/writing' },
        { _key: 'work', _type: 'ctaLink', label: 'Work', href: '/work' },
        { _key: 'about', _type: 'ctaLink', label: 'About', href: '/about' },
        { _key: 'reading', _type: 'ctaLink', label: 'Reading', href: '/reading' },
        { _key: 'contact', _type: 'ctaLink', label: 'Contact', href: '/contact' }
      ],
      // Email and LinkedIn live on /contact; repeating them here read as a job-search
      // sidebar. GitHub stays because it points at the work rather than at a pitch.
      profileLinks: [
        { _key: 'github', _type: 'ctaLink', label: 'GitHub', href: 'https://github.com/Slaymish', external: true }
      ]
    },
    contactBand: {
      label: 'Get in touch',
      defaultHeading: 'Working on something interesting?',
      contactLabel: 'Contact',
      bookingLabel: 'Book a call'
    }
  },
  {
    _id: 'homePage',
    _type: 'homePage',
    seo: {
      title: 'Hamish Burke',
      description:
        'Software developer in Wellington, New Zealand. Independent projects, client work, and notes on AI and software systems.'
    },
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
    },
    contactHeading: 'Working on something interesting?'
  },
  {
    _id: 'writingIndexPage',
    _type: 'writingIndexPage',
    seo: {
      title: 'Writing',
      description:
        'Notes on AI and software systems by Hamish Burke.'
    },
    hero: {
      eyebrow: 'Writing',
      headlineLines: ['What I’ve been', 'thinking about.'],
      intro:
        'Mostly AI and software systems, written while I’m still working them out.'
    },
    filterLabel: 'Filter by tag',
    emptyMessage: 'Nothing here yet.'
  },
  {
    _id: 'aboutPage',
    _type: 'aboutPage',
    seo: {
      title: 'About Hamish Burke',
      description:
        'Hamish Burke is a web developer at Alphero in Wellington, New Zealand, with a master’s in computer science from Victoria University of Wellington.'
    },
    hero: {
      eyebrow: 'About · Wellington, New Zealand',
      heading: 'I like understanding the whole system.',
      intro:
        'I’m Hamish. I build software, and I’m mostly interested in what happens at the edges of it: how organisations actually decide things, and which problems are worth the effort. I’m early in working that out.'
    },
    portrait: {
      imageAlt: 'Hamish Burke in Wellington',
      label: 'Current context',
      largeCopy: [
        {
          _type: 'block',
          _key: 'largecopy',
          style: 'normal',
          markDefs: [{ _key: 'alphero', _type: 'link', href: 'https://www.alphero.com/' }],
          children: [
            { _type: 'span', _key: 'a', text: 'I work at ', marks: [] },
            { _type: 'span', _key: 'b', text: 'Alphero', marks: ['alphero'] },
            {
              _type: 'span',
              _key: 'c',
              text: ' as a web developer and take on a small number of independent projects.',
              marks: []
            }
          ]
        }
      ],
      body: 'There’s no NDA-covered client work on this site. What’s here is what I’m free to publish: things I built myself, finished freelance work, and a few technical studies.'
    },
    capabilities: {
      label: 'What I’m working on getting good at',
      heading: 'Things I keep coming back to.',
      items: [
        {
          _key: 'delivery',
          title: 'Shipping things that last',
          body: 'Interfaces, content systems, integrations, and the release path. The release path usually decides whether the rest of it holds up.'
        },
        {
          _key: 'systems',
          title: 'Seeing the whole system',
          body: 'Data models, APIs, infrastructure, trust boundaries. I find the constraints more interesting than the features.'
        },
        {
          _key: 'clarity',
          title: 'Writing it down',
          body: 'Keeping design notes and known limits current, while I still remember why I picked one option over another.'
        }
      ]
    },
    background: {
      label: 'Background',
      heading: 'From research into shipping software.',
      paragraphs: [
        'I did a Master of Computer Science at Victoria University of Wellington. My thesis was on diffusion-based anomaly detection for electrical distribution networks. Mostly it taught me the difference between an interesting result and a useful one.',
        'Outside software I’m trying to make more time for reading, the piano, and being away from a screen.'
      ],
      links: [
        { _key: 'cv', _type: 'ctaLink', label: 'View CV →', href: '/cv' },
        { _key: 'projects', _type: 'ctaLink', label: 'Projects →', href: '/projects' },
        { _key: 'work', _type: 'ctaLink', label: 'Professional work →', href: '/work' },
        { _key: 'github', _type: 'ctaLink', label: 'GitHub ↗', href: 'https://github.com/Slaymish', external: true },
        {
          _key: 'linkedin',
          _type: 'ctaLink',
          label: 'LinkedIn ↗',
          href: 'https://www.linkedin.com/in/hamish-burke-2301669a',
          external: true
        }
      ]
    },
    contactHeading: 'Want to talk through a problem?'
  },
  {
    _id: 'cvPage',
    _type: 'cvPage',
    seo: {
      title: 'CV · Hamish Burke',
      description:
        'Current professional summary and academic CV for Hamish Burke, a software engineer in Wellington, New Zealand.'
    },
    hero: {
      eyebrow: 'Curriculum vitae',
      headlineLines: ['Software engineer.', 'Wellington, NZ.'],
      intro:
        'I’m a web developer at Alphero, and I take on a small number of independent projects alongside it.',
      actions: [
        {
          _key: 'linkedin',
          _type: 'ctaLink',
          label: 'Current experience on LinkedIn',
          href: 'https://www.linkedin.com/in/hamish-burke-2301669a',
          external: true
        },
        { _key: 'work', _type: 'ctaLink', label: 'Selected work', href: '/work' }
      ]
    },
    facts: [
      { _key: 'role', label: 'Current role', value: 'Web Developer · Alphero' },
      { _key: 'education', label: 'Education', value: 'MSc Computer Science · Victoria University of Wellington' },
      { _key: 'based', label: 'Based in', value: 'Wellington, New Zealand' },
      { _key: 'focus', label: 'Focus', value: 'Digital products · AI automation · technical systems' }
    ],
    academic: {
      eyebrow: 'Document archive',
      heading: 'Academic CV',
      body: 'The downloadable PDF is an earlier academic snapshot. It predates my current Alphero role and still describes the MSc as in progress. Use LinkedIn and this site for current professional context.',
      downloadCta: { _type: 'ctaLink', label: 'Open academic CV', href: '/cv.pdf' },
      requestCta: { _type: 'ctaLink', label: 'Request a current CV →', href: `mailto:${CONTACT_EMAIL}` }
    }
  },
  {
    _id: 'workIndexPage',
    _type: 'workIndexPage',
    seo: {
      title: 'Selected Work',
      description: 'Client websites, independent products, and technical studies built by Hamish Burke in Wellington, New Zealand.'
    },
    hero: {
      eyebrow: 'Selected work · 2024–2026',
      headlineLines: ['Work I can', 'show you.'],
      intro:
        'Client websites, products I built for myself, and a few technical studies.'
    },
    leadSection: {
      heading: 'Lead work',
      description: 'Finished client work and the larger products.'
    },
    supportSection: {
      heading: 'Technical studies',
      description: 'Smaller builds, each one testing one specific thing.'
    },
    contactHeading: 'What are you trying to make work?'
  },
  {
    _id: 'projectsIndexPage',
    _type: 'projectsIndexPage',
    seo: {
      title: 'Projects',
      description:
        'Independent projects by Hamish Burke, including a home lab, a self-hosted finance ledger, and a GPU sharing platform.'
    },
    hero: {
      eyebrow: 'Independent projects',
      headlineLines: ['Things I built', 'to find out.'],
      intro:
        'Projects I started myself, usually to find out whether something was possible. A home lab, a self-hosted finance ledger, a GPU sharing platform.'
    },
    contactHeading: 'Working on something similar?'
  },
  {
    _id: 'contactPage',
    _type: 'contactPage',
    seo: {
      title: 'Contact',
      description: 'How to reach Hamish Burke: email, a call, GitHub, or LinkedIn.'
    },
    hero: {
      eyebrow: 'Contact',
      headlineLines: ['Say hello.'],
      intro:
        'I like hearing about problems people are stuck on. Email is the surest way to reach me.'
    },
    channels: [
      {
        _key: 'email',
        label: 'Email',
        note: 'The best way to reach me. I read everything, and I reply to most things.',
        link: { _type: 'ctaLink', label: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` }
      },
      {
        _key: 'call',
        label: 'A call',
        note: 'Thirty minutes, if a conversation would be faster than a thread.',
        link: {
          _type: 'ctaLink',
          label: 'Book a time',
          href: BOOKING_URL,
          external: true,
          ariaLabel: 'Book a call on Cal.com'
        }
      },
      {
        _key: 'github',
        label: 'GitHub',
        note: 'Most of what is on the projects page has source behind it.',
        link: { _type: 'ctaLink', label: 'Slaymish', href: 'https://github.com/Slaymish', external: true }
      },
      {
        _key: 'linkedin',
        label: 'LinkedIn',
        note: 'Current role and professional history.',
        link: {
          _type: 'ctaLink',
          label: 'Hamish Burke',
          href: 'https://www.linkedin.com/in/hamish-burke-2301669a',
          external: true
        }
      }
    ],
    availabilityNote:
      'I work full time at Alphero and take on a small number of independent projects alongside it. If you have something that fits, say what the problem is and I’ll tell you whether I’m the right person for it.'
  },
  {
    _id: 'notFoundPage',
    _type: 'notFoundPage',
    seo: {
      title: '404 - Page Not Found',
      description: "The page you're looking for doesn't exist."
    },
    code: '404',
    heading: 'Page not found',
    body: "This page doesn't exist. It might have moved.",
    homeLabel: 'Go home',
    backLabel: 'Go back',
    suggestionsLabel: 'Or try one of these:',
    suggestions: [
      { _key: 'projects', _type: 'ctaLink', label: 'Projects', href: '/projects' },
      { _key: 'writing', _type: 'ctaLink', label: 'Writing', href: '/writing' },
      { _key: 'work', _type: 'ctaLink', label: 'Work', href: '/work' },
      { _key: 'about', _type: 'ctaLink', label: 'About', href: '/about' },
      { _key: 'rss', _type: 'ctaLink', label: 'RSS Feed', href: '/rss.xml' }
    ]
  }
];

async function seed() {
  const transaction = client.transaction();
  for (const doc of documents) {
    transaction.createOrReplace(doc);
  }

  await transaction.commit();
  console.log(`Seeded ${documents.length} documents into ${projectId}/${dataset}:`);
  for (const doc of documents) {
    console.log(`  ${doc._id}`);
  }
}

seed().catch((error) => {
  console.error('Seeding failed:', error.message);
  process.exit(1);
});
