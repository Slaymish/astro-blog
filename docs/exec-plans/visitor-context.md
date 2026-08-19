# ExecPlan: Visitor context

Status: **Signal substrate landed (2026-08-19) — Phases 0 to 5 not started**
Created: 2026-07-28
Location: `docs/exec-plans/visitor-context.md`

The Tier 1 behavioural pipeline this plan depends on (§6) is live: `/api/collect`
writes anonymised session sequences to Netlify Blobs, the Cal.com webhook records
confirmed bookings against the same visitor nonce, and the nightly
`netlify/functions/session-insights.mts` prunes and synthesises them. The phases
in §9 remain unstarted.

Serve hamishburke.dev differently depending on what a visitor came to do,
without giving up static rendering, crawlability, or the site's current
privacy posture.

Related: `ARCHITECTURE.md` (§4 invariants are drafted here for lifting),
`AGENTS.md` (§8.2 lists new and touched files), `SITE-OVERVIEW.md`,
`docs/tech-debt-tracker.md`.

---

## 1. Problem

The site serves at least two unrelated audiences through one front door.
Someone evaluating freelance work and someone who arrived at a philosophy
post from an aggregator want almost disjoint things, and the homepage
currently splits the difference — which means it does neither job well.

The obvious fix is to fork the URL space (`/business/*`, `/personal/*`).
That was rejected: it bakes an audience guess into every URL permanently,
makes shared links carry the wrong framing, and splits ranking signal
across two trees.

The constraint that makes this interesting: the site is
`output: 'static'`, fully prerendered, served from CDN with no function
invocation per request. Per `SITE-OVERVIEW.md`, pages currently have no
access to request-time inputs at all.

---

## 2. Goals and non-goals

### Goals

- **G1** — A visitor's likely intent is inferred from behaviour, not asked for.
- **G2** — The URL space stays flat and audience-agnostic.
- **G3** — Personalization is perceptible. A visitor should be able to notice
  the site responding to them.
- **G4** — Every page remains fully static, CDN-cached, and crawlable.
- **G5** — Content classification is derived from content, not hand-maintained
  in a path→audience lookup table.
- **G6** — The existing analytics pipeline becomes load-bearing rather than
  decorative.

### Non-goals

- **N1** — Identifying *who* someone is. This models per-visit intent only.
  No cross-device identity, no fingerprinting, no third-party enrichment.
- **N2** — Gating content. Nothing is ever hidden behind a context.
- **N3** — Personalizing navigation. See D4.
- **N4** — Personalizing article or case-study bodies. Chrome and
  recommendations only.
- **N5** — A/B testing infrastructure. Different problem, don't conflate.
- **N6** — Migrating hosts. See D5.

---

## 3. Decisions

### D1 — Model intent, not identity

Intent is per-visit and observable. Identity is per-person and unknowable
from a page request.

Consequences that follow from this and not from the identity framing:

- A visitor whose signals shift mid-session has **changed intent**. Follow
  them. This is correct behaviour, not misclassification to suppress.
- `confidence` becomes a meaningful field, and a `neutral` state becomes a
  legitimate outcome rather than a failure.
- The framing stays defensible if surfaced to a visitor. "You've been
  reading the writing" is fine. "We determined you are a hiring manager"
  is not.

### D2 — Personalize via server islands, not page variants

The static shell stays prerendered and CDN-cached. Personalized fragments
are `server:defer` islands whose `slot="fallback"` contains the neutral
variant.

The fallback is compiled into the static HTML at build time, which means
**the crawlable baseline is produced by construction**. There is no separate
bot-safe path to maintain and no way to accidentally diverge from it.

Rejected: whole-page variants keyed on a cookie. Doubles cache surface,
makes it ambiguous which variant a crawler receives, and structurally
invites violating I3.

### D3 — Content classification is semantic, not tabular

Build-time embeddings already exist for local semantic search
(`@huggingface/transformers`, no external API). Reuse them: embed a short
authored description of each intent as a **pole vector**; a session vector
is the recency-weighted mean of viewed-page embeddings; affinity is cosine
similarity to each pole.

This generalises — new Sanity content self-classifies at build time — and
yields "more like this" recommendations from the same vectors.

Rejected: a hand-maintained path→audience map. Works initially, rots on
contact with new content.

### D4 — Do not personalize navigation

Nav sits in `Layout.astro`, renders on every page, and lives outside the
`Bend.tsx` scroll container. Making it an island means a deferred fetch on
every page load and a visible header reflow after paint — the most
noticeable possible place to put a flicker, for the least benefit.

