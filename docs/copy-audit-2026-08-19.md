# Copy audit, 19 August 2026

A pass over the copy on the site, looking for writing that reads as
machine-generated and for fluff that can come out. 100 edits: 93 in Sanity,
applied and verified, plus 5 to template files still uncommitted in the working
tree. The copy that changed on the
pages and work stories is about 15% shorter.

All of it lives in Sanity, not in the templates. `scripts/copy-humanise.ts` holds
the same edits listed here and applies them:

```
pnpm exec tsx scripts/copy-humanise.ts --apply         # 84/84 verified
pnpm exec tsx scripts/copy-humanise-posts.ts --apply   # 9/9 verified
```

The blog posts were done as a second pass in `scripts/copy-humanise-posts.ts`,
using substring replacement inside `markdownBody` so the technical detail and
every number stayed untouched. A re-dump of the live dataset afterwards found
zero em dashes left in Sanity content. A later sweep of the built HTML caught
two more in `WorkGraphic.astro` alt text, which screen readers read aloud.

The scripts re-read every live value first and refuses to write if anything has
changed in Studio since this audit, then reads the documents back afterwards to
confirm each edit actually landed. Page-singleton edits are mirrored into
`scripts/seed-page-copy.ts`, which writes by fixed document ID and would
otherwise revert them the next time `seed:copy` runs.

## The patterns that showed up

**Thesis-sentence headings.** Every `h2` in every work story is a full
declarative sentence: "Recovery was tested rather than assumed", "The honest
result is a failed production trade-off", "Credibility had to come from what is
true". Six per page, seven pages, identical shape, rendered at up to 2.7rem.
This is the loudest tell on the site. Headings now name the section instead.

**Rule of three.** Lists arrive in threes almost everywhere. `interventions` is
exactly three items in all seven stories, each a past-tense verb-first clause of
matching length. "Three things I keep coming back to" announces the count and
then supplies it. The counts stay where three is honest; the parallelism is
broken so the lists read like notes.

**Laundry lists.** "digital products, AI systems, infrastructure, and the
interfaces that make them usable" appeared in three near-identical variants
across About, CV and Work, including in the meta descriptions, where they were
competing with each other in search. The Home Lab report description ran to
seven items in one sentence.

**Closing paragraphs that praise the work.** Two stories ended on "The strongest
part of this work is not X. It is Y" and "The useful proof is not X. It is Y".
Contrastive negation wrapped around a rule of three, telling the reader what to
think instead of describing what happened. Both sections are deleted.

**Copula avoidance and abstraction.** "My responsibility was to turn that
direction into...", "They serve as essential counterweights to...", "It provides
pipelines for...", "prove a specific engineering capability".

**Repo rule violations found along the way.** Four em dashes in live copy,
against the rule in `CLAUDE.md`, plus one in the CV page title.

## What was reviewed and left alone

- **Sprint Coach and You Inc** already read like a person wrote them, so they
  get the em dash fixes and a couple of headings, nothing more. The You Inc
  `learned` paragraph is the best writing on the site and only loses one
  punctuation mark.
- **Every number stays exactly as it was**: the 1h45m restore, $2.82 a month,
  96GB, 0.7518 recall against 0.0099 precision, 32% accuracy, 1.88 million
  records, 52.55s to 27.14s. Those are the most human thing in the corpus.
- **The 12 `book` documents** carry no prose at all. Title, author, cover, link
  and status, and the reading page supplies its own headings. Nothing to audit.
- **`siteSettings`** is nav labels plus the footer tagline, "Building things and
  writing about them, from Wellington, NZ." That one is fine as it is.
- **The `aphorism` document** ("On the ordinary absurd") has a subtitle worth
  changing, "A reflection on life's inherent contradictions", but nothing in
  `src/` references the type, so it does not render. Left alone.
- **The blog posts** got a voice pass only. Their technical content, code
  blocks and every figure are untouched; see the list at the end of this file.

---

## Home page

<small>`homePage`</small>

### `interests.statement`

