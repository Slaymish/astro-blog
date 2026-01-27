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

- **Astro** - Static site generator with server-side rendering
- **Sanity** - Headless CMS for storing posts, books, and projects
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type-safe JavaScript
- **Netlify** - Hosting and deployment

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) v18.14+
- [Sanity account](https://www.sanity.io/)

### Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a new Sanity project (use the defaults) and grab the Project ID + dataset name
4. Copy `.env.example` to `.env` and add your Sanity credentials
5. Start development server:
   ```bash
   npm run dev
   ```
6. Start Sanity Studio (separate app):
   ```bash
   npm run studio:dev
   ```

### Available Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Start local dev server at `localhost:4321` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview build locally |
| `npm run studio:dev` | Start Sanity Studio locally |
| `npm run studio:build` | Build Sanity Studio for deployment |

## Writing Posts

Posts are managed in Sanity Studio. Run the Studio with `npm run studio:dev` (served by the Studio app).

## License

MIT License - see LICENSE file for details.