Nav stays static and Sanity-driven. Revisit only with evidence.

### D5 — Stay on the current host

Everything in this plan runs on the current adapter today: server islands,
Blobs-backed sessions, scheduled functions, and Astro 7's CDN cache
provider.

AWS was evaluated. The one real capability it adds is CloudFront caching
separate object versions per whitelisted cookie, with CloudFront Functions
executing sub-millisecond at every edge. That enables full page variants —
which D2 already rejects on design grounds. At current traffic the cost
difference is negligible; the actual price is owning Terraform/IAM, cert
renewal, cache invalidation on publish, and a build pipeline.

Reopen only if the AWS infrastructure is wanted *as a portfolio artifact*,
which is a legitimate goal but should be named as such rather than
justified technically.

---

## 4. Invariants

Drafted for lifting into `ARCHITECTURE.md`. Each is intended to be
mechanically checkable.

- **I1** — No branch anywhere in the codebase reads `User-Agent` to decide
  what to render. Crawlers are visitors with no cookie.
- **I2** — Every route renders complete, meaningful content with no cookie
  and no JavaScript.
- **I3** — Personalization may reorder, emphasise, or append. It may never
  remove, gate, or redirect.
- **I4** — One canonical URL per piece of content. Personalization never
  mints a variant URL.
- **I5** — `/sitemap.xml`, `/rss.xml`, `/llms.txt`, and `/404` are always
  neutral.
- **I6** — `Vary: Cookie` appears on island endpoints only, never on page
  HTML.
- **I7** — A context switcher is reachable from every page and works without
  JavaScript.
- **I8** — Derived scores are persisted. Raw signals (IP, UA, referrer) are
  not, consistent with the existing `/api/collect` design.

---

## 5. Audience model

Five intents modelled internally; collapsed to three modes in presentation.

| Intent | Typical arrival | Wants to know | Reads | Shape |
|---|---|---|---|---|
| `hiring` | LinkedIn, direct, recruiter search | Can they do the job, are they available | `/cv`, `/work`, one case study | ~90s, high bounce |
| `commissioning` | Referral, direct, `/work` | Can they solve *my* problem, reliably | 2–3 case studies, contact | Long, comparative |
| `peer` | Aggregators, technical search | Does this post solve my problem | One post, maybe a second, RSS | Deep on one page |
| `known` | Direct, no referrer | The specific thing they were told about | Straight to it | Short, intentional |
| `machine` | Crawler, LLM fetcher, unfurler | Complete structured content | Everything | n/a |

Presentation modes: `professional` (hiring + commissioning),
`personal` (peer + known), `neutral` (below confidence threshold, or
`machine`).

Modelling five and rendering three is deliberate. The inference layer costs
nothing extra to make expressive, and hiring vs commissioning want opposite
proofs — employability versus delivery — which will eventually justify
separating them.

---

## 6. Signal model

Ranked by contribution, not by ease of implementation.

### Tier 1 — behavioural sequence (strongest)

Already collected by `/api/collect`. Currently only feeds a dashboard.

| Pattern | Infers |
|---|---|
| `/work → /work/[a] → /cv` | `hiring` |
| `/work/[a] → /work/[b]`, long dwell | `commissioning` |
| `/writing → /posts/[a] → /posts/[b]` | `peer` |
| Direct entry to a deep slug, no referrer | `known` |

Supplementary: `/api/pdf` opens (strong professional signal), Cal.com link
engagement via the existing `/api/cal-webhook`, scroll depth on case
studies.

### Tier 2 — semantic affinity

Per D3. Continuous score with a neutral band. Supersedes the Tier 1 pattern
table once Phase 3 lands; Tier 1 remains the bootstrap and the fallback.

### Tier 3 — first touch (weak, free)

Entry path is the useful one: `/reports/*` and `/cv` skew professional,
`/posts/*` skews peer. Referrer host is a decent secondary. Deliberately
under-invested in — see the note in §7 on why first-touch accuracy barely
matters.

### Explicitly excluded

IP geolocation, viewport/device inference, time-of-day, and any
third-party data. Cost/benefit is poor and each erodes I8.

---

## 7. Where the perceived intelligence actually comes from

Worth recording, because it determines the effort budget.

A correct first-load classification is **imperceptible**. The visitor has no
counterfactual — they cannot see the version they didn't get — so a correct
cold guess produces zero felt intelligence. All perceptible smartness lives
in *responsiveness*: the site visibly reorganising in response to something
the visitor just did.