Rule of three, and it restated the three cards rendered directly beneath it. Replaced with an opinion rather than a mood.

> **Before.** I care about how things work, how those things interact once they’re part of something bigger, and what’s actually worth building in the first place.

> **After.** I mostly want to know why a thing was built the way it was.

### `currently.body`

Cut the "designed, built, and produced" triple; contractions to match how he speaks.

> **Before.** I’m working as a junior software developer at Alphero, where I’m learning how software gets designed, built, and produced for real organisations. That is the part you cannot get from side projects alone, and it is most of what I am doing right now.

> **After.** I’m a junior developer at Alphero, learning how software actually gets built for real organisations. That’s the part side projects don’t teach you, and it’s most of what I’m doing right now.

### `hero.lede`

Trimmed a rule of three down to the two claims that carry weight.

> **Before.** I build things I want to exist, and I publish them. The code is publicly readable, the write-ups say what did not work, and you can run most of it yourself.

> **After.** I build things I want to exist, and I publish them. The code is public and the write-ups say what didn’t work.

### `seo.description`

"the problems worth solving" is stock phrasing; replaced with the site’s actual differentiator.

> **Before.** Software developer in Wellington, New Zealand. I build things in the open and write about technology, AI, systems, and the problems worth solving.

> **After.** Software developer in Wellington, New Zealand. I build things in the open and write up what happened, including what did not work.

## About page

<small>`aboutPage`</small>

### `hero.intro`

Dropped the middle item of a three-part colon list; the AI clause was the weakest of the three.

> **Before.** I’m Hamish. I build software, and I am mostly interested in what happens at the edges of it: how organisations actually decide things, where AI genuinely changes what is possible, and which problems are worth the effort. I am early in working that out.

> **After.** I’m Hamish. I build software, and I’m mostly interested in what happens at the edges of it: how organisations actually decide things, and which problems are worth the effort. I’m early in working that out.

### `capabilities.heading`

Announcing the count is what forces the rule of three.

> **Before.** Three things I keep coming back to.

> **After.** Things I keep coming back to.

### `capabilities.items[0].body`

"survives contact with real use" is a worn-out metaphor; split into a claim that says something.

> **Before.** Interfaces, content systems, and integrations, plus the release path that decides whether any of it survives contact with real use.

> **After.** Interfaces, content systems, integrations, and the release path. The release path usually decides whether the rest of it holds up.

### `capabilities.items[1].body`

Second sentence was already good; only the list punctuation needed loosening.

> **Before.** Data models, APIs, infrastructure, and trust boundaries. I find the constraints more interesting than the features.

> **After.** Data models, APIs, infrastructure, trust boundaries. I find the constraints more interesting than the features.

### `capabilities.items[2].body`

Kept the one specific clause and deleted the two abstract ones in front of it.

> **Before.** Visible trade-offs, honest limits, and results reported as they came out rather than as I would have liked them to.

> **After.** Reporting results as they came out rather than as I would have liked them to.

### `background.paragraphs[0]`

Significance inflation ("sharpened how I frame...") plus a rule of three. Kept the item that was actually concrete.

> **Before.** I completed a Master of Computer Science at Victoria University of Wellington. My thesis studied diffusion-based anomaly detection for electrical distribution networks. That work sharpened how I frame uncertain problems, evaluate evidence, and separate an interesting result from a useful one.

> **After.** I did a Master of Computer Science at Victoria University of Wellington. My thesis was on diffusion-based anomaly detection for electrical distribution networks. Mostly it taught me the difference between an interesting result and a useful one.

### `background.paragraphs[1]`

"serve as essential counterweights" is copula avoidance plus a flourish. The second sentence added nothing.

> **Before.** Outside software, I’m working on making more time for reading, playing the piano, and getting away from screens. They serve as essential counterweights to a day spent entirely in code and abstractions.

> **After.** Outside software I’m trying to make more time for reading, the piano, and being away from a screen.

### `portrait.body`

"enough evidence to inspect and enough limitations to be worth reading" is precious parallelism.

