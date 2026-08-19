/**
 * One-off copy pass: strips AI-writing patterns from the page singletons and
 * work stories in Sanity. Every edit is declared below with its before value so
 * the script can refuse to run if the live document has moved on since the audit.
 *
 *   pnpm exec tsx scripts/copy-humanise.ts            # dry run, prints a diff
 *   pnpm exec tsx scripts/copy-humanise.ts --apply    # writes to Sanity
 *
 * Requires SANITY_API_TOKEN with write access.
 */

import { createClient } from '@sanity/client';

/**
 * A single field replacement. `before` is the full current value as captured
 * during the audit; the script re-reads the live value and refuses to write if
 * the two have diverged, so a Studio edit made since the audit is never
 * silently overwritten.
 */
type Edit = {
  id: string;
  path: string;
  before: string;
  after: string;
  why: string;
};

// ---------------------------------------------------------------------------
// Home page
// ---------------------------------------------------------------------------

const homePage: Edit[] = [
  {
    id: 'homePage',
    path: 'interests.statement',
    before:
      'I care about how things work, how those things interact once they’re part of something bigger, and what’s actually worth building in the first place.',
    after: 'I mostly want to know why a thing was built the way it was.',
    why: 'Rule of three, and it restated the three cards rendered directly beneath it. Replaced with an opinion rather than a mood.'
  },
  {
    id: 'homePage',
    path: 'currently.body',
    before:
      'I’m working as a junior software developer at Alphero, where I’m learning how software gets designed, built, and produced for real organisations. That is the part you cannot get from side projects alone, and it is most of what I am doing right now.',
    after:
      'I’m a junior developer at Alphero, learning how software actually gets built for real organisations. That’s the part side projects don’t teach you, and it’s most of what I’m doing right now.',
    why: 'Cut the "designed, built, and produced" triple; contractions to match how he speaks.'
  },
  {
    id: 'homePage',
    path: 'hero.lede',
    before:
      'I build things I want to exist, and I publish them. The code is publicly readable, the write-ups say what did not work, and you can run most of it yourself.',
    after:
      'I build things I want to exist, and I publish them. The code is public and the write-ups say what didn’t work.',
    why: 'Trimmed a rule of three down to the two claims that carry weight.'
  },
  {
    id: 'homePage',
    path: 'seo.description',
    before:
      'Software developer in Wellington, New Zealand. I build things in the open and write about technology, AI, systems, and the problems worth solving.',
    after:
      'Software developer in Wellington, New Zealand. I build things in the open and write up what happened, including what did not work.',
    why: '"the problems worth solving" is stock phrasing; replaced with the site’s actual differentiator.'
  }
];

// ---------------------------------------------------------------------------
// About page: the densest concentration of AI patterns on the site
// ---------------------------------------------------------------------------

