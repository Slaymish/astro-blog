# Rebuild the circuit motif against a single visual grammar

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`,
`Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This document must be maintained in accordance with `PLANS.md` at the repository root.

## Purpose / Big Picture

This site draws thin decorative "pipes" — hairline traces that leave a heading, run around a
section, and end beside a link. They are meant to read as a technical schematic: part PCB trace,
part plumbing drawing. Today they do not. On the homepage the hero's pipework travels roughly 1,900
pixels to connect two things that sit 120 pixels apart, and it draws that journey as two nearly
identical horizontal rules crossing the whole page 32 pixels apart. Corners come out at seven
different radii on one screen. One corner has no radius at all. Two branches in the projects
section are 63-pixel hooks that hang off the gutter and connect nothing to nothing.

After this change, a visitor sees pipework that looks deliberate. One bus leaves the headline, runs
the page gutter as a vertical rail, and short branches tap it directly above whatever they serve.
Every corner is the same 12px arc. Every run ends in something — a plate, a tap into an existing
rule, or a dot. Every line lands on a whole device pixel, so hairlines are crisp instead of smeared
across two pixel rows. A slow coral capsule travels the pipe roughly every twenty seconds, driven
entirely by CSS, paused when the region is off screen, and absent entirely for anyone who has asked
for reduced motion.

You can see it working by running `pnpm run dev` and loading `http://localhost:4321/`. The hero's
trace should be a single horizontal leaving the coral words "they're capable of.", running left to
the gutter, with one short vertical dropping onto the "Projects / Writing / About" links, and a
vertical rail down the left gutter labelled `BUS_01`. There should be no second parallel horizontal.

## Progress

- [x] (2026-08-16 11:40Z) Audit every instance of the motif and record implementation, measured
      geometry, colour, positioning and animation. Written to
      `docs/design-docs/circuit-audit-2026-08.md`.
- [x] (2026-08-16 12:05Z) Define the visual grammar as tokens and write it up in
      `docs/design-docs/circuit-design-language.md`.
- [x] (2026-08-16 12:15Z) Write this ExecPlan.
- [x] (2026-08-16 12:50Z) Milestone 1 — rewrite `src/lib/circuit/geometry.ts` against the new
      grammar, with `tests/circuit-geometry.test.ts` rewritten to cover it.
- [x] (2026-08-16 13:10Z) Milestone 2 — retoken. `src/design-system/tokens.css` and both theme
      files carry the new names and values; the mobile weight override is gone.
- [x] (2026-08-16 13:35Z) Milestone 3 — rewrite `src/lib/circuit/engine.ts` to paint the new
      vocabulary, snap to device pixels, and drop the Web Animations packet machinery.
- [x] (2026-08-16 13:50Z) Milestone 4 — rewrite `src/design-system/circuit.css` for the new parts
      and the CSS-only capsule.
- [x] (2026-08-16 14:00Z) Milestone 5 — update the markup contract at the four authored call
      sites, including explicit `data-circuit-attach` where the old flash-derived default was wrong.
- [x] (2026-08-16 14:20Z) Milestone 6 — verified in Chrome at 390 / 768 / 1024 / 1440, dark and
      light, homepage and `/about`; measured shipped bytes; updated `ARCHITECTURE.md` and `AGENTS.md`.
      (completed: Chrome across four widths, both themes, one arc radius and zero off-grid
      coordinates at every width, no horizontal overflow, `knip` unchanged from the pre-change
      baseline; remaining: Firefox, Safari and iOS Safari are unverified, and reduced motion was
      checked by reading the matched CSS rules rather than by emulating the preference, which the
      available tooling cannot set.)
- [x] (2026-08-16 14:35Z) Follow-up — moved the label breakpoint from 64rem to 80rem after measuring
      its rotated glyphs reaching within 1px of the screen edge at 1024px.
- [x] (2026-08-16 15:10Z) Follow-up on review — the capsule was longer than the corner diameter and
      left the pipe at every bend, and runs meeting text were finishing badly at both ends. Capsule
      cut from 26px to 8px; text now terminates on its baseline at its leading edge from either
      direction; the hero nav re-declared as `text` rather than `box`.

## Surprises & Discoveries

- Observation: the hero's terminator was a connector for a joint that does not exist. The nav
  carried `data-circuit-flash="edge"`, which the old `resolveAttach` mapped to `attach: 'rule'`,
  which makes the router lay two bands *across a divider*. `.home-hero__links` has no border, so the
  bands were laid across nothing.
  Evidence: `src/pages/index.astro:33` sets the flash; `.home-hero__links` in the same file's style
  block defines only `display: flex; flex-wrap: wrap; gap: ...`. Fixed by declaring attachment
  explicitly rather than inferring it from a presentational class.

