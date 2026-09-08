# hamishburke.dev

Hamish Burke's personal site: selected work, writing, reports, a reading list and a CV.
Astro, prerendered to static HTML and hosted on Netlify; content is edited in Sanity Studio.

## Setup

- Node 22.12.0 or newer and pnpm 10 (CI and Netlify use Node 22)

```bash
pnpm install --frozen-lockfile
printf 'SANITY_PROJECT_ID=qnuj1c4o\nSANITY_DATASET=production\n' > .env
pnpm run dev            # http://localhost:4321
```

The project id is public; reads need no token. Writes (Studio, `seed:copy`) need a
`SANITY_API_TOKEN` in `.env`, which is gitignored.

## Commands

| Command | What it does |
|---|---|
| `pnpm run dev` | Dev server on :4321 using `astro.config.dev.ts` (no Netlify adapter) |
| `pnpm run build` | `astro check` then a production build into `dist/` |
| `pnpm run test` | The test suite (`tests/*.test.ts`) |
| `pnpm run preview` | Serve the production build locally |
| `pnpm run studio:dev` | Sanity Studio, a separate app in `studio-production/` |
| `pnpm exec knip` | Dead code and unused dependency report |

## Publishing

The site is prerendered, so a change published in Sanity reaches hamishburke.dev when the
Netlify build hook runs. `CLAUDE.md` holds the working notes (rendering model, footguns,
where things live) and `ARCHITECTURE.md` the boundaries and invariants.

## License

MIT, see `LICENSE`.
