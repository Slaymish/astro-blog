# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server (localhost:4321) — uses astro.config.dev.ts (no Netlify adapter)
npm run build        # Production build — runs `astro check && astro build`
npm run test         # Tests — tsx --test tests/**/*.test.ts
npm run preview      # Preview production build locally
npm run studio:dev   # Sanity Studio dev server (separate app in studio-production/)
npm run studio:build # Build Sanity Studio
```

## Environment

Requires `SANITY_PROJECT_ID` in `.env` (see `.env.example`). Defaults: `SANITY_DATASET=production`, `SANITY_API_VERSION=2024-01-01`.

## Architecture

Astro site with server-side rendering (`output: 'server'`) deployed to Netlify. Content comes from **Sanity CMS** at runtime via GROQ queries, not from Astro content collections (those exist but are not the active runtime path).

### Key layers

- **Routes** (`src/pages/`): request-level data fetching and page assembly. Many routes use `prerender = false` for server rendering.
- **Components** (`src/components/`): `layout/` (Layout, Header, Footer), `features/` (Breadcrumb, TOC, RelatedPosts, PDFViewer), `theme/` (ThemeToggle, AccentPicker — React/TSX), `ui/` (GridTile, Logo).
- **Integration** (`src/lib/`): `sanity.ts` (client + `fetchSanity` helper), `portableText.ts` (Portable Text to HTML), `markdown.ts` (markdown to HTML), `site.ts` (canonical URL constants), `escape.ts` (attribute/XML escaping).
- **Schemas** (`src/sanity/schemaTypes/`): post, project, report, book, blockContent. **Must be kept in sync** with `studio-production/schemaTypes/`.

### Styling

Tailwind CSS v4 via `@tailwindcss/vite` plugin. Design tokens in `src/design-system/tokens.css` are the single source of truth. `src/styles/globals.css` bridges tokens to Tailwind. Dark mode is class-based (`.dark` on `<html>`). Light/dark theme files in `src/design-system/themes/`.

### Metadata and SEO

Centralized in `src/components/layout/Layout.astro` (OG, Twitter, JSON-LD, canonical, robots). Crawl endpoints: `sitemap.xml.ts`, `robots.txt.ts`, `rss.xml.ts`, `llms.txt.ts`.

### Security-sensitive

`src/pages/api/pdf.ts` is an allowlisted HTTPS-only proxy for Sanity-hosted PDFs with content-type validation and redirect blocking. Do not weaken its protections.

## Content rules

- Do not use em dashes in site content.

## Repo conventions

- Keep changes minimal and task-scoped.
- If Sanity schemas change, update both `src/sanity/schemaTypes/` and `studio-production/schemaTypes/`.
- If routing/canonical behavior changes, review `Layout.astro`, `src/lib/site.ts`, and crawl endpoints together.
- If architecture/invariants change, update `ARCHITECTURE.md` in the same commit.
- Do not commit `dist/`.
