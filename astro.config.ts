import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import netlify from '@astrojs/netlify';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sanity from '@sanity/astro';
import { FontaineTransform } from 'fontaine';

const fontFallbackOptions = {
  fallbacks: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Arial', 'sans-serif'],
  resolvePath: (id: string) => new URL(`./public${id}`, import.meta.url),
};

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
  site: 'https://hamishburke.dev',
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
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
    plugins: [tailwindcss(), FontaineTransform.vite(fontFallbackOptions)],
    define: {
      'import.meta.env.PUBLIC_SANITY_PROJECT_ID': JSON.stringify(env.SANITY_PROJECT_ID || ''),
      'import.meta.env.PUBLIC_SANITY_DATASET': JSON.stringify(env.SANITY_DATASET || 'production'),
      'import.meta.env.PUBLIC_SANITY_API_VERSION': JSON.stringify(env.SANITY_API_VERSION || '2024-01-01')
    },
    ssr: {
      // Bundle motion into SSR chunks so it doesn't need to be resolved
      // from node_modules at runtime (avoids pnpm symlink tracing issues on Netlify CI)
      noExternal: ['motion', 'framer-motion'],
    },
  },
  // Static by default: content is baked at build time and served from the CDN.
  // Routes that genuinely need a server opt out with `export const prerender = false`
  // (currently only the PDF proxy). A Sanity webhook triggers a rebuild on publish.
  output: 'static',
  // Emit `/work.html` rather than `/work/index.html` so URLs resolve without a
  // trailing-slash redirect and match the canonical tags, which omit the slash.
  build: { format: 'file' },
  trailingSlash: 'never',
  // Legacy redirects live in netlify.toml with force=true. Astro's `redirects`
  // config emits meta-refresh HTML pages that Netlify serves in preference to
  // the _redirects rule, which downgrades a 301 to a soft client-side hop.
  adapter: netlify({
    edgeMiddleware: false,
  })
});
