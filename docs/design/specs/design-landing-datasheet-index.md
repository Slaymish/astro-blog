# Landing redesign — Datasheet fold, Index body

Status: specified 2026-08-21. Replaces the six-section homepage in `src/pages/index.astro`.

## Problem

The old fold said one thing three times: eyebrow `Hamish Burke / Wellington, New Zealand`,
h1 `Software developer in Wellington.`, lede `I build things I want to exist.` The name is
already in the header and Wellington appeared twice.

Below it, one layout idiom repeated six times — coral uppercase tracked eyebrow, large
heading, "see all" link — across hero, interests, currently, projects, work and writing. Six
identical headers is the generated-page tell, and it spent the coral accent six times over.

The top third carried no evidence. Two sections of self-description (`interests`: Technology /
"How things work", Systems / "How complicated things interact", Strategy / "What is actually
worth doing"; `currently`: a paragraph) sat between the visitor and the first thing built.

## Direction

An engineering datasheet never claims "high performance"; it prints the measurement. The site
already holds measurements — `recall 0 → 0.7518, accuracy fell to 32%`, `restore 1h45,
$2.82/month`, `no adoption claim is made` — and the old design buried them under adjectives.
The redesign surfaces them and deletes the adjectives.

Specificity is the credibility argument. Nobody padding a CV writes `precision 0.0099`. This
is why the page states no trajectory and makes no claim about its own honesty: measurements
that flatter and measurements that do not get identical treatment, and the reader draws the
conclusion. See the candour prohibition in `CLAUDE.md` § Content rules.

Target reader: a senior engineer who has never met Hamish and gives the page fifteen seconds.

## Structure

Two regions replace six sections.

**Fold — Datasheet.** The name at display scale, with three annotations hung off it on the
circuit engine's leader lines. No eyebrow, no lede, no "start here" nav (the header already
carries those four destinations). The annotations are the subtitle, and they carry what a
subtitle cannot: a place, a count, and an outbound link.

**Body — Index.** One dated reverse-chronological stream, projects and writing interleaved.
Every row carries a measured fact. Replaces the four repeated section headers with one list.

```
DESKTOP                                             MOBILE
┌────────────────────────────────────────────┐      ┌──────────────────┐
│ HB   projects  work  about  contact    ◐   │      │ HB          ☰ ◐  │
├────────────────────────────────────────────┤      ├──────────────────┤
│                                            │      │ Hamish           │
│  Hamish ────┐                              │      │ Burke            │
│  Burke      ├──● ALPHERO, WELLINGTON       │      │  ├──● ALPHERO    │
│      ───────┤    SINCE 2026                │      │  ├──● 7 PROJECTS │
│             ├──● 7 PROJECTS · 5 PUBLIC     │      │  └──● GITHUB   ▸ │
│             └──● GITHUB.COM/SLAYMISH   ▸   │      ├──────────────────┤
│                                            │      │ 2026             │
├──────────── 2026 ──────────────────────────┤      │ Aug  Sprint Coach│
│ Aug │ Sprint Coach      Client marketing   │      │ ▓▓▓▓▓ (square)   │
│     │ ▓▓▓▓▓  Live at sprintcoach.co.nz ·   │      │ Live at sprint…  │
│     │ ▓ sq ▓ enquiry form, launch checklist│      │ ──────────────── │
│ ────┼───────────────────────────────────── │      │ Jul  Splitting…  │
│ Jul │ Splitting the Stack…    Writing      │      │ Writing          │
│ ────┼───────────────────────────────────── │      └──────────────────┘
│ Jun │ You Inc           Finance ledger     │
│     │ ▓▓▓▓▓  MIT, self-hosted · Akahu sync │
│     │ ▓ sq ▓ into a balanced double-entry  │
│ ────┼───────────────────────────────────── │
│ Mar │ GPUShare          GPU sharing        │
│     │ ▓▓▓▓▓  Auth, MCP routing, queued     │
│     │ ▓ sq ▓ rendering · no adoption claim │
│ ────┼───────────────────────────────────── │
│ Jan │ HealthAgent       Health pipeline    │
│     │ Apple Health exports into Postgres   │
├──────────── 2025 ──────────────────────────┤
│ Aug │ Home Lab          Pi recovery        │
│     │ Full restore 1h45 · $2.82/mo offsite │
│ ────┼───────────────────────────────────── │
│ Jun │ Wildfire PySpark  ML study           │
│     │ Recall 0 → 0.7518 · accuracy fell to │
│     │ 32%, precision 0.0099                │
├────────────────────────────────────────────┤
│ All projects        All writing            │
├────────────────────────────────────────────┤
│ Working on something interesting?  [band]  │
└────────────────────────────────────────────┘
```

### Row densities

Rhythm comes from two densities, not from decoration. Expanded rows carry a diagram; compact
rows do not. Both carry the metric line, so every row is evidence.

The diagrams keep their existing `16 / 10`. They are CSS compositions rather than croppable
images, so forcing them square would reflow seven hand-tuned layouts; 16/10 is landscape,
which the square-or-landscape rule allows. What the rule forbids is `16 / 9`.

Expanded set is a rule, not a hand-picked list: **the two most recent independent projects
plus the most recent professional one.** At the time of writing that is Sprint Coach, You Inc
and GPUShare. It re-evaluates as content is added.

### Why interleave writing with projects

A separate writing section needed its own header, which is one of the six being deleted. The
`descriptor` column already distinguishes a build from a write-up in the reader's own words
("Open-source finance ledger" vs "Writing"), so no badge or icon is needed.