Therefore: spend little on first-touch accuracy, default to `neutral` when
unsure, and spend heavily on the second and third page view where adaptation
is observable. A "because you read X" rail after two posts lands. A perfect
cold guess does not.

This is why Tier 3 is deliberately thin and Phase 3 is where the work is.

---

## 8. Architecture

### 8.1 Request pipeline

1. **Resolve** — `src/fetch.ts` (Astro 7 Advanced Routing) runs ahead of
   middleware, actions, and pages. Reads the context cookie, loads the
   session, applies `?ctx=` overrides, attaches `VisitorContext` to
   `App.Locals`, and writes back a refreshed cookie.
2. **Static shell** — prerendered, CDN-cached, neutral, crawlable. Contains
   island placeholders with their fallbacks inlined.
3. **Server islands** — fetched per-request from `/_server-islands/*`, read
   context server-side, render the personalized fragment.
4. **Collect** — existing `/api/collect` records the anonymised sequence.
5. **Nightly** — existing scheduled function recomputes weights, writes them
   to Blobs, where `src/fetch.ts` reads them on next request.

Step 5 closing back into step 1 is what makes this a learning system rather
than a static rules engine. See R6 on whether that will ever pay off.

### 8.2 File map

New:

```
src/lib/visitor/
  types.ts          VisitorContext, Intent, Mode
  scoring.ts        pure — signals in, scores out. Unit tested.
  vectors.ts        pure — pole vectors, cosine, recency weighting. Unit tested.
  cookie.ts         pure — parse/serialize. Unit tested.
  resolve.ts        request I/O. Reads cookie + session, calls scoring.
  poles.ts          authored intent descriptions, embedded at build time.

src/fetch.ts        entrypoint. Thin — delegates to resolve.ts.

src/components/context/
  LeadRail.astro    server:defer — homepage featured block
  NextUp.astro      server:defer — end-of-page recommendations
  PrimaryCta.astro  server:defer — footer CTA
  ContextSwitcher.astro   static, no-JS, links to ?ctx=

tests/visitor-scoring.test.ts
tests/visitor-vectors.test.ts
tests/visitor-cookie.test.ts
```

The pure/impure split mirrors the existing `src/lib/circuit/` convention
(`geometry.ts` pure and unit-tested, `engine.ts` owns DOM and lifecycle).

Touched:

```
astro.config.mjs              adapter output mode, cache provider, session driver
src/sanity/schemaTypes/       audiences[] on post, workStory, report, book
studio-production/schemaTypes/  MUST mirror the above — see R7
src/pages/index.astro         LeadRail
src/layouts/Layout.astro      PrimaryCta, ContextSwitcher
src/pages/posts/[slug].astro  NextUp
src/pages/work/[slug].astro   NextUp
src/pages/reports/[...slug].astro  NextUp
src/pages/api/collect.ts      emit intent scores alongside sequence
src/pages/privacy.astro       cookie disclosure — see R5
```

Deliberately untouched: `src/lib/legacyRoutes.ts`, `netlify.toml` redirects,
`src/lib/circuit/`, `Bend.tsx`, all singleton copy documents.

### 8.3 Island inventory

| Island | Renders on | Fallback |
|---|---|---|
| `LeadRail` | `/` | Current featured aggregation, unchanged |
| `NextUp` | `/posts/[slug]`, `/work/[slug]`, `/reports/*` | Most recent 3 in same collection |
| `PrimaryCta` | all | Current neutral CTA |

At most two islands fire per page. Each fallback is a genuinely usable
component, never a spinner or skeleton — I2 depends on this.

### 8.4 Data model

```ts
// src/lib/visitor/types.ts
export type Intent = 'hiring' | 'commissioning' | 'peer' | 'known';
export type Mode = 'professional' | 'personal' | 'neutral';

export type VisitorContext = {
  mode: Mode;
  intent: Intent | null;
  scores: Record<Intent, number>;   // 0..1, need not sum to 1
  confidence: 'explicit' | 'inferred' | 'none';
  source: 'switcher' | 'sequence' | 'semantic' | 'entry-path' | 'referrer';
};
```

**Precedence.** `explicit` never gets overwritten by `inferred`. `inferred`
is always overwritten by `explicit`. Without this, a visitor picks a mode,
later follows a link from elsewhere, and gets silently flipped.

**Cookie** — small, opaque, and does not carry the model:

```
hb_ctx = v1.<sid>.<mode>.<confidence>
```