> **Before.** This site deliberately excludes NDA-covered client work. What is here is what I can discuss honestly: things I built myself, finished freelance delivery, and technical studies with enough evidence to inspect and enough limitations to be worth reading.

> **After.** There’s no NDA-covered client work on this site. What’s here is what I can talk about honestly: things I built myself, finished freelance work, and technical studies where the limitations are written down alongside the results.

### `seo.description`

Same four-item laundry list appeared on About, CV and Work. Replaced with a fact.

> **Before.** Software engineer in Wellington working across digital products, AI systems, infrastructure, and the interfaces that make them useful.

> **After.** Hamish Burke is a web developer at Alphero in Wellington, New Zealand, who builds and writes up independent projects.

## Work index

<small>`workIndexPage`</small>

### `hero.headlineLines[0]`

"Useful systems, built properly" is an empty claim of exactly the kind an AI generator produces.

> **Before.** Useful systems,

> **After.** What I’ve

### `hero.headlineLines[1]`

See above.

> **Before.** built properly.

> **After.** shipped.

### `hero.intro`

Four-item buzzword list plus a "not just X" contrastive.

> **Before.** Client websites, digital products, AI systems, and technical architecture. Each story starts with what changed, not just a list of tools.

> **After.** Client websites, products I built for myself, and a few technical studies. Each one says what the problem was and what happened.

### `supportSection.description`

"prove a specific engineering capability" is corporate filler.

> **Before.** Smaller systems that prove a specific engineering capability.

> **After.** Smaller builds, each one testing one specific thing.

### `leadSection.description`

"delivery" and "substantial" are both doing no work.

> **Before.** Finished client delivery and substantial products.

> **After.** Finished client work and the larger products.

### `seo.description`

Third copy of the same laundry list; differentiated it from the About and CV descriptions.

> **Before.** Websites, digital products, AI systems, and technical architecture built by Hamish Burke.

> **After.** Client websites, independent products, and technical studies built by Hamish Burke in Wellington, New Zealand.

## Projects index

<small>`projectsIndexPage`</small>

### `hero.intro`

Trimmed the four-part list to match the fields that actually carry the page.

> **Before.** Projects I started myself, usually because I wanted to know whether something was possible. Each one says what the question was, what I built, what I learned, and what I would do differently.

> **After.** Projects I started myself, usually to find out whether something was possible. Each one says what the question was, what I built, and what I would do differently.

### `seo.description`

"what it taught him" is a touch precious.

> **Before.** Independent things Hamish Burke has built, each one written up around the question it started from and what it taught him.

> **After.** Independent projects built by Hamish Burke, each written up around the question that started it.

## Writing index

<small>`writingIndexPage`</small>

### `hero.intro`

Two rule-of-threes back to back, ending on "the places where they meet everything else", which means nothing.

> **Before.** Technical explorations, things I have worked out, and questions I have not answered yet. Mostly AI, software systems, and the places where they meet everything else.

> **After.** Things I have worked out, and things I have not. Mostly AI and software systems.

### `seo.description`

Nested rule of three.

> **Before.** Essays, technical explorations, and notes on AI, software systems, and the things Hamish Burke is trying to figure out.

> **After.** Notes on AI and software systems by Hamish Burke, including the things he has not figured out yet.

## CV page

<small>`cvPage`</small>

### `hero.headlineLines[1]`

"Systems thinker" is a LinkedIn cliché and claims something a CV should demonstrate instead.

> **Before.** Systems thinker.

> **After.** Wellington, NZ.

### `hero.intro`

Deleted the laundry-list sentence outright; the second sentence already said the useful part.

> **Before.** I work across digital products, AI systems, infrastructure, and the interfaces that make them usable. I’m currently a web developer at Alphero and take on selected independent projects.

> **After.** I’m a web developer at Alphero, and I take on a small number of independent projects alongside it.

### `seo.title`

Em dash in site content, against the repo rule in CLAUDE.md.

> **Before.** CV — Hamish Burke

> **After.** CV · Hamish Burke

## Contact page

<small>`contactPage`</small>

### `hero.intro`

