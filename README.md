# hamishburke.dev

The personal site of Hamish Burke: selected work, writing, and a reading list.
Astro renders it to static HTML at build time from content held in Sanity, and
Netlify serves it.

## Setup

```bash
pnpm install --frozen-lockfile
cp .env.example .env   # SANITY_PROJECT_ID is required; the rest have defaults
pnpm run dev           # http://localhost:4321
```

`SANITY_PROJECT_ID` is validated when the config loads, so a missing `.env`
fails before Astro starts. The id is public (`qnuj1c4o`); it is also in
`netlify.toml` and in CI.

## Commands

```bash
pnpm run dev            # dev server on :4321
pnpm run build          # astro check && astro build - type errors fail the build
pnpm run preview        # serve the production build
pnpm run test           # tsx --test tests/*.test.ts
pnpm run check          # astro check && knip
pnpm run icons          # regenerate the favicon, app icons and the default OG image
pnpm run migrate        # dataset migration; see Content below
pnpm run studio:dev     # Sanity Studio, from the studio/ workspace
pnpm run studio:build
pnpm run studio:deploy
```

One test file: `pnpm exec tsx --test tests/work.test.ts`. The glob is
`tests/*.test.ts`, not `tests/**`, so a test in a subdirectory will not run.

`pnpm run test` is useful before a build and complete after one: the suites in
`tests/build-output.test.ts` and `tests/redirects.test.ts` read `dist/` and skip
themselves when it is absent.

## Content

Every visitor-facing sentence except the two legal pages lives in Sanity and is
edited in Studio. Publishing reaches the live site only when a Netlify build
hook fires a rebuild; that hook is configured in Netlify and Sanity, not here.

The schemas are in `src/sanity/schemaTypes/` and are the contract between the
site and Studio. Both Studio configs import that one module.

`pnpm run migrate` runs `scripts/migrate-2026-09.ts`, which has two modes.
`additive` adds fields and is re-runnable; `subtractive` unsets legacy fields and
deletes retired documents and is irreversible. Read a dry run first
(`pnpm run migrate <mode> --dry-run`), and note that a repository hook blocks the
write until the command carries `SANITY_WRITE_ACK=1`.

## Where to look next

- `ARCHITECTURE.md` - boundaries, invariants, and why things are where they are.
- `AGENTS.md` - the working rules for this repository, including the footguns.
- `PLANS.md` - the ExecPlan format; instances live in `docs/exec-plans/`.