- Observation: the old router's radius cap was the sole cause of the inconsistent corners, and it
  fired on nearly every corner. Measured radii on one page were 0, 8, 10, 10.53, 14.07, 14.08 and 16
  against a 16px token.
  Evidence: `bendsFor` in the old `geometry.ts` computed
  `Math.min(bendRadius, distance(previous, corner) / 2, distance(corner, next) / 2)`.

- Observation: `BUS_03`'s trunk had one corner with no sweep at all, because the upward rail arm was
  returned as a *separate path* and the shared vertex was therefore never an interior vertex.
  Evidence: emitted paths were `... L -28.8 520.5` and `M -28.8 520.5 L -28.8 20`.

- Observation: `data-circuit-tone="quiet"` on `Layout.astro:337` was read by nothing in either the
  engine or the CSS. Dead attribute, removed.

- Observation: nothing in the repository listens for the `circuit:arrive` event.
  Evidence: `grep -rn "circuit:arrive" src/ tests/ studio-production/` matches only its own
  `dispatchEvent` call. The event is kept because it is a documented part of the contract, but it is
  now dispatched from an `animationiteration` handler rather than from bespoke packet bookkeeping.

- Observation: the shipped byte cost is **essentially unchanged**, which was not what was expected.
  Driving capsules from CSS removed the live-packet budget, the per-node cooldowns, the hover and
  focus packet triggers, and the `requestAnimationFrame` visibility loop — but the new routing rules
  (leg relaxation, true arcs, device-pixel snapping, obstacle avoidance, lane extension) cost about
  the same. Net: 12,538 → 12,002 raw, 4,870 → 4,868 gzipped. A 536-byte saving raw, and two bytes
  gzipped.
  Evidence: `for f in dist/_astro/Layout.astro_astro_type_script_index_0_lang.*.js; do echo
  "raw=$(wc -c < "$f") gz=$(gzip -c "$f" | wc -c)"; done` before and after. The lesson is that the
  win here was in what the motif looks like, not in what it weighs; do not claim a size win that was
  not measured.

- Observation: two separate near-misses proved the routing guards were being written against the
  wrong quantity. The hero nav's column starts at x=859.77 and the lane's conservative right limit
  landed at 859.41 — so a node fell back to the rail, and drew a second full-width horizontal, over
  **0.36 of a pixel**. Testing where the stub would actually land, rather than where the node begins,
  fixed it.
  Evidence: measured `navLocal.left = 859.765625` against `lane.from - minLeg = 859.41` in the
  browser.

- Observation: `getClientRects()` returns line boxes for an inline element but a single border box
  for a block, so the old first-line measurement silently landed on the *last* line of a paragraph.
  A `Range` over the element's contents returns line boxes either way.
  Evidence: the hero lede's `getClientRects()[0]` returned `{top: 308, height: 57}` — two lines — and
  the run drew under the second one.

- Observation: the mobile hero has no gap to route a lane through. The headline and the lede sit
  directly against each other, so a fixed 56px drop put a 4px bus straight through the first line of
  the paragraph. Two rules fixed it and both generalise: the lane is lifted clear of the first node
  below the source, and a stub off the lane must clear every other node's box or the node is fed from
  the rail instead.
  Evidence: at 390px the lede's first line spans y=243 to y=265 region-local and the lane wanted
  y=264.

- Observation: **the capsule was longer than the corner it had to turn.** At 26px on a 12px radius,
  `L/2 > R`, so a straight element is not even a chord of the arc — its tips fly right off the pipe
  at every bend, which is what made the travelling light read as a stray coral diagonal beside the
  trace. Cut to 8px, the worst tip deviation measured over the whole route is 0.669px, inside the
  bore's own 1px half-width.
  Evidence: sampled every 1px along the 1,068px hero route in the browser, projecting both tips from
  the path tangent and measuring the nearest distance back to the path. Before: `L/2 = 13 > R = 12`,
  deviation unbounded. After: `worstTipDeviationPx: 0.669`. This constraint is now written into the
  design language and into the token's own comment, because it is not obvious and it silently
  reappears the moment somebody makes the capsule longer.

- Observation: the half-capsule overhang at the very start and end of a route is real but invisible —
  the keyframes hold the capsule transparent for the first 10% and last 10% of its travel, which is
  ~107px on the hero route, far more than the 4px overhang.
  Evidence: the same sweep reports a 4px worst deviation at length 0 and at the path end, and none
  in between.

- Observation: both text terminations were wrong, in opposite directions. A run arriving horizontally
  ran `--circuit-text-run` *past* the leading edge and capped under the glyphs, leaving a stray dash
  under the first two letters of the lede. A run dropping from the lane stopped on the node's line
  box top, which is where the ascenders start, leaving the cap floating in the gap above the type.
  Both now land on the baseline at the leading edge — where an underline would begin.
  Evidence: the hero lede's spur was `M -27.59 447 L 40.41 447` (40px past `box.left = 0.41`) and is
  now `M -27.59 447 L 0.41 447`; the nav drop ended at y=461 (`box.top`) and now ends at y=483 (the
  baseline), against a measured `line.top - box.top` of 0.

