# Circuit motif — audit and critique (August 2026)

Audit of the "pipe" motif as it stands before the rebuild. Measurements were taken from the
running dev server at 1440x900 and 390x844, DPR 1, dark and light themes, by reading the SVG the
engine actually emits rather than by reading the source. Every number below is observed output,
not intent.

The successor design language is `circuit-design-language.md`. The rebuild is
`docs/exec-plans/2026-08-16-circuit-rebuild.md`.

## Where the motif lives

There is exactly one implementation. It is not a scatter of one-off SVGs.

| Piece | Path | What it owns |
|---|---|---|
| Routing maths | `src/lib/circuit/geometry.ts` (399 lines) | Pure, region-local pixel maths. Unit tested by `tests/circuit-geometry.test.ts` (27 cases). |
| DOM/SVG/lifecycle | `src/lib/circuit/engine.ts` (730 lines) | Builds the overlay, measures elements, animates packets. |
| Presentation | `src/design-system/circuit.css` (217 lines) | Stroke colours, fitting fills, node flash states. |
| Geometry + timing tokens | `src/design-system/tokens.css` lines 237-279, plus a `max-width: 47.9375rem` override block at 347-368 | 26 custom properties, read off computed style by the engine. |
| Colour tokens | `src/design-system/themes/{light,dark}.css` lines 43-52 | 10 roles per theme. |
| Boot | `src/components/layout/Layout.astro` line 375 | One `initCircuit()` per page. |

Authored instances, all declarative via data attributes:

- `src/pages/index.astro:22` — `BUS_01` on the hero, source is the coral accent span, one node (the
  hero nav, `data-circuit-flash="edge"`), rail anchored to `.home-hero__lower`.
- `src/pages/index.astro:66` — `BUS_02` on the projects section, source is the `Things I built`
  heading, two nodes (the two `WorkCard`s, which set `flash="edge"` in `WorkCard.astro:21`).
- `src/components/work/ContactBand.astro:19` — `BUS_03`, source is the band heading, one node.
- `src/components/layout/Layout.astro:337` — `PAGE_BUS`, a layout-owned quiet bus on internal
  pages, three zero-size `<span>` anchors positioned at `top: var(--spacing-8)`, `46%` and `84%`.

Implementation technique: **JS-generated SVG paths, measured from real element rects on every
layout pass.** Not background images, not CSS borders, not hardcoded coordinates. A `ResizeObserver`
watches the region, the source and every node; `resize` triggers a relayout; scroll is listened to
in the capture phase because `Bend.tsx` swaps the scroll container.

### Measured properties as shipped

- **Stroke widths:** `--circuit-wall-weight: 4px` and `--circuit-bore-weight: 2px` on identical path
  data, so a run reads as two 1px edges 3px apart. Packets are 2px core plus an 8px halo. Fittings
  are `<rect>` fills 1px or 2px wide. At the mobile breakpoint these become 3px / 1.5px / 1.5px / 6px.
- **Colour:** dark `--circuit-wall: rgb(120 131 122 / 0.58)`, bore `rgb(7 9 8 / 0.85)`; light wall
  `rgb(84 92 82 / 0.38)`, bore `rgb(253 253 251 / 0.92)`. Coral appears on packets, live junction
  dots, and node glow.
- **Corner radius:** requested `--circuit-bend-radius: 16px` (12px mobile), but capped per corner at
  half the shorter adjacent leg.
- **Dash pattern:** structure is solid. The only dashes are packets, set imperatively as
  `stroke-dasharray: pulseLength (length + pulseLength*2)`.
- **Caps and joins:** `stroke-linecap: butt`, `stroke-linejoin: round` on walls, bores and packets.
- **Positioning:** absolutely positioned overlay, `inset: 0`, `overflow: visible`, `aria-hidden`,
  `pointer-events: none`, `preserveAspectRatio="none"`, `viewBox` set to the overlay's pixel size so
  user units are 1:1 with CSS px. `vector-effect: non-scaling-stroke` on paths. Survives resizing
  correctly — geometry is recomputed, not scaled.
- **Animation:** Web Animations API, `strokeDashoffset` keyframes, linear, duration derived from
  `getTotalLength()` and `--circuit-packet-speed: 1250` px/s. An idle heartbeat every 11s per region
  (18s for `PAGE_BUS`), plus packets on `pointerenter`, `focusin` and `click`. Capped at 3 in flight
  document-wide. `prefers-reduced-motion` suppresses packets, lamps and heartbeat; structure stays.

None of the plumbing is wrong. The **grammar** is.

## Critique

### 1. The hero bus routes 1,900px to connect two things 120px apart

