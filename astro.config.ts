import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import netlify from '@astrojs/netlify';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sanity from '@sanity/astro';

// Load environment variables from .env file
import { loadEnv } from 'vite';
const env = loadEnv('', process.cwd(), '');

// Validate required environment variables
const projectId = env.SANITY_PROJECT_ID;
if (!projectId) {
  throw new Error(
    'SANITY_PROJECT_ID is not set. Please ensure your .env file contains SANITY_PROJECT_ID=qnuj1c4o'
  );
}

export default defineConfig({
  integrations: [
    mdx(),
    react(),
    sanity({
      projectId,
      dataset: env.SANITY_DATASET || 'production',
      apiVersion: '2024-01-01',
      useCdn: false,
      studioBasePath: '/cms'
    })
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-light-high-contrast',
    },
  },
  vite: {
    plugins: [tailwindcss()],
    define: {
      'import.meta.env.PUBLIC_SANITY_PROJECT_ID': JSON.stringify(env.SANITY_PROJECT_ID || ''),
      'import.meta.env.PUBLIC_SANITY_DATASET': JSON.stringify(env.SANITY_DATASET || 'production'),
      'import.meta.env.PUBLIC_SANITY_API_VERSION': JSON.stringify(env.SANITY_API_VERSION || '2024-01-01')
    }
  },
  output: 'server',
  adapter: netlify({
    edgeMiddleware: false,
  })
});
