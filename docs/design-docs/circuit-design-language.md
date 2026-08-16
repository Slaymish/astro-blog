# Circuit — design language

The visual grammar for the pipework motif. It exists so that every trace on the site looks like it
obeys one set of physical rules, drawn by one hand, at one scale.

The defects this replaces are catalogued in `circuit-audit-2026-08.md`. The rebuild that implements
it is `docs/exec-plans/2026-08-16-circuit-rebuild.md`.

**One sentence:** a single hollow bus leaves a heading, runs the page gutter as a rail, and light
branches tap it wherever they need to — orthogonal, on a 4px module, one corner radius, everything
terminated.

## 1. Stroke scale

Three weights. Each has a meaning, and nothing else may use them.

| Token | Weight | Renders as | Means |
|---|---|---|---|
| `--circuit-weight-bus` | `4px` wall + `2px` bore | a hollow pipe: two 1px edges 3px apart | The trunk and the rail. One per region. Everything else taps this. |
| `--circuit-weight-branch` | `2px` solid | a single line | A spur from the bus to one node. |
| `--circuit-weight-tick` | `1px` solid | a hairline | Fittings and registration marks. Never a route. |

**Why these values hold up at 1x and 2x.** A stroke is centred on its coordinate. An *even* weight
centred on an integer covers whole pixels: 4px at y=368 covers 366-370, 2px covers 367-369. An *odd*
weight needs a half-integer centre: 1px at y=368.5 covers 368-369. The router therefore snaps
even-weight geometry to integers and tick geometry to half-integers, in **device** space — it
corrects for the region's own fractional offset rather than snapping region-local coordinates and
hoping.

No weight changes at any breakpoint. A 4px pipe is a 4px pipe at 390px and at 2560px. What changes
on small screens is **density**, not section. The previous system's 3px / 1.5px mobile override is
removed: 1.5px cannot be crisp at DPR 1 under any alignment.

## 2. Corner geometry

**One radius: `--circuit-radius: 12px`. Rounded elbows. No chamfers anywhere.**

Corners are true circular quarter-arcs (`A 12 12 0 0 sweep x y`), not quadratic approximations. A
quadratic through the corner point has the right endpoints but the wrong curvature, and its apparent
radius drifts with leg length.

12px rather than 16px because at 390px the rail sits 18px from the screen edge; a 16px sweep pushes
its tangent past it. 12px clears at every width, so one radius genuinely works everywhere.

**The radius is guaranteed, not requested.** The router will not emit a leg shorter than
`--circuit-min-leg: 32px` between two turns — twice the radius, plus 8px so a step keeps a visible
straight rather than running one sweep straight into the next. A leg with a free end (the source, a
terminal) needs only half that, since only one of its ends is a corner. A polyline that would produce a
shorter leg is relaxed until it does not — by moving the turn, or by dropping the jog entirely. The
old behaviour, capping the radius at half the shorter leg, is what produced seven different rendered
radii on one page; capping is now forbidden. Either a corner is 12px, or there is no corner.

A consequence worth stating: **two sweeps never sit back to back.** There is always at least 8px of
straight between them, so a step reads as two corners rather than an S-curve.

## 3. Routing rules

- **Orthogonal only.** Horizontal and vertical. No diagonals — admitting one angle would need a
  second corner treatment, and the point of the system is that there is only one.
- **Everything sits on a 4px module** (`--circuit-grid`), measured in the region's own space, then
  offset into device-pixel alignment per §1.
- **The rail shares the type's gutter.** Its x is the centre of `--page-gutter`, clamped so it never
  sits further out than `--circuit-lane: 28px` from the content edge. The type and the pipework are
  set against the same left margin.
- **The lane sits `--circuit-drop: 56px` below the source's baseline**, but never lower than
  `--circuit-pin-gap` clear of the first node underneath it. A lane that runs through a node's own
  box strikes through the type it is meant to serve, and on a narrow screen the hero's headline and
  lede leave nothing but a gap between them.
- **A stub off the lane must clear every other node.** If dropping onto a node would send the stub
  through a paragraph in between, the node is fed from the rail instead.
- **A run crosses the content width at most once per region.** Two long horizontals within
  `2 × --circuit-lane` of each other is a defect, not a look.

## 4. Topology

A region's pipework has exactly three parts, built in this order.

**Trunk.** Leaves the source's last glyph on its baseline, runs `--circuit-text-run: 40px` along that
baseline towards the rail, and elbows down to the lane. If the source is closer to the rail than a
stub allows, it drops straight down instead of jogging outward first.

**Lane.** The horizontal that carries the trunk to the rail. Normally it is the last leg of the trunk
itself. When a node sits to the right of the source, the lane instead runs out **past its own feed**
to reach that node and is capped where it stops, and the trunk **tees** into it rather than elbowing
onto its end. Without this, a node to the right of the source could never be reached except by going
all the way round via the rail — which is exactly the 1,900px detour this rebuild exists to remove.