"people working on ambitious things" is flattery aimed at nobody in particular.

> **Before.** I like hearing about interesting problems and from people working on ambitious things. Email is the surest way to reach me.

> **After.** I like hearing about problems people are stuck on. Email is the surest way to reach me.

## 404 page

<small>`notFoundPage`</small>

### `body`

"or maybe it never was" is a pseudo-profound flourish on a 404.

> **Before.** This page doesn't exist. Maybe it was moved, or maybe it never was.

> **After.** This page doesn't exist. It might have moved.

## Work story: BrontëHF

<small>`workStory-brontehf`</small>

### `body[0]`

Thesis-sentence heading.

> **Before.** A designer needed faithful technical delivery

> **After.** The brief

### `body[1]`

"My responsibility was to" is copula avoidance. Shorter and plainer.

> **Before.** Brontë supplied the visual direction and project material. My responsibility was to turn that direction into a reliable, responsive public portfolio without claiming authorship of the design.

> **After.** Brontë designed it. I built it. The direction and all the project material came from them; my job was getting it onto the web without claiming the design.

### `body[2]`

Thesis-sentence heading.

> **Before.** The site had to remain Brontë’s to operate

> **After.** It had to stay theirs to run

### `body[3]`

Abstract nouns ("content model", "release path") swapped for what actually happens.

> **Before.** A finished portfolio was not enough if every content update required a developer. The content model and release path had to support direct editing without making the front end feel like a template.

> **After.** A finished portfolio is not much use if every text change needs me. So the content had to come out of the code into something Brontë could edit, without the front end becoming a template.

### `body[4]`

Heading claimed significance instead of naming the section.

> **Before.** The quiet technical choices mattered most

> **After.** The build

### `body[5]`

Final sentence was abstract to the point of meaninglessness.

> **Before.** I used Astro for a fast, low-JavaScript front end, Decap CMS for project and page editing, and GitHub Actions to check each release. Components preserve the editorial system while content stays independent.

> **After.** Astro for a fast front end, Decap CMS so Brontë can edit projects and pages, GitHub Actions to check each release. The components hold the design; the content sits outside them.

### `body[6]`

Thesis-sentence heading.

> **Before.** The result is visible in the public site

> **After.** What shipped

### `body[8]` and the block after it, deleted

Heading was "Good delivery keeps the client in focus".

"Good delivery keeps the client in focus" / "The strongest part of this work is not a flashy framework decision. It is that...". Contrastive negation wrapped around a rule of three, and it tells the reader what to think about the work instead of describing it.

### `interventions[0]`

"Translated the supplied visual direction" is three abstractions for "built the design".

> **Before.** Translated the supplied visual direction into responsive editorial layouts.

> **After.** Built Brontë’s design out as responsive editorial layouts.

### `interventions[1]`

Breaks the verb-first parallelism running down the list.

> **Before.** Separated project content from code with an editor-friendly CMS.

> **After.** Content lives in a CMS they edit themselves, not in the code.

### `interventions[2]`

As above.

> **Before.** Automated linting, building, and auditing before deployment.

> **After.** CI lints, builds and audits every release before it goes out.

### `role`

"technical delivery" means nothing next to the three items before it.

> **Before.** Implementation, responsive refinement, CMS integration, and technical delivery.

> **After.** Build, responsive work and CMS integration. The design was Brontë’s.

### `result`

"public authorship credit" is a grand name for a footer line.

> **Before.** A complete live portfolio with public authorship credit and a publishing workflow Brontë can use directly.

> **After.** A live portfolio with a footer credit and a publishing workflow Brontë uses without me.

## Work story: Sprint Coach

<small>`workStory-sprint-coach`</small>

### `body[2]`

Sermon-shaped heading; the section is about one concrete rule.

> **Before.** Credibility had to come from what is true

> **After.** No invented numbers

## Work story: You Inc

<small>`workStory-you-inc`</small>

### `body[0]`

Negative construction shortened.

> **Before.** Budgeting was not the model I needed

> **After.** Budgeting was the wrong model

### `body[1]`

