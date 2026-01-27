import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sanity from '@sanity/astro';

// Development configuration without Netlify adapter
export default defineConfig({
  integrations: [
    mdx(),
    react(),
    sanity({
      projectId: process.env.SANITY_PROJECT_ID || '',
      dataset: process.env.SANITY_DATASET || 'production',
      apiVersion: '2024-01-01',
      useCdn: true,
      studioBasePath: '/cms'
    })
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-light-high-contrast',
    },
  },
  vite: {
    plugins: [tailwindcss()]
  },
});
