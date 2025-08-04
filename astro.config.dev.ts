import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";

// Development configuration without Netlify adapter
export default defineConfig({
  markdown: {
    shikiConfig: {
      theme: 'github-light-high-contrast',
    },
  },
  vite: {
    plugins: [tailwindcss()]
  },
});
