import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import netlify from '@astrojs/netlify';

export default defineConfig({
  markdown: {
    shikiConfig: {
      theme: 'github-light-high-contrast',
    },
  },
  vite: {
    plugins: [tailwindcss()]
  },
  output: 'server',
  adapter: netlify()
});