const aboutPage: Edit[] = [
  {
    id: 'aboutPage',
    path: 'hero.intro',
    before:
      'I’m Hamish. I build software, and I am mostly interested in what happens at the edges of it: how organisations actually decide things, where AI genuinely changes what is possible, and which problems are worth the effort. I am early in working that out.',
    after:
      'I’m Hamish. I build software, and I’m mostly interested in what happens at the edges of it: how organisations actually decide things, and which problems are worth the effort. I’m early in working that out.',
    why: 'Dropped the middle item of a three-part colon list; the AI clause was the weakest of the three.'
  },
  {
    id: 'aboutPage',
    path: 'capabilities.heading',
    before: 'Three things I keep coming back to.',
    after: 'Things I keep coming back to.',
    why: 'Announcing the count is what forces the rule of three.'
  },
  {
    id: 'aboutPage',
    path: 'capabilities.items[0].body',
    before:
      'Interfaces, content systems, and integrations, plus the release path that decides whether any of it survives contact with real use.',
    after:
      'Interfaces, content systems, integrations, and the release path. The release path usually decides whether the rest of it holds up.',
    why: '"survives contact with real use" is a worn-out metaphor; split into a claim that says something.'
  },
  {
    id: 'aboutPage',
    path: 'capabilities.items[1].body',
    before:
      'Data models, APIs, infrastructure, and trust boundaries. I find the constraints more interesting than the features.',
    after:
      'Data models, APIs, infrastructure, trust boundaries. I find the constraints more interesting than the features.',
    why: 'Second sentence was already good; only the list punctuation needed loosening.'
  },
  {
    id: 'aboutPage',
    path: 'capabilities.items[2].body',
    before:
      'Visible trade-offs, honest limits, and results reported as they came out rather than as I would have liked them to.',
    after: 'Reporting results as they came out rather than as I would have liked them to.',
    why: 'Kept the one specific clause and deleted the two abstract ones in front of it.'
  },
  {
    id: 'aboutPage',
    path: 'background.paragraphs[0]',
    before:
      'I completed a Master of Computer Science at Victoria University of Wellington. My thesis studied diffusion-based anomaly detection for electrical distribution networks. That work sharpened how I frame uncertain problems, evaluate evidence, and separate an interesting result from a useful one.',
    after:
      'I did a Master of Computer Science at Victoria University of Wellington. My thesis was on diffusion-based anomaly detection for electrical distribution networks. Mostly it taught me the difference between an interesting result and a useful one.',
    why: 'Significance inflation ("sharpened how I frame...") plus a rule of three. Kept the item that was actually concrete.'
  },
  {
    id: 'aboutPage',
    path: 'background.paragraphs[1]',
    before:
      'Outside software, I’m working on making more time for reading, playing the piano, and getting away from screens. They serve as essential counterweights to a day spent entirely in code and abstractions.',
    after:
      'Outside software I’m trying to make more time for reading, the piano, and being away from a screen.',
    why: '"serve as essential counterweights" is copula avoidance plus a flourish. The second sentence added nothing.'
  },
  {
    id: 'aboutPage',
    path: 'portrait.body',
    before:
      'This site deliberately excludes NDA-covered client work. What is here is what I can discuss honestly: things I built myself, finished freelance delivery, and technical studies with enough evidence to inspect and enough limitations to be worth reading.',
    after:
      'There’s no NDA-covered client work on this site. What’s here is what I can talk about honestly: things I built myself, finished freelance work, and technical studies where the limitations are written down alongside the results.',
    why: '"enough evidence to inspect and enough limitations to be worth reading" is precious parallelism.'
  },
  {
    id: 'aboutPage',
    path: 'seo.description',
    before:
      'Software engineer in Wellington working across digital products, AI systems, infrastructure, and the interfaces that make them useful.',
    after:
      'Hamish Burke is a web developer at Alphero in Wellington, New Zealand, who builds and writes up independent projects.',
    why: 'Same four-item laundry list appeared on About, CV and Work. Replaced with a fact.'
  }
];

// ---------------------------------------------------------------------------
// Index and utility pages
// ---------------------------------------------------------------------------