This is the worst defect and it is the one visible in the screenshot. Observed `BUS_01` output at
1440px:

    trunk: M 926.56 340.13 L 910.64 340.13 Q 896.56 340.13 896.56 354.21
           L 896.56 354.21 Q 896.56 368.28 882.49 368.28
           L -12.8 368.28 Q -28.8 368.28 -28.8 384.28 L -28.8 400.28
    spur:  M -28.8 400.28 L 867.77 400.28 Q 883.77 400.28 883.77 416.28 L 883.77 461.06

The source sits at x=926. The node sits at x=884. The bus travels **895px left to the gutter spine,
turns down 32px, then travels 896px back right**, and only then drops to the node. `busRoute` always
routes every branch off the shared spine, whether or not the spine earns it.

The visible result is two near-identical horizontal rules crossing the full page width, 32px apart,
both ending in the same little S-jog. It does not read as a bus. It reads as a ruled line that got
drawn twice by mistake.

### 2. Nine different corner radii across three buses on one page

`bendsFor` caps each corner at `min(bendRadius, legBefore/2, legAfter/2)`. Because leg lengths come
from live layout, the cap fires constantly and silently. Measured radii on the homepage:

| Bus | Corner radii in the emitted paths |
|---|---|
| `BUS_01` | 14.08, 14.07, 16.00 (trunk); 16.00 (spur) |
| `BUS_02` | 10.53, 10.53, 16.00, 16.00 (trunk); 10.00, 10.00 (spurs) |
| `BUS_03` | 8.00, 8.00, **0.00** (trunk); 16.00 (spur) |

Seven distinct radii, none of them the 16px the token asks for except by luck. The design intent
("one radius") exists in the token and is destroyed by the implementation.

### 3. One corner on the page is a hard, unswept 90°

`BUS_03`'s trunk is `... L 475.93 520.5 L -28.8 520.5` and then a *separate* path
`M -28.8 520.5 L -28.8 20`. The vertex where the trunk turns up the spine is the last point of one
path and the first point of another, so `bendsFor` never sees it as an interior vertex and it gets
no sweep at all. Every other corner in the same drawing is rounded. This is the "corners are
inconsistent" complaint in its purest form: it is not a bad radius, it is a missing one.

### 4. Two sweeps back to back with zero straight between them

In `BUS_01`'s trunk the segment `Q 896.56 340.13 896.56 354.21 L 896.56 354.21 Q 896.56 368.28 ...`
has an `L` command of **zero length** — the exit tangent of the first sweep is the entry tangent of
the second. The 28px vertical step is entirely consumed by two 14px sweeps, so what should be a
crisp two-corner step renders as a soft S-curve. At 390px the same step *does* get a 6px straight,
because the radius token is smaller there. The corner treatment therefore changes between
breakpoints as a side effect, not as a decision.

### 5. Trunk and spur are drawn on top of each other

`BUS_02`'s trunk ends its horizontal at `L -12.8 158.78` before sweeping down; its first spur starts
`M -28.8 158.78 L 14 158.78`. The two overlap along y=158.78 across the sweep region. Because walls
and bores are grouped separately, the doubled wall shows through as a heavier, muddier segment
exactly where the junction dot and two tee bands also sit. The top-left of the projects section is
the messiest 40px on the site.

### 6. Branches that terminate in mid-air

`BUS_02`'s spurs are, in full:

    M -28.8 158.78 L 14 158.78 Q 24 158.78 24 168.78 L 24 178.78

42px right, a 10px sweep, then a **20px drop that stops**. It is a 63px hook hanging off the spine
next to a card, dressed with two tee bands and a junction dot. It connects nothing to nothing. The
`--circuit-top-lane: 20px` clearance *is* the entire visible drop.

### 7. The hero's terminator is a connector for a joint that does not exist

The hero nav carries `data-circuit-flash="edge"`, which `resolveAttach` maps to `attach: 'rule'`,
which makes `busRoute` emit a `tee` — two bands laid *across a divider*. But `.home-hero__links` has
no border. The bands are laid across nothing. In the light-theme screenshot the drop visibly stops
in the whitespace above "Projects" with two ticks floating beside it.

Meanwhile the `terminal`/flange fitting — the one terminator designed to close a run against a face
— **is never drawn anywhere on the homepage**, because all four authored nodes use `flash="edge"`.
A third of the terminator vocabulary is dead code in practice.

### 8. Every coordinate is fractional, so every hairline is blurry

