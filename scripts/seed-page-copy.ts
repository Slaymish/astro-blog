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
      tagline: 'Building things and writing about them, from Wellington, NZ.',
      navLinks: [
        { _key: 'projects', _type: 'ctaLink', label: 'Projects', href: '/projects' },
        { _key: 'writing', _type: 'ctaLink', label: 'Writing', href: '/writing' },
        { _key: 'work', _type: 'ctaLink', label: 'Work', href: '/work' },
        { _key: 'about', _type: 'ctaLink', label: 'About', href: '/about' },
        { _key: 'reading', _type: 'ctaLink', label: 'Reading', href: '/reading' },
        { _key: 'cv', _type: 'ctaLink', label: 'CV', href: '/cv' },
        { _key: 'contact', _type: 'ctaLink', label: 'Contact', href: '/contact' }
      ],
      profileLinks: [
        { _key: 'email', _type: 'ctaLink', label: 'Email', href: `mailto:${CONTACT_EMAIL}` },
        { _key: 'github', _type: 'ctaLink', label: 'GitHub', href: 'https://github.com/Slaymish', external: true },
        {
          _key: 'linkedin',
          _type: 'ctaLink',
          label: 'LinkedIn',
          href: 'https://www.linkedin.com/in/hamish-burke-2301669a',
          external: true
        }
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
        'Software developer in Wellington, New Zealand. I build things in the open and write about technology, AI, systems, and the problems worth solving.'
    },
    hero: {
      eyebrow: 'Hamish Burke / Wellington, New Zealand',
      headline: 'Software developer',
      headlineAccent: 'in Wellington.',
      lede: 'I build things I want to exist, and I publish them. The code is publicly readable, the write-ups say what did not work, and you can run most of it yourself.',
      links: [
        { _key: 'projects', _type: 'ctaLink', label: 'Projects', href: '/projects' },
        { _key: 'writing', _type: 'ctaLink', label: 'Writing', href: '/writing' },
        { _key: 'about', _type: 'ctaLink', label: 'About', href: '/about' }
      ]
    },
    interests: {
      label: 'What I’m interested in',
      statement:
        'I care about how things work, how those things interact once they’re part of something bigger, and what’s actually worth building in the first place.',
      items: [
        { _key: 'technology', title: 'Technology', body: 'How things work.' },
        { _key: 'systems', title: 'Systems', body: 'How complicated things interact.' },
        { _key: 'strategy', title: 'Strategy', body: 'What is actually worth doing.' }
      ]
    },
    currently: {
      label: 'Currently',
      heading: 'Learning how software actually gets made.',
      body: 'I’m working as a junior software developer at Alphero, where I’m learning how software gets designed, built, and produced for real organisations. That is the part you cannot get from side projects alone, and it is most of what I am doing right now.',
      link: { _type: 'ctaLink', label: 'Professional work', href: '/work' }
    },
    projectsSection: {
      eyebrow: 'Independent',
      heading: 'Things I built',
      link: { _type: 'ctaLink', label: 'All projects', href: '/projects' }
    },
    workSection: {
      eyebrow: 'Professional',
      heading: 'Client work',
      link: { _type: 'ctaLink', label: 'All work', href: '/work' }
    },
    writingSection: {
      eyebrow: 'Writing',
      heading: 'What I’ve been thinking about',
      link: { _type: 'ctaLink', label: 'All writing', href: '/writing' }
    },
    contactHeading: 'Working on something interesting?'
  },
  {
    _id: 'writingIndexPage',
    _type: 'writingIndexPage',
    seo: {
      title: 'Writing',
      description:
        'Essays, technical explorations, and notes on AI, software systems, and the things Hamish Burke is trying to figure out.'
    },
    hero: {
      eyebrow: 'Writing',
      headlineLines: ['What I’ve been', 'thinking about.'],
      intro:
        'Technical explorations, things I have worked out, and questions I have not answered yet. Mostly AI, software systems, and the places where they meet everything else.'
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
        'Software engineer in Wellington working across digital products, AI systems, infrastructure, and the interfaces that make them useful.'
    },
    hero: {
      eyebrow: 'About · Wellington, New Zealand',
      heading: 'I like understanding the whole system.',
      intro:
        'I’m Hamish. I build software, and I am mostly interested in what happens at the edges of it: how organisations actually decide things, where AI genuinely changes what is possible, and which problems are worth the effort. I am early in working that out.'
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
      body: 'This site deliberately excludes NDA-covered client work. What is here is what I can discuss honestly: things I built myself, finished freelance delivery, and technical studies with enough evidence to inspect and enough limitations to be worth reading.'
    },
    capabilities: {
      label: 'What I’m working on getting good at',
      heading: 'Three things I keep coming back to.',
      items: [
        {
          _key: 'delivery',
          title: 'Shipping things that last',
          body: 'Interfaces, content systems, and integrations, plus the release path that decides whether any of it survives contact with real use.'
        },
        {
          _key: 'systems',
          title: 'Seeing the whole system',
          body: 'Data models, APIs, infrastructure, and trust boundaries. I find the constraints more interesting than the features.'
        },
        {
          _key: 'clarity',
          title: 'Saying what actually happened',
          body: 'Visible trade-offs, honest limits, and results reported as they came out rather than as I would have liked them to.'
        }
      ]
    },
    background: {
      label: 'Background',
      heading: 'From research into shipping software.',
      paragraphs: [
        'I completed a Master of Computer Science at Victoria University of Wellington. My thesis studied diffusion-based anomaly detection for electrical distribution networks. That work sharpened how I frame uncertain problems, evaluate evidence, and separate an interesting result from a useful one.',
        'Outside software, I’m working on making more time for reading, playing the piano, and getting away from screens. They serve as essential counterweights to a day spent entirely in code and abstractions.'
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
      title: 'CV — Hamish Burke',
      description:
        'Current professional summary and academic CV for Hamish Burke, a software engineer in Wellington, New Zealand.'
    },
    hero: {
      eyebrow: 'Curriculum vitae',
      headlineLines: ['Software engineer.', 'Systems thinker.'],
      intro:
        'I work across digital products, AI systems, infrastructure, and the interfaces that make them usable. I’m currently a web developer at Alphero and take on selected independent projects.',
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
      description: 'Websites, digital products, AI systems, and technical architecture built by Hamish Burke.'
    },
    hero: {
      eyebrow: 'Selected work · 2024–2026',
      headlineLines: ['Useful systems,', 'built properly.'],
      intro:
        'Client websites, digital products, AI systems, and technical architecture. Each story starts with what changed, not just a list of tools.'
    },
    leadSection: {
      heading: 'Lead work',
      description: 'Finished client delivery and substantial products.'
    },
    supportSection: {
      heading: 'Technical studies',
      description: 'Smaller systems that prove a specific engineering capability.'
    },
    contactHeading: 'What are you trying to make work?'
  },
  {
    _id: 'projectsIndexPage',
    _type: 'projectsIndexPage',
    seo: {
      title: 'Projects',
      description:
        'Independent things Hamish Burke has built, each one written up around the question it started from and what it taught him.'
    },
    hero: {
      eyebrow: 'Independent projects',
      headlineLines: ['Things I built', 'to find out.'],
      intro:
        'Projects I started myself, usually because I wanted to know whether something was possible. Each one says what the question was, what I built, what I learned, and what I would do differently.'
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
        'I like hearing about interesting problems and from people working on ambitious things. Email is the surest way to reach me.'
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
      'I work full time at Alphero and take on a small number of independent projects alongside it. If you have something that fits, say what the problem is and I will tell you honestly whether I am the right person for it.'
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
    body: "This page doesn't exist. Maybe it was moved, or maybe it never was.",
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
