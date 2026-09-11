# Production Sanity Studio

This is a separate Studio deployment with the Vision query tool. It shares the root
pnpm dependencies and `src/sanity/schemaTypes` with the site's embedded CMS.

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm run studio:dev
pnpm run studio:build
```

To deploy, run `pnpm run studio:deploy` from the repository root. Publishing content still
requires a Netlify rebuild before it appears on the static site.

The Studio package manifest is a symlink to the root manifest because the Sanity CLI
requires a manifest in its project directory. Dependency versions and installation remain
owned by the root `package.json` and `pnpm-lock.yaml`.
