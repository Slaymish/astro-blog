import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import sharedConfig from './astro.config.shared';

export default defineConfig({
  ...sharedConfig,
  site: 'https://hamishburke.dev',
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  vite: {
    ...sharedConfig.vite,
    ssr: {
      // Bundle Motion to avoid pnpm symlink tracing issues on Netlify.
      noExternal: ['motion', 'framer-motion'],
    },
  },
  // Content is baked at build time. API routes and stats opt out individually.
  output: 'static',
  // Keep emitted URLs and canonical tags aligned without trailing slashes.
  build: { format: 'file' },
  trailingSlash: 'never',
  // Legacy redirects stay in netlify.toml: Astro emits meta-refresh pages that
  // take precedence over Netlify's real HTTP redirects.
  adapter: netlify({ middlewareMode: 'classic' }),
});