const indexPages: Edit[] = [
  {
    id: 'workIndexPage',
    path: 'hero.headlineLines[0]',
    before: 'Useful systems,',
    after: 'Work I can',
    why: '"Useful systems, built properly" is an empty claim of exactly the kind an AI generator produces. The replacement points at the real constraint: the About page says NDA work is deliberately excluded, so this page is what is left.'
  },
  { id: 'workIndexPage', path: 'hero.headlineLines[1]', before: 'built properly.', after: 'show you.', why: 'See above.' },
  {
    id: 'workIndexPage',
    path: 'hero.intro',
    before:
      'Client websites, digital products, AI systems, and technical architecture. Each story starts with what changed, not just a list of tools.',
    after:
      'Client websites, products I built for myself, and a few technical studies. Each one says what the problem was and what happened.',
    why: 'Four-item buzzword list plus a "not just X" contrastive.'
  },
  {
    id: 'workIndexPage',
    path: 'supportSection.description',
    before: 'Smaller systems that prove a specific engineering capability.',
    after: 'Smaller builds, each one testing one specific thing.',
    why: '"prove a specific engineering capability" is corporate filler.'
  },
  {
    id: 'workIndexPage',
    path: 'leadSection.description',
    before: 'Finished client delivery and substantial products.',
    after: 'Finished client work and the larger products.',
    why: '"delivery" and "substantial" are both doing no work.'
  },
  {
    id: 'workIndexPage',
    path: 'seo.description',
    before: 'Websites, digital products, AI systems, and technical architecture built by Hamish Burke.',
    after: 'Client websites, independent products, and technical studies built by Hamish Burke in Wellington, New Zealand.',
    why: 'Third copy of the same laundry list; differentiated it from the About and CV descriptions.'
  },
  {
    id: 'cvPage',
    path: 'hero.headlineLines[1]',
    before: 'Systems thinker.',
    after: 'Wellington, NZ.',
    why: '"Systems thinker" is a LinkedIn cliché and claims something a CV should demonstrate instead.'
  },
  {
    id: 'cvPage',
    path: 'hero.intro',
    before:
      'I work across digital products, AI systems, infrastructure, and the interfaces that make them usable. I’m currently a web developer at Alphero and take on selected independent projects.',
    after: 'I’m a web developer at Alphero, and I take on a small number of independent projects alongside it.',
    why: 'Deleted the laundry-list sentence outright; the second sentence already said the useful part.'
  },
  {
    id: 'cvPage',
    path: 'seo.title',
    before: 'CV — Hamish Burke',
    after: 'CV · Hamish Burke',
    why: 'Em dash in site content, against the repo rule in CLAUDE.md.'
  },
  {
    id: 'writingIndexPage',
    path: 'hero.intro',
    before:
      'Technical explorations, things I have worked out, and questions I have not answered yet. Mostly AI, software systems, and the places where they meet everything else.',
    after: 'Things I have worked out, and things I have not. Mostly AI and software systems.',
    why: 'Two rule-of-threes back to back, ending on "the places where they meet everything else", which means nothing.'
  },
  {
    id: 'writingIndexPage',
    path: 'seo.description',
    before:
      'Essays, technical explorations, and notes on AI, software systems, and the things Hamish Burke is trying to figure out.',
    after: 'Notes on AI and software systems by Hamish Burke, including the things he has not figured out yet.',
    why: 'Nested rule of three.'
  },
  {
    id: 'projectsIndexPage',
    path: 'hero.intro',
    before:
      'Projects I started myself, usually because I wanted to know whether something was possible. Each one says what the question was, what I built, what I learned, and what I would do differently.',
    after:
      'Projects I started myself, usually to find out whether something was possible. Each one says what the question was, what I built, and what I would do differently.',
    why: 'Trimmed the four-part list to match the fields that actually carry the page.'
  },
  {
    id: 'projectsIndexPage',
    path: 'seo.description',
    before:
      'Independent things Hamish Burke has built, each one written up around the question it started from and what it taught him.',
    after: 'Independent projects built by Hamish Burke, each written up around the question that started it.',
    why: '"what it taught him" is a touch precious.'
  },
  {
    id: 'contactPage',
    path: 'hero.intro',
    before:
      'I like hearing about interesting problems and from people working on ambitious things. Email is the surest way to reach me.',
    after: 'I like hearing about problems people are stuck on. Email is the surest way to reach me.',
    why: '"people working on ambitious things" is flattery aimed at nobody in particular.'
  },
  {
    id: 'notFoundPage',
    path: 'body',
    before: "This page doesn't exist. Maybe it was moved, or maybe it never was.",
    after: "This page doesn't exist. It might have moved.",
    why: '"or maybe it never was" is a pseudo-profound flourish on a 404.'
  }
];


// ---------------------------------------------------------------------------
// Reports
//
// The report bodies are PDFs, so `description` is the only prose Sanity holds
// for these. Both render at /reports/[...slug].
// ---------------------------------------------------------------------------

const reports: Edit[] = [
  {
    id: '64644895-0cdc-4c42-a73f-171531516fc4',
    path: 'description',
    before:
      "This project uses Apache Spark to analyse the '1.88 Million US Wildfires' dataset. It provides pipelines for feature engineering, model training, and evaluation on a Hadoop YARN cluster.",
    after:
      "Apache Spark against the '1.88 Million US Wildfires' dataset: feature engineering, model training and evaluation on a Hadoop YARN cluster.",
    why: '"It provides pipelines for" is copula avoidance in front of a list that says the same thing.'
  },
  {
    id: '8b2b8d26-cbbe-462a-abb1-c5f34078f13a',
    path: 'description',
    before:
      'An architecture case study for a small production lab running on a Raspberry Pi 4 Model B. It documents constraints, measurable goals, the high level solution, security posture, backup and recovery procedures, architecture decision records and a practical restore playbook.',
    after:
      'An architecture case study for a small production lab on a Raspberry Pi 4 Model B: the constraints it ran under, the decisions taken, and a restore playbook that was actually tested.',
    why: 'Seven-item laundry list. Kept the three parts a reader would open the PDF for.'
  }
];