**A story claims its own write-ups.** Interleaving unfiltered listed everything twice: all five
current posts and reports are artifacts of a work story published within days of it, so the
stream read `GPUShare` immediately followed by `I'm Building a GPU PC…`. A writing entry whose
href matches any story's primary or supporting artifact is therefore suppressed — the story is
canonical and links to its write-ups from the case study. A standalone piece belonging to no
story still gets its own row, so the mechanism stays live for essays written later. Today this
resolves to seven rows, all of them stories.

## Type scale — five styles, no more

| Role | Face | Size | Weight | Used on |
|---|---|---|---|---|
| Display | Geist | `clamp(3.25rem, 11vw, 9rem)` | 600 | The name. Once per page. |
| Row title | Geist | `clamp(1.15rem, 2vw, 1.6rem)` | 500 | Index row titles, year rules |
| Body | Geist | `var(--type-body-small)` | 400 | Metric lines, descriptors |
| Meta | JetBrains Mono | `var(--type-label)` | 500 | Fold annotations, dates, counts |
| Link | Geist | `var(--type-body-small)` | 700 | Tail links, existing `IconText` |

`--type-display`, `--type-heading-1` and `--type-heading-2` go unused on this page. No inline
`text-*` sizing; every size resolves from a token.

### Mono discipline

Mono appears in exactly two places: the three fold annotations and the index date column.
Both are data — a place, a count, a URL, a month. Nowhere else. Removing them collapses the
fold (they are its only information beside the name) and the index's chronological spine, so
both pass the earn-its-place test. The old coral uppercase tracked eyebrow is gone entirely;
it must not return in any of the six places it previously appeared.

## Colour

No new tokens. The palette is already correct; it was being spent carelessly.

- Canvas, text, secondary text, subtle stroke: unchanged semantic roles
- `--color-action` (coral) appears **once** in the static page: the outbound GitHub annotation
  on the fold. Everything else earns it only on hover or focus.
- Circuit tokens unchanged. Both theme files already define all nine roles.

Contrast: metric lines use `--color-text-secondary` on canvas, which clears AA at 15px in both
themes. The mono meta at 12px must use `--color-text-secondary`, never a lighter tint.

## Circuit integration

No engine changes. The fold's leader lines are the existing router doing what it already does.

| Region | Label | Source | Nodes |
|---|---|---|---|
| Fold | `BUS_01` | the name | 3 annotations, `attach="text"`, `flash="underline"` |
| Index | `BUS_02` | first year rule | 3 expanded rows, `attach="rule"`, `flash="edge"` |
| Contact | `BUS_03` | unchanged | unchanged |

Three buses, as today. The fold is the first place on the site where the pipework is
structural rather than ornamental: without the leader lines the annotations have no
relationship to the name.

## Schema changes

Both `src/sanity/schemaTypes/` and `studio-production/schemaTypes/`.

`homePage`:
- `hero`: drop entirely (`eyebrow`, `headline`, `headlineAccent`, `lede`, `links`). Add `fold`
  with `name` (string), `position` (string) and `sourceLink` (`ctaLink`).
- The middle annotation is **not authored**. It is counted from the work stories at build time
  by `foldCount()` — `5 independent · 2 client · 3 open source` — so it cannot claim more than
  the index below it lists, and zero buckets are dropped rather than printed. `ctaLink` requires
  an `href`, which is the other reason the three annotations are not one array: two of them are
  facts, not links.
- Drop `interests`, `currently`, `projectsSection`, `workSection`, `writingSection`.
- Add `indexSection` — `{ projectsLink, writingLink }` for the tail row.

`workStory`:
- Add `metric` (string, max 100). Required. The measured fact for the index row. Distinct from
  `result`, which is prose for the case-study page. Print the number that exists, whether or
  not it flatters.

## States

- **Empty index** (no stories, no writing): the fold still stands alone; the index region is
  not rendered rather than rendered empty. There is no "nothing here yet" copy on the homepage.
- **Missing `metric`**: the row renders without its metric line rather than throwing. A build
  is not worth failing over one absent short string, unlike the page-copy singletons.
- **Missing diagram**: the row falls back to compact density.
- **Hover / focus** on a row: title takes `--color-action`; the row's left rule takes
  `--color-stroke-strong`. Focus adds the standard focus ring. No transform, no shadow.
- **Reduced motion**: the circuit packet animation already honours it; nothing new added.

## Guardrails

Countable checks for whoever implements or reviews this.

1. Text styles on the rendered page: **≤ 5**. Count distinct `font-size` declarations across
   `index.astro` and `IndexRow.astro`; currently 4. The diagrams carry their own internal
   scale, which belongs to the illustration rather than the page chrome.
2. Uppercase tracked eyebrows: **0**.
3. Elements using `--color-action` without hover or focus: **1** (`.fold__link`).
4. Mono elements: fold annotations + index dates only. No mono on titles or descriptors.
5. Images: square or landscape. No `16 / 9`, no `aspect-video`.
6. Wrapper elements with no purpose beyond grouping for style: **0**. The index row is a
   grid; it does not need an inner div per column.
7. Cards: **0** on the homepage. The index is rules and space, not boxes.
8. Sentences of prose in the fold: **0**.
9. The word "passionate", "journey", "crafted", "leverage": **0**.
10. Any sentence describing the site's own honesty: **0** (`CLAUDE.md` § Content rules).

## Anti-patterns

- Do not reintroduce a lede under the name. If a fact matters, it becomes an annotation.
- Do not badge the writing rows. The descriptor column already does that work.
- Do not add a "featured" label to expanded rows. The diagram is the signal.
- Do not add counts that flatter by vagueness ("many projects"). Counts are computed or absent.
- Do not put a booking CTA on the fold. The contact band at the foot is the one ask.
