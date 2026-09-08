# Remove unused code without changing the site

This living plan follows `PLANS.md` and records the September 2026 cleanup.

## Purpose / Big Picture

Keep every existing route, interaction, content item and visual style while reducing unused source and configuration drift. Compare a production build from before the edits with the final build to check that rendered pages stay the same.

## Progress

- [x] (2026-09-08) Read the architecture and inspect source, dependency usage and Knip findings.
- [x] (2026-09-08) Establish baseline: 94 tests pass, Astro check has no diagnostics, production build succeeds. Copy output outside the repository.
- [x] (2026-09-08) Remove confirmed dead code, overridden CSS and unnecessary exports; share duplicate configuration.
- [x] (2026-09-08) Pass 94 tests, production build, both configuration checks and main-site Knip; compare all HTML and 28 browser render states.

## Surprises & Discoveries

Knip misses imports inside Astro script blocks, falsely reporting the shell entry point and its booking and code-copy modules. All declared dependencies have consumers, including Motion in the embedded GPU calculator. Public assets may be linked from Sanity or external sites and cannot be declared unused based on source searches alone.

The local pnpm 11 installation automatically repaired node_modules before running commands, causing concurrent initial commands to race. The baseline test rerun succeeded with dependency verification disabled; no manifest or lockfile changed.

## Decision Log

- Decision: Register the shell entry point explicitly with Knip. Rationale: retain genuine browser behaviour and make future audits useful. Date: 2026-09-08.
- Decision: Preserve public assets, existing scripts, dependencies, schema mirrors and legacy content support. Rationale: these are published resources, supported workflows or active contracts, not proven dead code. Date: 2026-09-08.
- Decision: Preserve development prefetch differences and the production adapter when sharing configuration. Rationale: deduplication must not silently change serving behaviour. Date: 2026-09-08.

## Outcomes & Retrospective

Removed the unused ButtonLink wrapper, obsolete decoration and grid selectors, overridden global typography and skip-link rules, unnecessary exports, unused work-query fields and duplicated Astro settings. Corrected stale architecture documentation and represented literal control characters in the recommendation validator with equivalent visible regex escapes. Main-site Knip exits successfully. All 94 tests pass, production and development configurations report no diagnostics, and the production build succeeds.

All 41 HTML files match the baseline after normalising CSS asset filenames. JavaScript bundles and public assets are byte-identical. Crawl output matches after normalising build timestamps. Compiled CSS shrank from 139,272 to 135,904 bytes, a reduction of 3,368 bytes. Headless Chrome compared every element's computed styles (including pseudo-elements) and geometry on seven representative pages, at 390px and 1440px in both themes: all 28 combinations match. Scripts and remote requests were disabled for deterministic style comparisons; unchanged JavaScript bundles and the existing tests provide separate behaviour evidence.

The standalone Studio audit also found no unused source files. Its reported dependency findings include Sanity's declared React, React DOM and styled-components peers and its existing lint, formatting and TypeScript tooling, which were retained. Public assets and legacy schema fields remain because external/CMS references and editing compatibility cannot be disproved by a local import scan. No dependencies, production data or deployments changed. This audit does not establish the absence of every possible form of technical debt.

## Context and Orientation

`astro.config.ts` controls production builds and `astro.config.dev.ts` starts local development without Netlify. Both duplicate integrations, font fallbacks and Sanity environment validation. `src/styles/globals.css` includes obsolete decoration selectors and a second skip-link definition overridden by the unlayered definition in `src/design-system/base.css`. `src/components/ui/ButtonLink.astro` has no consumers. Internal helpers expose types and constants that no other module imports. Sanity schemas remain mirrored between the main site and standalone Studio.

## Plan of Work

First remove the unused button wrapper and unnecessary exports, register the shell module in `knip.json`, and remove obsolete CSS whose absence cannot affect any rendered element. Remove broad global element declarations only where the unlayered design-system base rules already override every property; retain layered important reduced-motion rules because important declarations reverse layer precedence. Then move shared Astro settings to `astro.config.shared.ts`, with each existing config retaining its environment-specific settings. Remove unused reflection fields from the work query while preserving the schema and compatibility type. Correct stale architecture descriptions. Finally validate generated pages against the baseline.

## Concrete Steps

Work in `/Users/hamishburke/Developer/astro-blog`. Run `pnpm run test`, `pnpm run build`, and `pnpm exec knip`. On the current pnpm 11 host, prefix pnpm arguments with `--config.verify-deps-before-run=false` to avoid automatic dependency repair. Run `pnpm exec astro check --config astro.config.dev.ts` for the alternate configuration. Baseline output is stored at `/var/folders/xb/dg7gk2ss7ln9gssz6zcgr25w0000gn/T/astro-cleanup-baseline-siyyfpdk/dist`.

## Validation and Acceptance

All 94 existing tests must pass, both configurations must type-check, and the production build must retain its route inventory. Compare HTML after normalising generated asset filenames. Inspect CSS differences to ensure only obsolete selectors or overridden rules were removed. Knip must finish without unused-code findings. Review `git diff --check` and ensure no production data, lockfile or generated distribution is included.

## Idempotence and Recovery

Changes are local and reviewable in git. Do not deploy or write Sanity data. The baseline is outside the repository so builds cannot overwrite it. Preserve pre-existing user changes; this task began with a clean tree.

## Artifacts and Notes

Baseline: 94 passing tests; Astro check: 0 errors, 0 warnings, 0 hints. Production build includes the CMS, content routes, redirects and server endpoints.

## Interfaces and Dependencies

Keep existing route and component interfaces except the unused ButtonLink wrapper. Keep `initShell()` as the browser entry point and existing Sanity schema contracts. No dependency additions or removals are needed because the audit found active consumers for every declared package.

Revision note: Completed the cleanup and recorded final build, output-equivalence and browser comparison evidence. Shared configuration uses `satisfies AstroUserConfig` to retain narrow inferred properties; wrapping shared settings in `defineConfig` widened optional i18n fields and failed TypeScript inference when spread into the environment-specific configurations. Legacy report membership now uses the existing archive set rather than a second hardcoded slug; Netlify rules and canonical behaviour were reviewed and remain identical.