**Rail.** From the lane down to `regionHeight - --circuit-rail-inset`, ending in a cap. The rail is
**structural**: it runs the height of the region whether or not any branch uses it, and it carries
the label. This is what makes the gutter line read as an intentional edge condition rather than a
leftover.

**Branches.** Each node taps the nearest point of the run that already exists:

- if the node sits below the lane, it taps the **lane** directly above itself and **drops** onto its
  top edge;
- if the node sits above the lane, it taps the lane below itself and **rises** onto its bottom edge —
  which is how a bottom-aligned column beside a tall heading gets served without dragging a run
  across the heading;
- otherwise it taps the **rail** at its own height and runs in.

A node's own attachment overrides this: `text` always arrives along its baseline from the rail, and
`rule` always meets its leading end from the rail, so the divider reads as reaching out to the bus.

These rules are the fix for the worst defect in the old system. Previously every branch was routed
off the rail unconditionally, so the hero's bus travelled 895px to the gutter and 896px back to
reach a node 42px from its source, drawn as two parallel full-width rules. Now the hero nav taps the
lane above it and drops.

## 5. Junction vocabulary

A closed set of six parts. Everything is assembled from these; nothing is drawn ad hoc.

| Part | Drawn as | Appears |
|---|---|---|
| `elbow` | the 12px arc, plus a `tick` across the pipe at each tangent point | every corner; ticks only when both legs are ≥ `3 × radius`, so a dressed corner always has room to be read |
| `tap` | two `tick`s across the bus, `--circuit-tap-spread: 6px` either side of the split | where a branch leaves the trunk or the rail |
| `cap` | a `2px` plate `--circuit-cap-length: 14px` long, across the run, set one plate-thickness outside the end | any run that ends against a face or in space |
| `port` | one `tick`, `--circuit-port-length: 14px`, across the run at the handover | where a branch meets a divider that is already a line in the layout. One mark, not two, so it cannot be confused with a `tap` |
| `node` | a filled dot, `r = 2px` | every branch terminal |
| `bracket` | one `tick` 8px long across the rail at the label's baseline | one per label |

Retired from the old set: `origin` (geometrically identical to a collar — same 1x10 bar, same
rotation, different fill token only), and `flange`, which is folded into `cap`.

Both halves of the vocabulary now render the same way. Pipes and fittings are all **strokes** with
`vector-effect: non-scaling-stroke`; the old system drew fittings as 1px-wide `<rect>` fills at
fractional coordinates, which is the least robust way to put a hairline on screen.

## 6. Terminators

**Nothing stops bare.** Every path end the router produces carries a terminator, and this is
enforced in geometry rather than by convention — `busRoute` emits one terminator fitting per path
end, and the unit tests assert the count.

Three exits, and only three:

- **`cap`** — the run meets a face, or it ends in space. The plate sits *outside* the face so it
  closes the run rather than sinking into it. Used at the source, at the rail's bottom, at any node
  presenting a box, and at a text node's leading edge.
- **`port`** — the run meets a divider that is already a line in the layout (a card's top border, a
  section rule). Bands are laid along that rule, so the branch reads as tapped into it.
- **`node`** — the dot, always, on top of whichever of the above applies.

**Text is finished at its leading edge, on its baseline.** Text has no face to butt into, so a run
meeting it lands where an underline would begin — at the first glyph, on the baseline — from either
direction. A run arriving horizontally stops there rather than carrying on underneath the glyphs,
which left a stray dash under the first two letters. A run dropping from the lane comes down to the
baseline rather than to the top of the line box, which left it hanging in the gap above the type.
The only run that travels *along* a baseline is the trunk leaving its source, for
`--circuit-text-run`, because it has to get out from under the word it starts at.

A `port` may only be used where a rule actually exists. The old system emitted a `tee` against the
hero nav, which has no border, so two bands were laid across nothing. Attachment is now declared
explicitly per node rather than inferred from the flash class.

## 7. Dash rhythm

**Structure is never dashed. Dashing is reserved for motion.**

If it is dashed, it is moving. This removes the question of phase alignment at junctions entirely,
and it means a static screenshot of the site contains no dashed line at all.

## 8. Label style

- Monospace (`--font-mono`), uppercase enforced with `text-transform: uppercase` so a lowercase
  attribute value cannot leak through.
- `--circuit-label-size: 9px`, `--circuit-label-tracking: 0.18em`.
- Rotated -90°, reading bottom-to-top, baseline `--circuit-label-offset: 12px` outboard of the rail.
  A token, not a literal — the old system used a bare `- 8` in `engine.ts`.
