import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import netlify from '@astrojs/netlify';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sanity from '@sanity/astro';

export default defineConfig({
  integrations: [
    mdx(),
    react(),
    sanity({
      projectId: process.env.SANITY_PROJECT_ID || '',
      dataset: process.env.SANITY_DATASET || 'production',
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
      'import.meta.env.PUBLIC_SANITY_PROJECT_ID': JSON.stringify(process.env.SANITY_PROJECT_ID || ''),
      'import.meta.env.PUBLIC_SANITY_DATASET': JSON.stringify(process.env.SANITY_DATASET || 'production'),
      'import.meta.env.PUBLIC_SANITY_API_VERSION': JSON.stringify(process.env.SANITY_API_VERSION || '2024-01-01')
    }
  },
  output: 'server',
  adapter: netlify({
    edgeMiddleware: false,
  })
});