// ---------------------------------------------------------------------------
// Work stories
//
// The dominant pattern across all seven: every body H2 is a full declarative
// thesis sentence ("Recovery was tested rather than assumed"), six per page,
// rendered at up to 2.7rem. Identical shape in every document. Headings below
// are cut back to what the section is actually about.
//
// Body headings are addressed by block index rather than path so the Portable
// Text _keys survive untouched.
// ---------------------------------------------------------------------------

/** A Portable Text heading or paragraph rewrite, addressed by position in `body`. */
type BodyEdit = { id: string; block: number; before: string; after: string; why: string };

/**
 * Trailing body blocks deleted outright. `expectHeading` is checked against the
 * live block before the splice, so a cut gets the same drift guard as an edit.
 */
type BodyCut = { id: string; from: number; count: number; expectHeading: string; why: string };

const headingRewrites: BodyEdit[] = [
  // BrontëHF
  { id: 'workStory-brontehf', block: 0, before: 'A designer needed faithful technical delivery', after: 'The brief', why: 'Thesis-sentence heading.' },
  { id: 'workStory-brontehf', block: 2, before: 'The site had to remain Brontë’s to operate', after: 'It had to stay theirs to run', why: 'Thesis-sentence heading.' },
  { id: 'workStory-brontehf', block: 4, before: 'The quiet technical choices mattered most', after: 'The build', why: 'Heading claimed significance instead of naming the section.' },
  { id: 'workStory-brontehf', block: 6, before: 'The result is visible in the public site', after: 'What shipped', why: 'Thesis-sentence heading.' },

  // GPUShare
  { id: 'workStory-gpu-share', block: 0, before: 'Idle hardware suggested a shared service', after: 'A GPU that sits idle most of the day', why: 'Thesis-sentence heading.' },
  { id: 'workStory-gpu-share', block: 2, before: 'The product surface is broader than a model proxy', after: 'More than a model proxy', why: 'Thesis-sentence heading.' },
  { id: 'workStory-gpu-share', block: 4, before: 'The trust boundary is implemented as two FastAPI services', after: 'Two services, one trust boundary', why: 'Thesis-sentence heading.' },
  { id: 'workStory-gpu-share', block: 6, before: 'Local inference and cloud routing are different data paths', after: 'Local and cloud are different paths', why: 'Thesis-sentence heading.' },
  { id: 'workStory-gpu-share', block: 8, before: 'The ledger is exact; the local energy figure is an estimate', after: 'Exact ledger, estimated energy', why: 'Kept the contrast, dropped the semicolon construction.' },
  { id: 'workStory-gpu-share', block: 10, before: 'Rendering is designed for trusted files', after: 'Rendering assumes trusted files', why: 'Thesis-sentence heading.' },
  { id: 'workStory-gpu-share', block: 12, before: 'Setup automation exists, with a current post-split gap', after: 'The installer is currently broken', why: 'Hedged phrasing hiding a plain admission. The plain version is better.' },

  // HealthAgent
  { id: 'workStory-health-agent', block: 0, before: 'The useful signals lived in separate applications', after: 'Two apps, no shared view', why: 'Thesis-sentence heading.' },
  { id: 'workStory-health-agent', block: 2, before: 'Raw data and user boundaries had to survive processing', after: 'Keep the raw exports', why: 'Thesis-sentence heading.' },
  { id: 'workStory-health-agent', block: 4, before: 'The pipeline supports local and cloud operation', after: 'Runs locally or on GCP', why: 'Thesis-sentence heading.' },
  { id: 'workStory-health-agent', block: 6, before: 'The dashboard proves the core path', after: 'The dashboard', why: 'Thesis-sentence heading.' },
  { id: 'workStory-health-agent', block: 8, before: 'Health interpretation needs restraint', after: 'What this is not', why: 'Thesis-sentence heading.' },

  // Home Lab
  { id: 'workStory-home-lab', block: 0, before: 'One small machine had production-like responsibilities', after: 'One Raspberry Pi, real responsibilities', why: 'Thesis-sentence heading.' },
  { id: 'workStory-home-lab', block: 2, before: 'Resource and recovery constraints shaped every decision', after: '8GB, no port forwarding, small budget', why: 'Abstract heading replaced with the actual constraints.' },
  { id: 'workStory-home-lab', block: 4, before: 'Simple orchestration fit the actual topology', after: 'Compose, not Kubernetes', why: 'Thesis-sentence heading.' },
  { id: 'workStory-home-lab', block: 6, before: 'Recovery was tested rather than assumed', after: 'I actually ran the restore', why: 'Thesis-sentence heading, and the first person is truer to what happened.' },

  // Wildfire
  { id: 'workStory-wildfire', block: 0, before: 'The assignment tested scale and imbalance together', after: '1.88 million records, seven very uneven classes', why: 'Abstract heading replaced with the numbers.' },
  { id: 'workStory-wildfire', block: 2, before: 'Leakage and class frequency could invalidate the result', after: 'Removing the leakage', why: 'Thesis-sentence heading.' },
  { id: 'workStory-wildfire', block: 4, before: 'Each experiment isolated a trade-off', after: 'The model comparison', why: 'Thesis-sentence heading.' },
  { id: 'workStory-wildfire', block: 6, before: 'Rare-event recall exposed the model’s weakness', after: 'Where it fell over', why: 'Thesis-sentence heading.' },
  { id: 'workStory-wildfire', block: 8, before: 'The honest result is a failed production trade-off', after: 'The trade-off does not work', why: 'Calling your own result "honest" undercuts it. State the result.' },

  // Sprint Coach: already largely written by hand, so only the preachy one moves
  { id: 'workStory-sprint-coach', block: 2, before: 'Credibility had to come from what is true', after: 'No invented numbers', why: 'Sermon-shaped heading; the section is about one concrete rule.' },

  // You Inc: already largely written by hand
  { id: 'workStory-you-inc', block: 0, before: 'Budgeting was not the model I needed', after: 'Budgeting was the wrong model', why: 'Negative construction shortened.' },
  { id: 'workStory-you-inc', block: 2, before: 'The account flow is fully implemented', after: 'Accounts and sign-in', why: '"is fully implemented" is defensive; the section describes it either way.' },
  { id: 'workStory-you-inc', block: 4, before: 'Akahu is an implemented OAuth2 connection', after: 'Connecting a bank', why: 'As above.' },
  { id: 'workStory-you-inc', block: 8, before: 'Isolation is enforced at the database', after: 'Isolation happens at the database', why: 'Softened the passive.' },
  { id: 'workStory-you-inc', block: 10, before: 'The screenshot is the working demo', after: 'About that screenshot', why: 'Thesis-sentence heading.' }
];

