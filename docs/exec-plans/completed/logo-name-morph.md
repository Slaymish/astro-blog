# Animate the HB mark into the homepage name

This ExecPlan follows PLANS.md. Maintain Progress, Surprises & Discoveries, Decision Log and Outcomes & Retrospective as work changes.

## Purpose / Big Picture

The homepage opens on the existing HB mark. Its two pieces separate intact, straighten, and reshape into H and B. The remaining letters follow individually authored pen routes to form Hamish Burke. It runs once on arrival, then hands over to ordinary HTML lettering. Start `pnpm run dev` and open the homepage to see the motion.

## Progress

- [x] (2026-10-10) Read logo geometry, homepage reveal and architecture.
- [x] (2026-10-10) Extract outlines from the bundled Geist font and implement contour interpolation.
- [x] (2026-10-10) Verify browser appearance, reduced motion, narrow layout and repository checks.

## Surprises & Discoveries

The mark is two filled contours, so its silhouettes can carry H and B independently. Fontkitten is already installed transitively through Astro. Its WOFF2 variation handling does not provide reliable weight extraction here; regular outlines avoid changing shape at the handover to live text.

## Decision Log

Use regular Geist for the homepage name, matching the extracted outlines. Keep the header logo unchanged. Use native SVG sampling for the initials and requestAnimationFrame rather than adding a motion dependency. Following feedback that uniform contour interpolation looked artificial, replace the remaining letter morphs with authored pen routes in `src/site/nameMotion.ts`. The mark holds, compresses briefly, releases outward, then straightens into the initials. Each remaining letter has independent stroke order and timing. The live-type handover occurs at 2650ms. Keep all colours inherited from the semantic text role. No content or production writes are needed.

## Outcomes & Retrospective

Implemented and visually checked at 1440px and 390px. Reduced motion, no JavaScript, early input and resizing all keep the heading visible. Build and Astro diagnostics passed; all 201 post-build tests passed; knip reported no findings. Browser checks reported no script errors or horizontal overflow.

## Context and Orientation

`src/site/logo.ts` owns the two original silhouettes. `src/site/namePaths.ts` holds the matching regular Geist letter outlines. `src/pages/index.astro` renders the hidden accessible heading, the visual HTML letters and an SVG overlay. `src/client/nameMorph.ts` samples the two initial contours into equally spaced points and moves them through separate travel and reshaping stages. For the remaining letters, `src/site/nameMotion.ts` supplies pen routes and timing. SVG masks follow those routes to expose the exact font outlines. These masks use alpha rather than colour luminance, so both themes work. The existing `heroReveal.ts` still controls the introduction's first-input reveal.

## Plan of Work

Add the outline asset and browser module, then add the overlay inside the existing h1. Reduced motion and no JavaScript expose the ordinary heading immediately. Unsupported heading characters fall back to the ordinary name. Font failure, resizing or motion-preference changes finish the animation safely.

## Concrete Steps

Work in `/Users/hamishburke/Developer/astro-blog`. Run `pnpm exec astro check`, `pnpm run test`, `pnpm run build`, then `pnpm run test` again. Start `pnpm run dev --host 127.0.0.1` and view `http://127.0.0.1:4321/` at desktop and phone widths.

## Validation and Acceptance

On arrival the mark is centred. Its pieces move intact before forming the initials; the rest of the name follows visibly distinct stroke sequences without fading. The name is sharp and readable after the motion. First input still reveals the introduction. Under reduced motion or without scripting, the name and introduction are immediately readable. Resizing during the sequence leaves the full name visible. Automated checks should report no errors and all applicable tests passing.

## Idempotence and Recovery

The checks and dev server are safe to rerun. Changes are local and task scoped. No dependency changes, dataset writes or deploys are involved.

## Artifacts and Notes

The original mark remains centralised in `src/site/logo.ts`; its paths are never copied into another asset. The generated name paths derive from `src/assets/fonts/geist-latin-wght-normal.woff2` at its default 400 weight.

## Interfaces and Dependencies

`initNameMorph(): Promise<void>` is the page's browser entry point. `NAME_FONT` exposes units, ascent and descent; `NAME_PATHS` maps supported name characters to SVG paths. The browser supplies SVG path sampling, font readiness and animation frames. No new runtime library is required.

Plan created on 2026-10-10 to record the motion and fallback design.

Validation completed on 2026-10-10. Reduced motion now also immediately reveals the introduction, bringing the existing reveal implementation into line with its documented behaviour.

Revision on 2026-10-10: the first uniform contour morph was rejected as too automated. The replacement separates travel, reshaping and lettering, with individually authored stroke routes and deliberate overlaps.