Em dash, against the repo rule in CLAUDE.md. Also dropped the now-false "product people could securely use for themselves", since the commercial layer was removed.

> **Before.** I wanted a coherent view of what I own, owe, earn, and spend—not another set of envelopes or a spreadsheet that depended on manual upkeep. That required a real accounting model and a product people could securely use for themselves.

> **After.** I wanted a coherent view of what I own, owe, earn and spend. Not another set of envelopes, and not a spreadsheet that falls over the moment I stop maintaining it. That needed a real accounting model underneath.

### `body[2]`

"is fully implemented" is defensive; the section describes it either way.

> **Before.** The account flow is fully implemented

> **After.** Accounts and sign-in

### `body[4]`

As above.

> **Before.** Akahu is an implemented OAuth2 connection

> **After.** Connecting a bank

### `body[8]`

Softened the passive.

> **Before.** Isolation is enforced at the database

> **After.** Isolation happens at the database

### `body[10]`

Thesis-sentence heading.

> **Before.** The screenshot is the working demo

> **After.** About that screenshot

### `learned`

Em dash only. The rest is the best-written paragraph on the site and is left alone.

> **Before.** The accounting model had to come first — once every posting balances and anything uncertain sits in suspense for review, the dashboards stop being opinions and become derived views of one source of truth. The harder lesson came later: I had built the whole apparatus of a SaaS around it, and holding other people’s bank credentials is a real obligation, not a feature. Removing it was a bigger improvement than anything I added.

> **After.** The accounting model had to come first. Once every posting balances and anything uncertain sits in suspense for review, the dashboards stop being opinions and become derived views of one source of truth. The harder lesson came later: I had built the whole apparatus of a SaaS around it, and holding other people’s bank credentials is a real obligation, not a feature. Removing it was a bigger improvement than anything I added.

### `summary`

Two em dashes, against the repo rule in CLAUDE.md.

> **Before.** Built a personal-finance ERP — double-entry ledger, Akahu bank sync, configurable dashboards — then took the commercial layer back out and made it self-hosted and MIT licensed.

> **After.** Built a personal-finance ERP with a double-entry ledger, Akahu bank sync and configurable dashboards, then took the commercial layer back out and made it self-hosted and MIT licensed.

## Work story: GPUShare

<small>`workStory-gpu-share`</small>

### `body[0]`

Thesis-sentence heading.

> **Before.** Idle hardware suggested a shared service

> **After.** A GPU that sits idle most of the day

### `body[1]`

Third person about his own desk; one 45-word sentence split into three.

> **Before.** A desktop GPU used for gaming, rendering, and local inference sits idle for long periods. GPUShare turns that spare capacity into a self-hosted service for a trusted group, while keeping the home machine’s intermittent availability visible rather than pretending it is managed cloud infrastructure.

> **After.** My desktop GPU sits idle most of the day. GPUShare turns that spare capacity into something a trusted group can use, without pretending to be cloud infrastructure: when the machine is off, the interface says so.

### `body[2]`

Thesis-sentence heading.

> **Before.** The product surface is broader than a model proxy

> **After.** More than a model proxy

### `body[4]`

Thesis-sentence heading.

> **Before.** The trust boundary is implemented as two FastAPI services

> **After.** Two services, one trust boundary

### `body[6]`

Thesis-sentence heading.

> **Before.** Local inference and cloud routing are different data paths

> **After.** Local and cloud are different paths

### `body[8]`

Kept the contrast, dropped the semicolon construction.

> **Before.** The ledger is exact; the local energy figure is an estimate

> **After.** Exact ledger, estimated energy

### `body[10]`

Thesis-sentence heading.

> **Before.** Rendering is designed for trusted files

> **After.** Rendering assumes trusted files

### `body[12]`

Hedged phrasing hiding a plain admission. The plain version is better.

> **Before.** Setup automation exists, with a current post-split gap

> **After.** The installer is currently broken

### `role`

Six-item laundry list in one sentence.

> **Before.** Solo engineer across product design, React/FastAPI delivery, distributed architecture, GPU integration, usage accounting, and setup automation.

