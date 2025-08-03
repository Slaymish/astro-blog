# Hamish's Blog

A personal blog built with Astro and Supabase where I write about technology, programming, and ideas that interest me.

## About

This blog is my space to document thoughts on:
- Technology and programming
- AI and machine learning
- Hardware projects
- Mathematics and computer science
- Random ideas and experiments

## Tech Stack

- **Astro** - Static site generator with server-side rendering
- **Supabase** - PostgreSQL database for storing posts and tags
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type-safe JavaScript
- **Netlify** - Hosting and deployment

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) v18.14+
- [Supabase account](https://supabase.com/)

### Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and add your Supabase credentials
4. Sync posts to database:
   ```bash
   npm run sync:posts
   ```
5. Start development server:
   ```bash
   npm run dev
   ```

### Available Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Start local dev server at `localhost:4321` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview build locally |
| `npm run sync:posts` | Sync markdown posts to Supabase database |

## Writing Posts

Posts are written in Markdown and stored in `src/content/posts/`. Each post should have frontmatter with:

```yaml
---
title: "Post Title"
pubDate: 2025-01-01
tags: ["tag1", "tag2"]
author: "Hamish Burke"
draft: false
---
```

Images should be placed in `public/images/posts/` and referenced as `/images/posts/image.jpg`.

## License

MIT License - see LICENSE file for details.