- Anchored to the rail's cap, with a `bracket` tick marking its baseline on the rail.
- **Not drawn below `80rem`.** This is a declared breakpoint in CSS, not a runtime "does it fit"
  test. The label should never wink out at a width nobody chose. 80rem because the rail centres in
  half the gutter, the label sits a further 12px outboard, and its rotated glyphs reach 7px past that
  again — at 1024px that leaves one pixel of margin, which is not a margin.

## 9. Colour

Traces sit low in the hierarchy. They are structure, not decoration.

| Token | Role |
|---|---|
| `--circuit-bus` | the bus wall — the lowest-contrast neutral that still reads as a line |
| `--circuit-bore` | the bore — the page background, so the pipe reads as hollow |
| `--circuit-branch` | branch strokes and every tick — one step lighter than the bus |
| `--circuit-label` | the label |
| `--circuit-node` | the terminal dot at rest — neutral |
| `--circuit-node-live` | coral, only while a packet is arriving |
| `--circuit-packet` | coral, the travelling capsule |

**Coral never touches a pipe.** It appears in exactly two places: the capsule in flight, and the dot
it is arriving at. The old system leaked coral onto the structure layer through an 8px packet halo —
twice the width of the entire 4px pipe — which is why the travelling light read as a smudge sitting
on top of the pipe rather than inside it. The capsule is now the bore's width, so it is genuinely
inside the section.

Junction dots do not change colour to indicate which region happens to be energised. A dot is
neutral unless a packet is arriving at it, in both themes.

Structure targets roughly 1.3:1 to 1.6:1 against the page background in both themes: legible as
structure at reading distance, never competing with body text. Both theme files define the same
seven roles, so light and dark stay interchangeable.

## 10. Density

Fittings are earned. Empty regions of the page get nothing.

- **Focal regions** (the hero, the contact band) get the full vocabulary: rail, lane, taps, caps,
  node dots, elbow ticks wherever legs allow, and the label.
- **Secondary regions** (the projects section) get rail, lane, taps, caps and node dots. Elbow ticks
  only where legs allow.
- **Internal pages** get the rail and its caps only — a quiet vertical in the gutter. No label, no
  lane, no taps.
- Everything else gets nothing.

## 11. Motion

Slow and mechanical. Flow through a system, not a toy.

- **One capsule per node route**, riding `offset-path` with `offset-distance: 0% → 100%` and
  `offset-rotate: auto`. `transform` and `opacity` only. No `stroke-dashoffset` — animating it
  repaints the whole path each frame, and on the projects section that path is over 1,000px long
  inside a 1,591px-tall region.
- **Capsules are HTML spans in a sibling overlay, not SVG children.** `offset-path` on plain elements
  is the broadest-supported form of the feature. The overlay shares the SVG's coordinate origin, so
  the same path data drives both.
- **`--circuit-packet-speed: 120px/s`**, linear, no easing. Duty cycle 40% travelling and 60% dark,
  so a region is quiet most of the time. A 900px trunk takes 7.5s to traverse on an 18.75s cycle.
- **The capsule's length is bounded by the corner radius, not by taste.** A straight element riding a
  curve leaves it: a bar of length `L` on radius `R` sits `R - sqrt(R² - (L/2)²)` off the arc at its
  tips, and stops being a chord at all once `L/2 > R`. `--circuit-packet-length: 8px` on a 12px radius
  puts that error at 0.67px — inside the bore's own 1px half-width, so the light never leaves the
  pipe. Raising the length without raising the radius throws the capsule off every corner, which is
  exactly what a 26px capsule did.
- **Pure CSS animation.** Play state is toggled by a class an `IntersectionObserver` sets. Nothing
  runs offscreen; there is no `requestAnimationFrame` loop anywhere in the motif.
- **Feature-gated.** `CSS.supports('offset-path', 'path("M 0 0 L 1 1")')` decides whether capsules
  exist at all. Without it the structure renders complete and there is simply no motion. The
  baseline is a finished drawing, and motion is the enhancement.
- **`prefers-reduced-motion: reduce`** hides capsules entirely, in CSS. Traces render in their final
  state. There is no JS branch for this.
- Node acknowledgement fires on `animationiteration`, which is exactly the moment of arrival.

## 12. Invariants

Non-negotiable, and the reason the motif can be trusted not to affect the page:

- The overlay is absolutely positioned, out of flow, `aria-hidden="true"`, `pointer-events: none`,
  and not focusable. **It cannot contribute layout shift.**
- Geometry tokens stay in `px`, `ms` or unitless. The engine reads them off computed style, so
  relative units would resolve against the wrong box.
- Coordinates are measured against the **overlay**, not the region — the overlay fills the region's
  padding box, and this is also what keeps geometry correct under `Bend`'s transforms.
- Structure paints on the first geometry pass. It never traces in on scroll.
- Nothing in the motif animates `width`, `height`, `top`, `left`, `margin` or `padding`.
- No canvas, no WebGL, no new dependencies.