> **After.** Solo engineer. Product, React and FastAPI, the GPU integration, the accounting, and the setup scripts.

### `learned`

Mostly kept: this one already reads like him. Only "the cost story" needed replacing.

> **Before.** The trust boundary was the design. Separating public routes from hardware operations mattered more than any feature, and it made clear how much of the cost story is allocation estimate rather than measurement.

> **After.** The trust boundary was the design. Separating public routes from hardware operations mattered more than any feature I built, and it showed me how much of the cost figure is allocation rather than measurement.

## Work story: HealthAgent

<small>`workStory-health-agent`</small>

### `body[0]`

Thesis-sentence heading.

> **Before.** The useful signals lived in separate applications

> **After.** Two apps, no shared view

### `body[2]`

Thesis-sentence heading.

> **Before.** Raw data and user boundaries had to survive processing

> **After.** Keep the raw exports

### `body[4]`

Thesis-sentence heading.

> **Before.** The pipeline supports local and cloud operation

> **After.** Runs locally or on GCP

### `body[6]`

Thesis-sentence heading.

> **Before.** The dashboard proves the core path

> **After.** The dashboard

### `body[8]`

Thesis-sentence heading.

> **Before.** Health interpretation needs restraint

> **After.** What this is not

### `body[9]`

"demonstrates data engineering and product thinking" is a portfolio claim, not a caveat.

> **Before.** The project demonstrates data engineering and product thinking. It should not imply clinical validation, diagnosis, or that generated recommendations are complete health advice.

> **After.** This is a data pipeline, not a medical tool. Nothing in it is clinically validated, and the generated suggestions are not health advice.

### `role`

Six-item laundry list.

> **Before.** Solo engineer across ingestion, normalisation, API, dashboard, authentication, and cloud deployment.

> **After.** Solo engineer. Ingestion through to the dashboard, auth and cloud deploy included.

### `interventions[0]`

"Preserved" and "canonical" are stiffer than needed; the reason matters more than the action.

> **Before.** Preserved raw exports before converting them into canonical tables.

> **After.** Kept the raw exports so the history could be reprocessed later.

### `interventions[2]`

Breaks the verb-first parallelism.

> **Before.** Scheduled daily processing while keeping generated insights optional.

> **After.** Daily processing runs on a schedule; the generated insights stay optional.

## Work story: Home Lab

<small>`workStory-home-lab`</small>

### `body[0]`

Thesis-sentence heading.

> **Before.** One small machine had production-like responsibilities

> **After.** One Raspberry Pi, real responsibilities

### `body[2]`

Abstract heading replaced with the actual constraints.

> **Before.** Resource and recovery constraints shaped every decision

> **After.** 8GB, no port forwarding, small budget

### `body[4]`

Thesis-sentence heading.

> **Before.** Simple orchestration fit the actual topology

> **After.** Compose, not Kubernetes

### `body[6]`

Thesis-sentence heading, and the first person is truer to what happened.

> **Before.** Recovery was tested rather than assumed

> **After.** I actually ran the restore

### `body[8]` and the block after it, deleted

Heading was "Architecture evidence includes operations".

"Architecture evidence includes operations" / "The useful proof is not the number of services. It is the connection between constraints, decisions, measurable limits, and a recovery process that was actually exercised." Same pattern. The restore time and the backup cost already made this point.

### `interventions[1]`

Breaks the verb-first parallelism.

> **Before.** Budgeted memory explicitly across more than eleven containers.

> **After.** Every container got an explicit memory limit, eleven of them and counting.

## Work story: Wildfire PySpark

<small>`workStory-wildfire`</small>

### `body[0]`

Abstract heading replaced with the numbers.

> **Before.** The assignment tested scale and imbalance together

> **After.** 1.88 million records, seven very uneven classes

### `body[2]`

Thesis-sentence heading.

> **Before.** Leakage and class frequency could invalidate the result

> **After.** Removing the leakage

### `body[4]`

Thesis-sentence heading.

> **Before.** Each experiment isolated a trade-off