Observed y values: 340.13, 354.21, 368.28, 400.28, 461.06, 826.41, 520.5. The overlay's own left is
57.59px. Nothing lands on a device pixel boundary. A 4px wall centred on y=368.28 covers 366.28 to
370.28, so its two visible 1px edges are each split across two pixel rows at partial coverage. The
pipe's whole identity is those two 1px edges, and they are being rendered at roughly half strength
smeared over two rows. This is why the traces look soft and tentative rather than drawn.

The mobile override makes it worse by moving to **odd and fractional weights** — 3px wall, 1.5px
bore, 1.5px packet. A 1.5px stroke cannot be crisp at DPR 1 under any alignment.

### 9. Fittings and pipes are different kinds of object

Pipes are strokes with `vector-effect: non-scaling-stroke`. Fittings are `<rect>` fills with
`vector-effect: none`, positioned at fractional coordinates like `x="877.27"`. They are 1px wide
fills, which is the least robust way to draw a 1px line in SVG. The two halves of the vocabulary do
not share a rendering model, so they cannot be guaranteed to agree.

The `origin` fitting is geometrically identical to a `collar` — same 1px x 10px bar, same primitive,
same rotation — and differs only in fill token. Two names, one shape.

### 10. Junction dots change colour for a reason nobody can perceive

All four junction dots are `r="1.6"` (3.2px diameter, fractional centres). `BUS_01`'s renders coral
because its region is energised; `BUS_02`'s and `BUS_03`'s render grey because theirs are not. On a
single screenshot you get identical marks in two colours with no available explanation. Coral is
supposed to mean "active", and here it means "happens to be the region you scrolled to first".

### 11. The label is placed by a magic number and disappears without a rule

`layoutRegion` sets `labelX = spineX - 8`. The 8 is a literal in `engine.ts:498`, not a token, while
every other offset in the system is tokenised. The label is then hidden if
`regionBox.left + labelX < 16` (`LABEL_MIN_GUTTER`). At 390px all three labels vanish. That is
plausible behaviour, but it is a runtime fits/doesn't-fit test rather than a declared breakpoint, so
the label can wink out at an arbitrary width nobody designed.

Casing is not enforced either: the label prints `data-circuit`'s raw value with no `text-transform`,
so a lowercase attribute would render lowercase.

### 12. The packet's light escapes the pipe it is supposed to be inside

`--circuit-packet-halo-weight: 8px` against a 4px wall. The halo is twice the width of the entire
pipe section. The stated concept is light travelling the bore; the rendering is a soft coral smudge
sitting on top of, and well outside, the pipe. It is the one place coral touches the structure layer
and it is the least controlled mark on the page.

Packets also animate `stroke-dashoffset`, which forces a repaint of the full path each frame — on
`BUS_02` that path is 1,000+px long across a 1,591px-tall region.

### 13. Two horizontal runs at the same height as an existing divider

`BUS_02`'s trunk lane sits at y=158.78; the projects section's own `border-top` rule sits ~40px
below it. Two long horizontal lines 40px apart, one structural and one decorative, at the top of the
same section. The motif is competing with the layout's own rules instead of extending them.

### 14. Dead attribute

`data-circuit-tone="quiet"` on `Layout.astro:337` is read by nothing in `engine.ts` or `circuit.css`.

## What is already right and should be kept

Stated plainly so the rebuild does not throw away good work:

- The pure-geometry / DOM-engine / CSS-presentation split, and the unit tests on the geometry half.
- Measuring against the overlay rather than the region, which is what keeps coordinates correct
  under `Bend`'s transforms and inside padded regions.
- Resolving a node's approach edge per layout, so one markup contract works at every breakpoint.
- Declarative opt-in through data attributes rather than per-page SVG.
- Rendering structure on the first geometry pass instead of tracing in on scroll — this is a
  deliberate decision recorded in `ARCHITECTURE.md` and it is the right one.
- `aria-hidden`, `pointer-events: none`, out-of-flow positioning, no layout shift.
- Capture-phase scroll listening because `Bend` swaps the scroller.

## Summary of the defect classes

1. **Routing has no economy.** The spine is used unconditionally, producing detours and doubled
   parallel runs.
2. **Geometry degrades silently.** One radius token becomes seven rendered radii; one corner gets
   none; some straights collapse to nothing.
3. **The drawing is not on a grid.** Fractional coordinates plus odd and fractional stroke weights
   guarantee soft rendering at every DPR.
4. **The vocabulary is incoherent.** Two rendering models, one duplicate primitive, one unused
   terminator, one connector drawn against a joint that is not there, and runs that end nowhere.
5. **Colour carries no reliable meaning.** Coral appears on the structure layer via the halo, and on
   junction dots for reasons the viewer cannot infer.