- Observation: `offset-path` needs its own coordinate origin. Capsules are HTML spans in a sibling
  overlay rather than SVG children, so the overlay must be positioned on exactly the same box as the
  `<svg>` for the shared path data to line up. Both are `position: absolute; inset: 0;` on the
  region, which the SVG already relied on.

## Decision Log

- Decision: keep the existing three-layer architecture — pure geometry in `geometry.ts`, DOM and
  lifecycle in `engine.ts`, presentation in `circuit.css` — and rewrite the grammar inside it,
  rather than starting a new component from scratch.
  Rationale: the architecture is not the problem. It already gives declarative opt-in through data
  attributes, per-layout responsive re-routing, correct measurement under `Bend`'s transforms, and
  unit-tested routing maths. The defects are all in the grammar the router expresses. Replacing the
  architecture would discard working responsive behaviour and 27 passing tests to fix a problem
  neither of them causes.
  Date/Author: 2026-08-16, Claude.

- Decision: guarantee the corner radius by enforcing a minimum leg length, instead of capping the
  radius at half the shorter leg.
  Rationale: capping is what produced seven rendered radii from one token. Enforcement inverts the
  failure: a corner is either exactly 12px or it does not exist, and a jog too small to hold two
  corners is collapsed rather than drawn as an S-curve.
  Date/Author: 2026-08-16, Claude.

- Decision: branches tap the nearest existing run — the lane if the node sits under it, the rail
  otherwise — instead of always branching off the rail.
  Rationale: this is the single change that removes the doubled parallel runs and the 1,900px
  detour. It is also what a real schematic does: you tap the bus where it passes over you.
  Date/Author: 2026-08-16, Claude.

- Decision: the rail runs the height of its region unconditionally and terminates in a cap, rather
  than stopping at the furthest junction.
  Rationale: with branches now tapping the lane, the rail would often have no junction below the
  turn and would collapse to nothing, taking the label with it. Making it structural gives the
  gutter a deliberate vertical and a place for the label to live.
  Date/Author: 2026-08-16, Claude.

- Decision: reduce the corner radius from 16px to 12px.
  Rationale: at 390px the rail sits 18px from the screen edge and a 16px sweep pushes its tangent
  past it, which is part of why the old system needed a mobile radius override at all. 12px clears
  at every width, so one radius works everywhere and the breakpoint override can be deleted.
  Date/Author: 2026-08-16, Claude.

- Decision: keep one pipe section at every breakpoint and delete the mobile weight overrides.
  Rationale: the overrides moved to 3px and 1.5px strokes, and 1.5px cannot render crisply at DPR 1
  under any alignment. What should thin out on a small screen is density — labels and fittings — not
  the section itself.
  Date/Author: 2026-08-16, Claude.

- Decision: snap geometry to device pixels by correcting for the overlay's fractional offset, rather
  than snapping region-local coordinates.
  Rationale: the overlay's own left edge is fractional (57.59px at 1440px), so rounding region-local
  coordinates to integers does not put anything on a device pixel. The correction has to include the
  overlay's offset.
  Date/Author: 2026-08-16, Claude.

- Decision: drive capsules with `offset-path` in CSS, feature-gated on `CSS.supports`, with no
  motion at all as the fallback.
  Rationale: `stroke-dashoffset` repaints the whole path each frame. `offset-path` resolves to a
  transform. Gating on `CSS.supports` keeps a single code path — there is no second animation
  implementation to keep in step — and the un-enhanced state is a complete, finished drawing rather
  than a broken one.
  Date/Author: 2026-08-16, Claude.

- Decision: declare a node's attachment explicitly with `data-circuit-attach` at every call site
  instead of inferring it from `data-circuit-flash`.
  Rationale: inferring a structural property from a presentational class is what produced a `port`
  fitting laid across a divider the hero nav does not have. Attachment describes what physically
  exists at the node; the flash describes how it lights up. They are different questions.
  Date/Author: 2026-08-16, Claude.

- Decision: a branch may **rise** from the lane onto a node's bottom edge, not only drop onto its top
  edge.
  Rationale: the contact band bottom-aligns its actions column with a very tall heading, so every
  node in it sits above the lane. Without a rise the only route left was a rail tap, which dragged a
  950px horizontal straight across the heading. The rise is the same stub in the other direction and
  costs four lines.
  Date/Author: 2026-08-16, Claude.

- Decision: the lane may run out past the trunk that feeds it, capped at its far end, with the trunk
  teeing in.
  Rationale: a node to the right of the source could otherwise never be dropped onto, because the
  lane only ever existed between the source and the rail. This is also a better schematic: a bus that
  extends past where it is fed, and is terminated where it stops.
  Date/Author: 2026-08-16, Claude.