> **After.** The model comparison

### `body[6]`

Thesis-sentence heading.

> **Before.** Rare-event recall exposed the model’s weakness

> **After.** Where it fell over

### `body[8]`

Calling your own result "honest" undercuts it. State the result.

> **Before.** The honest result is a failed production trade-off

> **After.** The trade-off does not work

### `body[9]`

"demonstrates... careful evaluation" is self-assessment. The second sentence gets a concrete verb.

> **Before.** The study demonstrates distributed experimentation and careful evaluation, not a deployable wildfire predictor. Improving a rare metric is not useful when false positives become overwhelming.

> **After.** A study in distributed experimentation, not a wildfire predictor anyone should deploy. Raising recall on a rare class is worth nothing if the false positives bury you.

### `role`

"Individual university-project author responsible for" is seven words of throat-clearing.

> **Before.** Individual university-project author responsible for preprocessing, feature engineering, distributed training, and evaluation.

> **After.** University project, done solo: preprocessing, features, training and evaluation.

## Report: Wildfire Analysis with PySpark

<small>`64644895-0cdc-4c42-a73f-171531516fc4`</small>

### `description`

"It provides pipelines for" is copula avoidance in front of a list that says the same thing.

> **Before.** This project uses Apache Spark to analyse the '1.88 Million US Wildfires' dataset. It provides pipelines for feature engineering, model training, and evaluation on a Hadoop YARN cluster.

> **After.** Apache Spark against the '1.88 Million US Wildfires' dataset: feature engineering, model training and evaluation on a Hadoop YARN cluster.

## Report: Home Lab Architectural Study

<small>`8b2b8d26-cbbe-462a-abb1-c5f34078f13a`</small>

### `description`

Seven-item laundry list. Kept the three parts a reader would open the PDF for.

> **Before.** An architecture case study for a small production lab running on a Raspberry Pi 4 Model B. It documents constraints, measurable goals, the high level solution, security posture, backup and recovery procedures, architecture decision records and a practical restore playbook.

> **After.** An architecture case study for a small production lab on a Raspberry Pi 4 Model B: the constraints it ran under, the decisions taken, and a restore playbook that was actually tested.

---

## The blog posts

Nine edits across the three published posts, applied as a second pass:

- **"Splitting the Stack and Making Setup Actually Work"** had three em dashes,
  including one in a heading (`## Setup automation—and the current regression`,
  now "Setup automation, and what I broke") and one in the excerpt. It closed on
  "No adoption claim is implied", which reads like a compliance footer rather
  than something a person writes on their own blog.
- **"I'm Building a GPU PC..."** had two em dashes, a nine-item list in its
  second sentence, and closed on "The value of GPUShare is the system design",
  the same self-assessment pattern the work stories had. Its excerpt opened with
  "An accurate look at", which is a defensive way to introduce your own post.
- **"Healthagent"** needed almost nothing: one em dash, and an excerpt calling
  it "a Next.js app" when the API is Fastify.

## Three things that are facts, not voice

- **Correction.** I first flagged the `project` documents as dead and worth
  deleting. They are not. Nothing renders their body copy, but `workStory.
  primaryArtifact` still references five of them, and those documents are the
  only carrier of the GitHub and live-site URLs that the work cards render. A
  delete would have stripped the repo links added in `2eed87f`. They stay.
  What is stale is the `project-you-inc` body, which still describes You Inc as
  a "deployed, multi-tenant" product with paid plans; only the unrendered body
  is wrong, and its `github` and `link` fields are still doing real work.
  `src/lib/work.ts` also claimed no live document could carry a `project`
  reference, which was false; the comment and the `ArtifactType` union are
  corrected in this commit.
- The Home Lab report had a tag of `" self-hosted"` with a leading space, which
  would not group with `self-hosted` anywhere tags are matched. Fixed.
- `AI-smell-audit.md` in the repo root critiqued a hero headline ("I make
  complicated software useful") that no longer exists. Deleted.

<small>100 edits. Generated from `scripts/copy-humanise.ts`.</small>