`httpOnly; Secure; SameSite=Lax; Path=/; Max-Age=7776000` (90d). Target
under 64 bytes. Because it is `httpOnly`, the switcher cannot be a client
script — it is a plain link to `?ctx=`, handled in `src/fetch.ts` with a
303 back to the same path. This satisfies I7 and costs nothing.

**Session** — Astro Sessions (added 5.7.0; the Netlify adapter configures a
Blobs-backed driver automatically). Holds what won't fit in a cookie:

```ts
// src/env.d.ts
declare namespace App {
  interface SessionData {
    visitor: {
      scores: Record<Intent, number>;
      vector: number[];      // running session embedding
      paths: string[];       // capped at 20, most recent last
      firstTouch: 'entry-path' | 'referrer' | 'direct';
      updatedAt: number;
    };
  }
}
```

Note: sessions are **not supported in edge middleware**. This is an
additional reason resolution lives in `src/fetch.ts` rather than an edge
function.

**Sanity** — add to `post`, `workStory`, `report`, `book`:

```ts
{
  name: 'audiences',
  title: 'Audiences',
  type: 'array',
  of: [{ type: 'string' }],
  options: { list: ['hiring', 'commissioning', 'peer', 'known'] },
}
```

An **array**, not a single value. The strongest case study belongs to
several. A scalar field will need migrating within a month.

---

## 9. Phases

Each phase is independently shippable and independently revertable.

### Phase 0 — Astro 5 → 7

**Goal:** unblock `src/fetch.ts` and stable route caching.

Two majors. The material risks are in the rewritten Rust compiler rather
than the new APIs:

- Unclosed tags (`<div>Hello`) and unterminated attributes now **error**
  instead of being silently corrected.
- Whitespace between inline elements is now collapsed JSX-style. Newlines
  between `<span>`s no longer render a space. Given the hand-tuned
  typography and the `src/lib/circuit/` SVG overlay, expect visual diffs.
- Markdown/MDX now defaults to Sätteri. Local MDX content is in scope;
  `@astrojs/markdown-remark` remains available if any remark/rehype plugin
  is load-bearing.
- Vite 8 / Rolldown. Config auto-converts; custom plugins need checking.

Do this in a **git worktree** so `main` keeps building throughout.

**Acceptance:** full build succeeds; visual diff across responsive
breakpoints shows no unintended regressions; `pnpm test` green; all existing
`301`/`410` legacy routes still resolve correctly.

**Rollback:** discard worktree.

### Phase 1 — Plumbing, with a deliberately dumb classifier

**Goal:** the entire architecture working end to end, with nothing clever in it.

- `src/fetch.ts` resolving context and attaching to `App.Locals`.
- Cookie + session round-tripping. `ASTRO_KEY` set via `astro create-key`.
- One island: `LeadRail`, fallback = the current featured block verbatim.
- `ContextSwitcher` in the footer.
- `?ctx=` override for dev.
- Classification: entry path and referrer rules only. No embeddings.

**Acceptance:**
- `curl` with no cookie returns byte-identical HTML to pre-Phase-1 for every
  route except `/` (I2).
- `/` with no cookie renders the fallback (I2).
- The island endpoint returns 200 and the correct fragment for each mode.
- No `User-Agent` reference exists in `src/` (I1) — enforce with a grep in CI.
- LCP within 5% of baseline.

**Rollback:** remove `server:defer` from `LeadRail`. The fallback becomes
the only render path and the site is exactly as before.

### Phase 2 — Content tagging

**Goal:** give the islands something to sort by.

Add `audiences[]` per §8.4 to both schema directories. Backfill existing
documents. Extend the GROQ projections in `src/lib/sanity.ts`.

**Acceptance:** every published document has at least one audience; both
schema directories are identical; `pnpm run seed:copy` still succeeds.

### Phase 3 — Semantic classifier

**Goal:** replace the rules table with D3.

- Author pole descriptions in `poles.ts`, embed at build time alongside the
  existing search embeddings.
- Session vector as recency-weighted mean, stored in session (not cookie).
- Cosine affinity with an explicit neutral band. Tune the threshold on real
  sessions, not intuition.
- Add `NextUp` and `PrimaryCta` islands.

**Acceptance:** classifier agrees with hand-labelled sessions above an
agreed threshold; build time increase under 10s; rules path still available
behind a flag for A/B comparison.

### Phase 4 — Learning loop