- Decision: move `BUS_02`'s source from the projects heading to the section eyebrow above it, and
  make the contact band's node the whole actions column rather than the link inside it.
  Rationale: both are composition problems the router cannot solve. The first card's own top rule
  sits 15px below the projects heading's lane, which is the "two parallel horizontals" defect in
  miniature; leaving from the eyebrow gives the lane 76px of clearance. And a rise onto the contact
  *link* passed up through the email address underneath it, where a rise onto the column lands below
  both.
  Date/Author: 2026-08-16, Claude.

- Decision: text is terminated at its leading edge on its baseline, and only the source runs *along*
  a baseline.
  Rationale: the original grammar said a run meeting text "travels the baseline for `--circuit-text-run`
  and stops, becoming the rule the text has not got". On screen that is a dash dying inside a word. A
  run that stops where the type begins reads as arriving at it; a run that carries on underneath
  reads as a mistake. The source is the exception because it has to get out from under the word it
  starts at.
  Date/Author: 2026-08-16, Claude.

- Decision: add no new dependencies.
  Rationale: everything needed — `offset-path`, `IntersectionObserver`, `ResizeObserver`, SVG arcs —
  is platform. A motion library would ship more bytes than the entire motif currently costs.
  Date/Author: 2026-08-16, Claude.

## Outcomes & Retrospective

