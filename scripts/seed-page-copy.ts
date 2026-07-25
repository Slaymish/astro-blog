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
      navLinks: [
        { _key: 'home', _type: 'ctaLink', label: 'Home', href: '/' },
        { _key: 'work', _type: 'ctaLink', label: 'Work', href: '/work' },
        { _key: 'about', _type: 'ctaLink', label: 'About', href: '/about' }
      ],
      bookingLabel: 'Book a call',
      bookingLabelShort: 'Book'
    },
    footer: {
      tagline: 'Independent software work from Wellington, NZ.',
      navLinks: [
        { _key: 'work', _type: 'ctaLink', label: 'Work', href: '/work' },
        { _key: 'about', _type: 'ctaLink', label: 'About', href: '/about' },
        { _key: 'cv', _type: 'ctaLink', label: 'CV', href: '/cv' }
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
      availabilityLabel: 'Available for selected projects',
      defaultHeading: 'Have a complicated problem?',
      bookingLabel: 'Book a call'
    }
  },
  {
    _id: 'homePage',
    _type: 'homePage',
    seo: {
      title: 'Hamish Burke',
      description:
        'Wellington web developer turning unclear requirements and manual processes into digital products, internal tools, and practical automation.'
    },
    hero: {
      eyebrow: 'Hamish Burke / Web developer at Alphero in Wellington, NZ',
      headline: 'Software for work that has outgrown the',
      headlineAccent: 'workaround.',
      lede: 'I turn unclear requirements and manual processes into digital products, internal tools, and practical automation.',
      primaryCta: { _type: 'ctaLink', label: 'View selected work', href: '/work' },
      secondaryCta: {
        _type: 'ctaLink',
        label: 'Discuss a project',
        href: BOOKING_URL,
        external: true,
        ariaLabel: 'Discuss a project on Cal.com'
      }
    },
    services: ['Product engineering', 'Workflow automation', 'Technical direction'],
    workSection: {
      eyebrow: '2024-2026',
      heading: 'Selected work',
      link: { _type: 'ctaLink', label: 'All work', href: '/work' }
    },
    approach: {
      label: 'How I work',
      heading: 'I work from the problem outward.',
      body: 'Define what matters, choose the smallest sound system that solves it, and make the result understandable to the people who have to use it. The case studies show the constraints and trade-offs, not just the finished surface.',
      link: { _type: 'ctaLink', label: 'More about me', href: '/about' }
    },
    contactHeading: 'What are you trying to make work?'
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
        'I’m Hamish, a software engineer who works from the underlying problem through to the interface people actually use. I’m most useful when the brief is complicated, the path is unclear, and a practical result matters more than technical theatre.'
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
      body: 'My public portfolio deliberately excludes NDA-covered client work. The work shown here is what I can discuss honestly: finished freelance delivery, products I have built end to end, and technical studies with enough evidence to inspect.'
    },
    capabilities: {
      label: 'What I bring',
      heading: 'Breadth with a point.',
      items: [
        {
          _key: 'delivery',
          title: 'Product delivery',
          body: 'Responsive interfaces, content systems, integrations, and the release path needed to make them maintainable.'
        },
        {
          _key: 'systems',
          title: 'Systems thinking',
          body: 'Data models, APIs, infrastructure, security boundaries, and recovery plans shaped around the real constraint.'
        },
        {
          _key: 'clarity',
          title: 'Technical clarity',
          body: 'Plain-language decisions, visible trade-offs, and enough documentation for someone else to operate the result.'
        }
      ]
    },
    background: {
      label: 'Background',
      heading: 'From research into shipping software.',
      paragraphs: [
        'I completed a Master of Computer Science at Victoria University of Wellington. My thesis studied diffusion-based anomaly detection for electrical distribution networks. That work sharpened how I frame uncertain problems, evaluate evidence, and separate an interesting result from a useful one.',
        'Outside software, I boulder, play piano, and read widely. Those are good counterweights to work that can otherwise become entirely screens and abstractions.'
      ],
      links: [
        { _key: 'cv', _type: 'ctaLink', label: 'View CV →', href: '/cv' },
        { _key: 'work', _type: 'ctaLink', label: 'Selected work →', href: '/work' },
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
        'Client websites, digital products, AI systems, and technical architecture. Each story starts with what changed—not a list of tools.'
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
      { _key: 'work', _type: 'ctaLink', label: 'Work', href: '/work' },
      { _key: 'about', _type: 'ctaLink', label: 'About', href: '/about' },
      { _key: 'cv', _type: 'ctaLink', label: 'CV', href: '/cv' },
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