**Goal:** close the cycle. Extend the nightly scheduled function to
correlate path sequences against conversions already captured (Cal.com
bookings, PDF opens, RSS subscribes) and emit updated weights to Blobs.

**Acceptance:** weights file written nightly; `src/fetch.ts` reads it with a
safe default when absent; a bad weights file cannot break rendering.

Read R6 before starting this phase.

### Phase 5 — Write-up

Publish as a `/reports/` entry. Per R6 this is arguably the highest-value
deliverable in the plan.

---

## 10. Testing

Existing runner: `tsx --test` over `tests/*.test.ts`.

Everything decision-making is a pure function and is unit tested:

- `scoring.ts` — signal fixtures in, expected scores out. Include the
  precedence rule (explicit is never downgraded) as an explicit case.
- `vectors.ts` — cosine correctness, recency weighting, neutral-band
  boundaries.
- `cookie.ts` — round-trip, malformed input, version bump handling,
  size ceiling assertion.

Integration coverage worth having:

- No-cookie render equals the fallback render, per route (guards I2).
- Every canonical URL returns 200 for every mode (guards I3).
- Grep assertion that `src/` contains no `User-Agent` branch (guards I1).

---

## 11. Risks

| # | Risk | Mitigation |
|---|---|---|
| R1 | Astro 7 compiler strictness breaks the circuit overlay or typography | Phase 0 in a worktree, visual diff across breakpoints before merge |
| R2 | Server islands require JavaScript | Every fallback is a usable component, never a skeleton (I2) |
| R3 | Island props exceed 2048 bytes → silent switch to POST → all caching breaks | Pass a slot name only, never a payload. Islands re-read context server-side. Assert prop size in a test |
| R4 | `ASTRO_KEY` unset → CDN-cached pages built with a stale key fail to decrypt island props | Generate with `astro create-key`, set in build env, document in `AGENTS.md` |
| R5 | Privacy posture change. `/api/collect` currently stores no IP, UA, referrer, or cookie — that restraint is a genuine design strength | Persist derived scores only, never raw signals (I8). Update `/privacy`. A functional preference cookie is a lighter lift under the Privacy Act 2020 than a behavioural profile — but this is not legal advice and warrants a proper read of the Act |
| R6 | Phase 4 has no statistical power. At this traffic volume a self-tuning classifier will take years to beat hand-written rules | Build it for the write-up, not the lift. Decide which one it is before starting, and don't let the metric disappoint you later |
| R7 | Sanity schema drift between `src/sanity/schemaTypes/` and `studio-production/schemaTypes/` | `SITE-OVERVIEW.md` already flags these must change together. Add a CI check comparing the two |
| R8 | Personalization mistaken for cloaking | I1 and I2 are the entire defence. Personalization that reorders and appends while serving the same underlying need is permitted; branching on user-agent is not. Never detect crawlers |

---

## 12. Open questions

- **Q1 (blocking Phase 1)** — Host. `SITE-OVERVIEW.md` describes Netlify
  throughout (adapter, `netlify.toml`, Blobs, scheduled functions), but the
  deployment has also been described as Vercel. The session driver and cache
  provider both bind to this. Resolve before writing `astro.config.mjs`.
- **Q2** — Do `/about` and `/contact` become separate pages? `/contact` is a
  URL people type directly and is worth having as a canonical target.
  `/about` likely duplicates the homepage's job.
- **Q3** — Retire the legacy `project` content type, or leave it?
- **Q4** — Should the switcher expose *why* a mode was chosen? A "why am I
  seeing this" affordance is the single cheapest thing that converts
  "creepy" into "smart", and costs one line of copy.

---

## 13. Appendix — server island reference

Behaviours worth having written down, all of which will otherwise be
rediscovered the hard way:

- Props are serialized, encrypted, and passed in the island's `GET` query
  string. Over 2048 bytes Astro switches to `POST`, which browsers do not
  cache. Keep props minimal.
- Only plain objects, `number`, `string`, `Array`, `Map`, `Set`, `RegExp`,
  `Date`, `BigInt`, `URL`, typed arrays, and `Infinity` serialize. Functions
  and circular references do not.
- `Astro.url` and `Astro.request.url` inside an island resolve to
  `/_server-islands/<Name>`, not the page. Read the `Referer` header to
  learn the embedding page.
- Islands work in `.astro` components only, not React/Vue/Svelte. They can
  be passed as children into a client component but not nested inside one.
- `Astro.cookies` is available inside an island, which is why islands can
  re-read context rather than receiving it as a prop.