const bodyRewrites: BodyEdit[] = [
  {
    id: 'workStory-brontehf',
    block: 1,
    before:
      'Brontë supplied the visual direction and project material. My responsibility was to turn that direction into a reliable, responsive public portfolio without claiming authorship of the design.',
    after:
      'Brontë designed it. I built it. The direction and all the project material came from them; my job was getting it onto the web without claiming the design.',
    why: '"My responsibility was to" is copula avoidance. Shorter and plainer.'
  },
  {
    id: 'workStory-brontehf',
    block: 3,
    before:
      'A finished portfolio was not enough if every content update required a developer. The content model and release path had to support direct editing without making the front end feel like a template.',
    after:
      'A finished portfolio is not much use if every text change needs me. So the content had to come out of the code into something Brontë could edit, without the front end becoming a template.',
    why: 'Abstract nouns ("content model", "release path") swapped for what actually happens.'
  },
  {
    id: 'workStory-brontehf',
    block: 5,
    before:
      'I used Astro for a fast, low-JavaScript front end, Decap CMS for project and page editing, and GitHub Actions to check each release. Components preserve the editorial system while content stays independent.',
    after:
      'Astro for a fast front end, Decap CMS so Brontë can edit projects and pages, GitHub Actions to check each release. The components hold the design; the content sits outside them.',
    why: 'Final sentence was abstract to the point of meaninglessness.'
  },
  {
    id: 'workStory-gpu-share',
    block: 1,
    before:
      'A desktop GPU used for gaming, rendering, and local inference sits idle for long periods. GPUShare turns that spare capacity into a self-hosted service for a trusted group, while keeping the home machine’s intermittent availability visible rather than pretending it is managed cloud infrastructure.',
    after:
      'My desktop GPU sits idle most of the day. GPUShare turns that spare capacity into something a trusted group can use, without pretending to be cloud infrastructure: when the machine is off, the interface says so.',
    why: 'Third person about his own desk; one 45-word sentence split into three.'
  },
  {
    id: 'workStory-health-agent',
    block: 9,
    before:
      'The project demonstrates data engineering and product thinking. It should not imply clinical validation, diagnosis, or that generated recommendations are complete health advice.',
    after:
      'This is a data pipeline, not a medical tool. Nothing in it is clinically validated, and the generated suggestions are not health advice.',
    why: '"demonstrates data engineering and product thinking" is a portfolio claim, not a caveat.'
  },
  {
    id: 'workStory-wildfire',
    block: 9,
    before:
      'The study demonstrates distributed experimentation and careful evaluation, not a deployable wildfire predictor. Improving a rare metric is not useful when false positives become overwhelming.',
    after:
      'A study in distributed experimentation, not a wildfire predictor anyone should deploy. Raising recall on a rare class is worth nothing if the false positives bury you.',
    why: '"demonstrates... careful evaluation" is self-assessment. The second sentence gets a concrete verb.'
  },
  {
    id: 'workStory-you-inc',
    block: 1,
    before:
      'I wanted a coherent view of what I own, owe, earn, and spend—not another set of envelopes or a spreadsheet that depended on manual upkeep. That required a real accounting model and a product people could securely use for themselves.',
    after:
      'I wanted a coherent view of what I own, owe, earn and spend. Not another set of envelopes, and not a spreadsheet that falls over the moment I stop maintaining it. That needed a real accounting model underneath.',
    why: 'Em dash, against the repo rule in CLAUDE.md. Also dropped the now-false "product people could securely use for themselves", since the commercial layer was removed.'
  }
];