**Achieved.** The homepage's pipework now obeys one grammar. Measured on the running site at 1440px:
every arc in every bus reports a radius of `12` and nothing else; **zero** emitted coordinates land
off the device pixel grid across all three buses; every open end carries a terminator (`BUS_01` five
caps for three open ends and two nodes, `BUS_02` three caps and two ports, `BUS_03` five caps
including the extended lane's own end). The hero's 1,900px detour is gone: one lane crosses the page
and one 65px vertical drops onto the links. The projects section's two 63px hooks are gone: each card
is now met at the leading end of its own top rule, so the rule reads as reaching out to the bus. The
contact band, which previously drew a 950px horizontal across its own heading, now runs a lane below
the heading and rises 62px onto the actions column.

**Verified.** Chrome 143 at 1440x900 and 390x844, dark and light, homepage and `/about`. No console
errors, no horizontal overflow, `offset-path` supported and capsules moving on a 23s cycle. Reduced
motion verified by CSS rule inspection rather than by emulating the preference — the tooling
available here cannot set `prefers-reduced-motion`, and this is stated plainly rather than claimed.
Firefox and Safari were **not** opened; see the summary for what that means.

**What remains.** Three things, none blocking:

1. Firefox and Safari, desktop and iOS, are unverified. The structural layer uses only SVG arcs and
   `non-scaling-stroke`, which are universal; the risk is confined to `offset-path` on an HTML
   element, and the `CSS.supports` gate means the failure mode is "no capsule", not "broken page".
2. The byte cost did not fall the way it was expected to. It is 4,868 gzipped, essentially unchanged.
3. `knip` still reports `src/lib/circuit/engine.ts` and `index.ts` as unused files. This is
   pre-existing — the same report comes back from the pre-change tree — and is an artefact of knip not
   following imports out of an Astro `<script>` block.

**Lessons.** Two worth keeping. First, the fix for "this looks accidental" was almost never a new
mark; it was removing a *choice* the router was making badly. Guaranteeing the radius by relaxing the
polyline, rather than capping the radius to fit, replaced seven rendered radii with one and deleted
code. Second, several defects turned out to be composition problems wearing routing costumes: no
routing rule can put a lane between a heading and a paragraph that touch. Those were fixed in markup,
by moving the source, and the plan is better for saying so rather than adding a special case.

## Context and Orientation

You are working in a personal website built with Astro 5 in static output mode, React 19 for a small
number of interactive islands, Tailwind v4, TypeScript, and pnpm as the package manager. Content
comes from Sanity at build time. None of that matters much here: this change is confined to one
self-contained decorative subsystem plus the four places that opt into it.

Some terms, defined because the rest of this plan uses them constantly:

- **The motif** — thin decorative lines drawn over a page section, with corners, small tick marks,
  dots, and a rotated monospace label like `BUS_01`.
- **A region** — any element carrying a `data-circuit="NAME"` attribute. The motif is drawn inside
  it and nowhere else.
- **The source** — the element inside a region carrying `data-circuit-source`. The pipework leaves
  from here. In practice this is always a heading or a run of text.
- **A node** — an element inside a region carrying `data-circuit-node="id"`. The pipework arrives
  here.
- **The trunk** — the run from the source out to the page gutter.
- **The lane** — the horizontal part of the trunk, sitting a fixed distance below the source.
- **The rail** — the vertical run down the page gutter.
- **A branch** (or **spur**) — a short run from the trunk or the rail to one node.
- **A fitting** — a small mark dressing a joint: a tick across a pipe, a plate closing an end, a dot
  on a terminal.
- **A capsule** (previously "packet") — the small coral mark that travels the pipe.
- **Region-local pixels** — coordinates measured from the top-left of the region's overlay, in CSS
  pixels. All geometry works in these.

Files you will touch, all paths from the repository root:

- `src/lib/circuit/geometry.ts` — pure routing maths, no DOM access at all. Rewritten.
- `src/lib/circuit/engine.ts` — builds the SVG, measures elements, owns lifecycle. Rewritten.
- `src/lib/circuit/index.ts` — three-line re-export. Unchanged.
- `src/design-system/circuit.css` — presentation. Rewritten.
- `src/design-system/tokens.css` — the `CIRCUIT` block at roughly lines 237-279, and the
  `@media (max-width: 47.9375rem)` block at roughly lines 347-368. Retokened.
- `src/design-system/themes/light.css` and `themes/dark.css` — the circuit colour block at roughly
  lines 43-52 in each. Retokened. Both files must define the same role names.
- `tests/circuit-geometry.test.ts` — rewritten to match the new exports.
- `src/pages/index.astro` — the `BUS_01` and `BUS_02` markup.
- `src/components/work/ContactBand.astro` — the `BUS_03` markup.
- `src/components/work/WorkCard.astro` and `src/components/ui/ButtonLink.astro` — the attributes they
  forward.
- `src/components/layout/Layout.astro` — the `PAGE_BUS` markup and the boot script.
- `ARCHITECTURE.md` — the `Circuit (Data Bus Overlay)` section under `Cross-Cutting Concerns`.

Two invariants that already exist and must survive, because breaking either produces bugs that are
hard to see:

1. **Coordinates are measured against the overlay, not the region.** The overlay is an absolutely
   positioned child, so it fills the region's *padding* box. Measuring against the region would
   offset everything by the region's padding, which is large on the contact band. Measuring against
   the overlay also keeps geometry correct under the page-bend effect in
   `src/components/canvasui/Bend.tsx`, which applies a 3D transform to the whole page on desktop.
2. **`src/components/canvasui/Bend.tsx` owns the scroll container and swaps it when it activates.**
   Anything binding to scroll must listen in the capture phase rather than binding to a node that
   may be replaced.

Two supporting documents. `docs/design-docs/circuit-audit-2026-08.md` records what was wrong and
what the measured values were. `docs/design-docs/circuit-design-language.md` is the grammar this
plan implements; where this plan and that document disagree, that document wins and this one should
be corrected.

## Plan of Work

The work is six milestones. Each leaves the site in a working state, and the first three are the
substance.

### Milestone 1 — the router

Rewrite `src/lib/circuit/geometry.ts`. It stays a pure module: no `document`, no `window`, no
measurement. It receives boxes in region-local pixels and returns path strings and fitting
positions.

What is new relative to the old file:

- **A snapping helper.** `busRoute` takes a `snap` function in its options and applies it to every
  vertex it emits. The engine supplies one that corrects for the overlay's fractional offset.
- **True circular arcs.** `orthogonalPath` emits `A r r 0 0 sweep x y` for each corner instead of
  `Q corner exit`. The sweep flag is derived from the cross product of the incoming and outgoing
  directions.
- **`relaxLegs`.** Before pathing, the vertex list is passed through a relaxation that guarantees
  every interior leg is at least `minLeg` long, by collapsing a jog whose middle leg is too short
  onto the longer of its two neighbours. This is what makes the radius unconditional.
- **Tap selection.** `branchShape` now decides between tapping the lane and tapping the rail, per the
  design language's routing rules, instead of always tapping the rail.
- **A structural rail.** The rail always runs to `railBottom`, supplied by the engine as the region
  height less an inset, and always ends in a `cap`.
- **A terminator for every path end.** `busRoute` returns one `cap` or `port` fitting per open end,
  and the tests assert that the count of terminators equals the count of open ends.

The exported surface, which the engine and the tests both depend on:

    export type FittingKind = 'elbow' | 'tap' | 'cap' | 'port' | 'node' | 'bracket';

    export interface Fitting {
      kind: FittingKind;
      at: Point;
      angle: number;   // degrees; the bearing the pipe runs through the fitting
    }

    export interface RouteSpec {
      id: string;
      box: Box;                       // region-local pixels
      attach: 'box' | 'rule' | 'text';
      lane: 'auto' | 'rail';          // 'rail' forces a rail tap
    }

    export interface RouteOptions {
      width: number;
      height: number;
      railX: number;
      railBottom: number;
      drop: number;
      textRun: number;
      pinGap: number;
      radius: number;
      minLeg: number;
      minBranch: number;
      tickClearance: number;
      snap: (value: number) => number;
    }

    export interface Branch {
      id: string;
      route: string;    // full source-to-node path; the capsule rides this
      spur: string;     // tap-to-node only, so shared pipe is never stroked twice
      tap: Point;
      terminal: Point;
      axis: 'x' | 'y';
    }

    export interface BusLayout {
      origin: Point;
      railX: number;
      trunk: string;    // one path: source to rail to railBottom. Never split into arms.
      branches: Branch[];
      fittings: Fitting[];
      label: Point;
    }

    export function orthogonalPath(points: readonly Point[], radius: number): string;
    export function relaxLegs(points: readonly Point[], minLeg: number): Point[];
    export function busRoute(origin: Point, specs: readonly RouteSpec[], options: RouteOptions): BusLayout;

Note `trunk` is a single string rather than the old array of arms. Because the rail now always runs
downward from the lane to `railBottom`, the "second upward arm" case that produced the unswept
corner cannot arise.

Rewrite `tests/circuit-geometry.test.ts` alongside. It must cover, at minimum: arcs are emitted with
one radius; a leg shorter than `minLeg` is relaxed away rather than drawn; a node under the lane taps
the lane; a node not under the lane taps the rail; the rail reaches `railBottom`; every open end has
a terminator; a `rule` attachment produces a `port` and a `box` attachment produces a `cap`; and
`snap` is applied to emitted coordinates.

### Milestone 2 — the tokens

Replace the `CIRCUIT` block in `src/design-system/tokens.css` with the names in the design language,
and **delete** the `@media (max-width: 47.9375rem)` circuit override block entirely. Replace the
circuit colour block in both theme files with the seven roles the design language names. Both theme
files must define the same names — a role present in one and missing from the other is a bug.

### Milestone 3 — the engine

Rewrite `src/lib/circuit/engine.ts`. It keeps its existing responsibilities and loses the packet
machinery.

Kept: building the overlay, reading tokens off computed style, measuring the source's last glyph and
each node's box, resolving attachment, recomputing on `resize` and `ResizeObserver`, capture-phase
scroll listening, and re-laying out after `document.fonts.ready`.

New: a `snapFor(regionBox)` factory producing the device-pixel snap function; painting the six-part
fitting vocabulary as strokes rather than rect fills; a sibling `<div>` overlay holding one capsule
span per node, each with `offset-path` and a per-node `--circuit-travel` duration derived from path
length and `--circuit-packet-speed`.

Removed: `MAX_LIVE_PACKETS`, `NODE_COOLDOWN`, `SOURCE_COOLDOWN`, `sendPacket`, `createPacket`,
`triggerNode`, `triggerSource`, `startHeartbeat`, the `sync`/`scheduleSync` rAF pair, and the hidden
`circuit__measure` path used for `getTotalLength()`. Visibility becomes an `IntersectionObserver`
toggling one class. Length measurement still needs a path element, but only once per layout rather
than per packet.

`circuit:arrive` is dispatched from an `animationiteration` listener on each capsule.

### Milestone 4 — the presentation

Rewrite `src/design-system/circuit.css` for the new class names, add the capsule keyframes, and put
the reduced-motion and no-`offset-path` fallbacks in CSS. The label's `text-transform: uppercase` and
its `48rem` breakpoint rule live here.

### Milestone 5 — the markup

Four call sites. Each node gains an explicit `data-circuit-attach`. The hero gains a second node —
its lede paragraph, attached as `text` — so the bus has two things to serve and the composition is
denser at the page's focal point, per the design language's density rule. `data-circuit-tone` is
deleted from `Layout.astro`.

### Milestone 6 — verification

Chrome at 390, 768, 1024 and 1440, in both themes, with and without `prefers-reduced-motion`.
Confirm no console errors, no horizontal overflow, and that the emitted paths contain exactly one
arc radius. Measure the shipped byte cost. Update `ARCHITECTURE.md`.

## Concrete Steps

All commands run from the repository root, `/Users/hamish/Documents/Personal/astro-blog`.

Start the dev server and leave it running in another terminal:

    pnpm run dev

It serves on `http://localhost:4321/`. A `.env` file with `SANITY_PROJECT_ID` must exist or config
load fails before Astro starts; one is already present in this working tree.

After each milestone, run the tests:

    pnpm run test

Expect, at the end of the work, 44 or more assertions passing and none failing. The output ends with
a summary like:

    # tests 47
    # pass 47
    # fail 0

Then the production build, which also type-checks:

    pnpm run build

`pnpm run build` is `astro check && astro build`, so a type error fails it. Expect it to finish with
`[build] Complete!`.

To measure the shipped byte cost of the motif, after a build:

    ls dist/_astro/Layout.astro_astro_type_script_index_0_lang.*.js

That file is the only client module the motif contributes to. Measure it raw and gzipped:

    for f in dist/_astro/Layout.astro_astro_type_script_index_0_lang.*.js; do
      echo "raw=$(wc -c < "$f") gz=$(gzip -c "$f" | wc -c)"
    done

The baseline before this work was `raw=12538 gz=4870`.

To confirm one radius is used everywhere, load the homepage and read the emitted paths from the
browser console:

    [...document.querySelectorAll('.circuit__pipe')]
      .flatMap(p => [...p.getAttribute('d').matchAll(/A (\d+(?:\.\d+)?)/g)].map(m => m[1]))
      .filter((v, i, a) => a.indexOf(v) === i)

Expect a single-element array, `["12"]`.

To confirm nothing lands off a device pixel, check that every emitted coordinate plus the overlay's
left offset is a whole number:

    const svg = document.querySelector('svg.circuit');
    const left = svg.getBoundingClientRect().left;
    [...svg.querySelectorAll('.circuit__pipe')]
      .flatMap(p => [...p.getAttribute('d').matchAll(/-?\d+(?:\.\d+)?/g)].map(Number))
      .some(n => Math.abs((n + left) % 1) > 0.001 && Math.abs((n + left) % 1) < 0.999)

Expect `false` for the x coordinates. (The check above is deliberately loose because it does not
separate x from y; a stricter version is in `Artifacts and Notes`.)

## Validation and Acceptance

Acceptance is behaviour a human can see, not code that exists.

**The hero no longer doubles back.** Load `http://localhost:4321/` at 1440px wide. Below the coral
words "they're capable of." there is **one** horizontal trace, not two. It leaves the end of the
coral text, steps down once, and runs left to a vertical rail in the gutter labelled `BUS_01`. A
single short vertical drops from that horizontal onto the row of "Projects / Writing / About" links.
Before this change there were two parallel horizontals 32px apart, both spanning the page.

**Every corner matches.** Run the console snippet in `Concrete Steps`. It returns `["12"]`. Before
this change the same page produced radii of 0, 8, 10, 10.53, 14.07, 14.08 and 16.

**Nothing ends in mid-air.** Scroll to the projects section. The two branches that previously hung
off the gutter as 63px hooks now tap the lane above each card and land on the card's top border,
with two tick marks laid along that border. Every visible run terminates in a plate, a pair of ticks
on an existing rule, or a dot.

**Hairlines are crisp.** At 1440px and DPR 1, zoom a screenshot of the hero trace to 400%. The
pipe's two edges are solid single-pixel lines. Before this change each was smeared across two pixel
rows at partial coverage.

**Motion is slow and stops when it should.** Watch the hero for thirty seconds: a small coral capsule
travels the pipe roughly every nineteen seconds, moving steadily with no easing. Scroll the section
out of view and back; it is not running while off screen. In Chrome DevTools, enable
`prefers-reduced-motion: reduce` under Rendering and reload: the traces still render complete, and
no capsule appears at all.

**No layout impact.** Run a Lighthouse or performance trace on `/` and confirm Cumulative Layout
Shift is unchanged from before. The overlay is `position: absolute` and out of flow, so it cannot
contribute; this is a check that it stayed that way.

**Both themes work.** Toggle the theme control in the header. The traces remain visible as structure
in both, and coral appears only on capsules and on the dot a capsule is arriving at — never on a
pipe.

**Tests.** Run `pnpm run test`. The rewritten `tests/circuit-geometry.test.ts` cases fail against the
old `geometry.ts` and pass against the new one; the other four test files are untouched and continue
to pass.

**Build.** Run `pnpm run build` and expect `[build] Complete!` with no type errors.

## Idempotence and Recovery

Every step here is an ordinary file edit under version control. There are no migrations, no data
changes, and nothing to clean up outside the working tree. Re-running `pnpm run test` and
`pnpm run build` is safe any number of times.

If a milestone goes wrong, `git checkout -- <path>` on the touched files restores the previous
state; the motif is self-contained enough that reverting `src/lib/circuit/`,
`src/design-system/circuit.css` and the token blocks together returns the site to a working state
even if the markup changes are kept, because unknown data attributes are simply ignored.

The one ordering constraint: the engine reads token names off computed style with numeric fallbacks
baked in, so Milestone 3 will silently use fallback values if Milestone 2 has not landed. Do them in
order, or expect the geometry to look plausible but not match the tokens.

Screenshots taken during verification go to a scratch directory and are not committed. `dist/` is
never committed.

## Artifacts and Notes

The defect this whole plan exists to fix, as emitted by the old router on the homepage hero at
1440px. Source at x=926, node at x=884:

    trunk: M 926.56 340.13 L 910.64 340.13 Q 896.56 340.13 896.56 354.21
           L 896.56 354.21 Q 896.56 368.28 882.49 368.28
           L -12.8 368.28 Q -28.8 368.28 -28.8 384.28 L -28.8 400.28
    spur:  M -28.8 400.28 L 867.77 400.28 Q 883.77 400.28 883.77 416.28 L 883.77 461.06

Note the `L 896.56 354.21` of zero length between two sweeps, the three different radii, and the
895px journey left followed by the 896px journey back.

A stricter device-pixel check than the one in `Concrete Steps`, which separates x from y by walking
the path commands in pairs:

    const svg = document.querySelector('svg.circuit');
    const box = svg.getBoundingClientRect();
    const off = { x: box.left, y: box.top };
    const bad = [];
    for (const p of svg.querySelectorAll('.circuit__pipe')) {
      const nums = [...p.getAttribute('d').matchAll(/-?\d+(?:\.\d+)?/g)].map(Number);
      // M/L take x,y pairs; A takes rx,ry,rot,laf,sf,x,y — checked loosely by parity
      nums.forEach((n, i) => {
        const frac = Math.abs(((i % 2 ? n + off.y : n + off.x) % 1 + 1) % 1);
        if (frac > 0.01 && frac < 0.99) bad.push([p.className.baseVal, i, n]);
      });
    }
    bad.length;

## Interfaces and Dependencies

**No new dependencies.** Everything used is platform: SVG arc commands, `offset-path` and
`offset-distance`, `IntersectionObserver`, `ResizeObserver`, `document.fonts.ready`, and
`CSS.supports`. A motion library would ship more bytes than the entire motif costs today.

Browser features and how they are handled:

- **SVG `A` arc commands** — universal. No gate.
- **`vector-effect: non-scaling-stroke`** — universal. No gate.
- **`ResizeObserver`** — already gated with `typeof ResizeObserver !== 'undefined'` in the existing
  engine; keep the gate.
- **`IntersectionObserver`** — universally supported in every browser this site targets. If absent,
  regions are treated as always visible, which is the safe direction.
- **`offset-path: path(...)`** — Chrome 55+, Firefox 72+, Safari 16+. Gated on
  `CSS.supports('offset-path', 'path("M 0 0 L 1 1")')`. When false, no capsule elements are created
  at all and the structure renders complete. This is the progressive-enhancement baseline the
  hard constraints require.
- **`animation-timeline: scroll()` / `view()`** — deliberately **not used**. `ARCHITECTURE.md`
  records a decision that the structural layer must render on the first geometry pass rather than
  tracing in as regions enter the viewport, so there is no scroll-linked reveal to drive. Visibility
  gating is a binary play/pause, which `IntersectionObserver` does with full support today.

In `src/lib/circuit/geometry.ts`, define the exports listed under Milestone 1 above.

In `src/lib/circuit/engine.ts`, keep the single public export:

    export function initCircuit(): void;

The markup contract, which is the interface the rest of the site codes against:

    <section data-circuit="BUS_01">
      <p data-circuit-source>…</p>
      <a data-circuit-node="start"
         data-circuit-attach="rule"
         data-circuit-flash="edge"
         data-circuit-lane="auto">…</a>
    </section>

    data-circuit         the bus name, rendered as the rotated label. Required on a region.
    data-circuit-source  the element the pipework leaves. Required, exactly one per region.
    data-circuit-node    a node id. Required, at least one per region.
    data-circuit-attach  box | rule | text. What physically exists at the node for the run to
                         land on. Explicit; there is no inference from the flash.
    data-circuit-flash   ring | edge | underline. How the node acknowledges an arrival.
                         Presentational only.
    data-circuit-lane    auto | rail. Forces a rail tap for a node that would otherwise tap the
                         lane. Optional, defaults to auto.

A region with `data-circuit` but no source, or no nodes, renders nothing and logs nothing. This is
pre-existing behaviour and a known footgun recorded in `AGENTS.md`; it is unchanged.

## Change note

2026-08-16 (second revision) — Revised after implementation. Four routing rules were added that the
first version did not anticipate, each recorded in the `Decision Log` and each driven by a concrete
defect found on screen rather than by design: the lane may run past its own feed and be capped, a
branch may rise as well as drop, the lane is lifted clear of the first node below the source, and a
stub must clear every other node's box. Two composition fixes moved a `data-circuit-source` rather
than adding a special case to the router. The claimed byte saving in `Surprises & Discoveries` was
replaced with the measured one, which is far smaller; the original figure had been written before
the build was run and was wrong. The label breakpoint moved from 48rem to 80rem after measuring.

2026-08-16 — Initial version of this plan, written after the audit in
`docs/design-docs/circuit-audit-2026-08.md` and the grammar in
`docs/design-docs/circuit-design-language.md`. The plan is scoped to rewriting the grammar inside
the existing three-layer architecture rather than replacing that architecture, for the reason
recorded in the first Decision Log entry.
