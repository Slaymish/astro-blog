import { defineConfig } from 'astro/config';
import sharedConfig from './astro.config.shared';

// Local development uses the same integrations without the Netlify adapter.
export default defineConfig({
  ...sharedConfig,
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