/** Sections deleted outright: both are closing paragraphs that praise the work rather than describe it. */
const bodyCuts: BodyCut[] = [
  {
    id: 'workStory-brontehf',
    from: 8,
    count: 2,
    expectHeading: 'Good delivery keeps the client in focus',
    why: '"Good delivery keeps the client in focus" / "The strongest part of this work is not a flashy framework decision. It is that...". Contrastive negation wrapped around a rule of three, and it tells the reader what to think about the work instead of describing it.'
  },
  {
    id: 'workStory-home-lab',
    from: 8,
    count: 2,
    expectHeading: 'Architecture evidence includes operations',
    why: '"Architecture evidence includes operations" / "The useful proof is not the number of services. It is the connection between constraints, decisions, measurable limits, and a recovery process that was actually exercised." Same pattern. The restore time and the backup cost already made this point.'
  }
];

// ---------------------------------------------------------------------------
// Work story snapshot fields
//
// `interventions` was three items in every one of the seven stories, each a
// past-tense verb-first clause of near-identical length. The count is left
// alone where three is honest, but the parallelism is broken so the list reads
// like notes rather than generated output.
// ---------------------------------------------------------------------------

const storyFields: Edit[] = [
  {
    id: 'workStory-brontehf',
    path: 'interventions[0]',
    before: 'Translated the supplied visual direction into responsive editorial layouts.',
    after: 'Built Brontë’s design out as responsive editorial layouts.',
    why: '"Translated the supplied visual direction" is three abstractions for "built the design".'
  },
  {
    id: 'workStory-brontehf',
    path: 'interventions[1]',
    before: 'Separated project content from code with an editor-friendly CMS.',
    after: 'Content lives in a CMS they edit themselves, not in the code.',
    why: 'Breaks the verb-first parallelism running down the list.'
  },
  {
    id: 'workStory-brontehf',
    path: 'interventions[2]',
    before: 'Automated linting, building, and auditing before deployment.',
    after: 'CI lints, builds and audits every release before it goes out.',
    why: 'As above.'
  },
  {
    id: 'workStory-brontehf',
    path: 'role',
    before: 'Implementation, responsive refinement, CMS integration, and technical delivery.',
    after: 'Build, responsive work and CMS integration. The design was Brontë’s.',
    why: '"technical delivery" means nothing next to the three items before it.'
  },
  {
    id: 'workStory-brontehf',
    path: 'result',
    before: 'A complete live portfolio with public authorship credit and a publishing workflow Brontë can use directly.',
    after: 'A live portfolio with a footer credit and a publishing workflow Brontë uses without me.',
    why: '"public authorship credit" is a grand name for a footer line.'
  },
  {
    id: 'workStory-gpu-share',
    path: 'role',
    before:
      'Solo engineer across product design, React/FastAPI delivery, distributed architecture, GPU integration, usage accounting, and setup automation.',
    after: 'Solo engineer. Product, React and FastAPI, the GPU integration, the accounting, and the setup scripts.',
    why: 'Six-item laundry list in one sentence.'
  },
  {
    id: 'workStory-gpu-share',
    path: 'learned',
    before:
      'The trust boundary was the design. Separating public routes from hardware operations mattered more than any feature, and it made clear how much of the cost story is allocation estimate rather than measurement.',
    after:
      'The trust boundary was the design. Separating public routes from hardware operations mattered more than any feature I built, and it showed me how much of the cost figure is allocation rather than measurement.',
    why: 'Mostly kept: this one already reads like him. Only "the cost story" needed replacing.'
  },
  {
    id: 'workStory-health-agent',
    path: 'role',
    before: 'Solo engineer across ingestion, normalisation, API, dashboard, authentication, and cloud deployment.',
    after: 'Solo engineer. Ingestion through to the dashboard, auth and cloud deploy included.',
    why: 'Six-item laundry list.'
  },
  {
    id: 'workStory-health-agent',
    path: 'interventions[0]',
    before: 'Preserved raw exports before converting them into canonical tables.',
    after: 'Kept the raw exports so the history could be reprocessed later.',
    why: '"Preserved" and "canonical" are stiffer than needed; the reason matters more than the action.'
  },
  {
    id: 'workStory-health-agent',
    path: 'interventions[2]',
    before: 'Scheduled daily processing while keeping generated insights optional.',
    after: 'Daily processing runs on a schedule; the generated insights stay optional.',
    why: 'Breaks the verb-first parallelism.'
  },
  {
    id: 'workStory-wildfire',
    path: 'role',
    before:
      'Individual university-project author responsible for preprocessing, feature engineering, distributed training, and evaluation.',
    after: 'University project, done solo: preprocessing, features, training and evaluation.',
    why: '"Individual university-project author responsible for" is seven words of throat-clearing.'
  },
  {
    id: 'workStory-home-lab',
    path: 'interventions[1]',
    before: 'Budgeted memory explicitly across more than eleven containers.',
    after: 'Every container got an explicit memory limit, eleven of them and counting.',
    why: 'Breaks the verb-first parallelism.'
  },
  {
    id: 'workStory-you-inc',
    path: 'learned',
    before:
      'The accounting model had to come first — once every posting balances and anything uncertain sits in suspense for review, the dashboards stop being opinions and become derived views of one source of truth. The harder lesson came later: I had built the whole apparatus of a SaaS around it, and holding other people’s bank credentials is a real obligation, not a feature. Removing it was a bigger improvement than anything I added.',
    after:
      'The accounting model had to come first. Once every posting balances and anything uncertain sits in suspense for review, the dashboards stop being opinions and become derived views of one source of truth. The harder lesson came later: I had built the whole apparatus of a SaaS around it, and holding other people’s bank credentials is a real obligation, not a feature. Removing it was a bigger improvement than anything I added.',
    why: 'Em dash only. The rest is the best-written paragraph on the site and is left alone.'
  },
  {
    id: 'workStory-you-inc',
    path: 'summary',
    before:
      'Built a personal-finance ERP — double-entry ledger, Akahu bank sync, configurable dashboards — then took the commercial layer back out and made it self-hosted and MIT licensed.',
    after:
      'Built a personal-finance ERP with a double-entry ledger, Akahu bank sync and configurable dashboards, then took the commercial layer back out and made it self-hosted and MIT licensed.',
    why: 'Two em dashes, against the repo rule in CLAUDE.md.'
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

/** Resolves a dot/bracket path like `hero.links[0].label` against a document. */
function readPath(doc: unknown, path: string): unknown {
  return path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .reduce<unknown>((node, key) => (node == null ? undefined : (node as Record<string, unknown>)[key]), doc);
}

const allEdits: Edit[] = [...homePage, ...aboutPage, ...indexPages, ...reports, ...storyFields];
const allBodyEdits: BodyEdit[] = [...headingRewrites, ...bodyRewrites];
const ids = [...new Set([...allEdits, ...allBodyEdits, ...bodyCuts].map((e) => e.id))];

const docs: Record<string, any> = Object.fromEntries(
  (await client.fetch<any[]>('*[_id in $ids]', { ids })).map((d) => [d._id, d])
);

let drift = 0;
let planned = 0;
const patches: { id: string; set?: Record<string, unknown>; body?: unknown[] }[] = [];

for (const id of ids) {
  const doc = docs[id];
  if (!doc) {
    console.error(`MISSING DOCUMENT: ${id}`);
    drift++;
    continue;
  }

  const set: Record<string, unknown> = {};
  for (const edit of allEdits.filter((e) => e.id === id)) {
    const live = readPath(doc, edit.path);
    if (live !== edit.before) {
      console.error(`DRIFT  ${id} :: ${edit.path}\n  audit: ${edit.before}\n  live : ${live}\n`);
      drift++;
      continue;
    }
    set[edit.path] = edit.after;
    planned++;
  }

  // Body rewrites and cuts are applied to a copy of the array, then set whole,
  // so Portable Text _keys and mark definitions survive untouched.
  const bodyEdits = allBodyEdits.filter((e) => e.id === id);
  const cuts = bodyCuts.filter((c) => c.id === id);
  let body: any[] | undefined;

  if (bodyEdits.length || cuts.length) {
    body = JSON.parse(JSON.stringify(doc.body ?? []));
    for (const edit of bodyEdits) {
      const live = body![edit.block]?.children?.[0]?.text;
      if (live !== edit.before) {
        console.error(`DRIFT  ${id} :: body[${edit.block}]\n  audit: ${edit.before}\n  live : ${live}\n`);
        drift++;
        continue;
      }
      body![edit.block].children[0].text = edit.after;
      planned++;
    }
    // Cut last so earlier block indices stay valid.
    for (const cut of [...cuts].sort((a, b) => b.from - a.from)) {
      const live = body![cut.from]?.children?.[0]?.text;
      if (live !== cut.expectHeading) {
        console.error(`DRIFT  ${id} :: body[${cut.from}] (cut)\n  audit: ${cut.expectHeading}\n  live : ${live}\n`);
        drift++;
        continue;
      }
      body!.splice(cut.from, cut.count);
      planned++;
    }
  }

  patches.push({ id, set: Object.keys(set).length ? set : undefined, body });
}

console.log(`\n${planned} edits planned across ${ids.length} documents. ${drift} drifted.`);

if (drift) {
  console.error('\nRefusing to write: live copy has changed since the audit. Re-run the audit first.');
  process.exit(1);
}

if (!apply) {
  console.log('Dry run. Re-run with --apply to write.');
  process.exit(0);
}

const tx = client.transaction();
for (const patch of patches) {
  // Safe to merge: `body` is Portable Text on every document that has block
  // edits, and the only document with a plain-string `body` (notFoundPage) has
  // none, so the two never collide on the same key.
  const set = { ...(patch.set ?? {}), ...(patch.body ? { body: patch.body } : {}) };
  if (Object.keys(set).length) tx.patch(patch.id, (p) => p.set(set));
}
await tx.commit();

// Array-index patch paths can no-op rather than throw, so read everything back
// and assert it actually landed.
const after: Record<string, any> = Object.fromEntries(
  (await client.fetch<any[]>('*[_id in $ids]', { ids })).map((d) => [d._id, d])
);

let confirmed = 0;
let failed = 0;
for (const edit of allEdits) {
  if (readPath(after[edit.id], edit.path) === edit.after) confirmed++;
  else {
    console.error(`NOT WRITTEN  ${edit.id} :: ${edit.path}`);
    failed++;
  }
}
for (const edit of allBodyEdits) {
  const cut = bodyCuts.find((c) => c.id === edit.id);
  const shift = cut && edit.block > cut.from ? cut.count : 0;
  if (after[edit.id]?.body?.[edit.block - shift]?.children?.[0]?.text === edit.after) confirmed++;
  else {
    console.error(`NOT WRITTEN  ${edit.id} :: body[${edit.block}]`);
    failed++;
  }
}
for (const cut of bodyCuts) {
  const body = after[cut.id]?.body ?? [];
  if (body.length === (docs[cut.id].body?.length ?? 0) - cut.count) confirmed++;
  else {
    console.error(`NOT WRITTEN  ${cut.id} :: cut at body[${cut.from}]`);
    failed++;
  }
}

console.log(`\nVerified ${confirmed}/${confirmed + failed} edits against the live documents.`);
if (failed) {
  console.error('Some edits did not land. Re-run the dry run to see the current state.');
  process.exit(1);
}
console.log('Trigger a Netlify build to publish.');
