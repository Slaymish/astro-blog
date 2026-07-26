# Hamish's Blog

A personal blog built with Astro and Sanity where I write about technology, programming, and ideas that interest me.

## About

This blog is my space to document thoughts on:
- Technology and programming
- AI and machine learning
- Hardware projects
- Mathematics and computer science
- Random ideas and experiments

## Tech Stack

- **Astro** - Static site generator; content routes are prerendered at build time
- **Sanity** - Headless CMS for storing posts, books, and projects
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type-safe JavaScript
- **Netlify** - Hosting and deployment

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) v22 (the version CI builds against)
- [pnpm](https://pnpm.io/) v10
- [Sanity account](https://www.sanity.io/)

### Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Create a new Sanity project (use the defaults) and grab the Project ID + dataset name
4. Copy `.env.example` to `.env` and add your Sanity credentials
5. Start development server:
   ```bash
   pnpm run dev
   ```
6. Start Sanity Studio (separate app):
   ```bash
   pnpm run studio:dev
   ```

### Available Commands

| Command | Action |
|---------|--------|
| `pnpm run dev` | Start local dev server at `localhost:4321` |
| `pnpm run build` | Type-check and build the production site to `./dist/` |
| `pnpm run test` | Run the test suite |
| `pnpm run preview` | Preview build locally |
| `pnpm run studio:dev` | Start Sanity Studio locally |
| `pnpm run studio:build` | Build Sanity Studio for deployment |

## Writing Posts

Posts are managed in Sanity Studio. Run the Studio with `pnpm run studio:dev` (served by the Studio app).

Because the site is prerendered, publishing in Sanity only reaches the live site once a Netlify build runs.

## License

MIT License - see LICENSE file for details.
