import { defineConfig, envField, fontProviders } from 'astro/config';
import netlify from '@astrojs/netlify';

// The two subset ranges the old src/design-system/fonts.css declared. Giving
// the latin-ext variants their own range is what keeps a Latin-only page to
// one file per family.
const latin =
  'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const latinExt =
  'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';

const local = fontProviders.local();

export default defineConfig({
  site: 'https://hamishburke.dev',
  output: 'static',
  // imageCDN off so local images are transformed at build time into hashed,
  // immutably cached files under /_astro, rather than through a Netlify
  // transform on every request. The site is static; there is nothing to defer.
  adapter: netlify({ imageCDN: false }),
  build: { format: 'file' },
  trailingSlash: 'never',
  compressHTML: true,
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  env: {
    schema: {
      SANITY_PROJECT_ID: envField.string({ context: 'server', access: 'public' }),
      SANITY_DATASET: envField.string({ context: 'server', access: 'public', default: 'production' }),
      SANITY_API_VERSION: envField.string({ context: 'server', access: 'public', default: '2024-01-01' }),
    },
  },
  image: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
  },
  // Shiki emits inline styles, which a hash-only policy cannot cover. Code
  // blocks render as plain <pre><code> on the monospace token instead.
  markdown: { syntaxHighlight: false },
  fonts: [
    {
      provider: local,
      name: 'Geist',
      cssVariable: '--font-geist',
      fallbacks: ['system-ui', 'sans-serif'],
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/geist-latin-wght-normal.woff2'],
            weight: '100 900',
            style: 'normal',
            display: 'swap',
            unicodeRange: [latin],
          },
          {
            src: ['./src/assets/fonts/geist-latin-ext-wght-normal.woff2'],
            weight: '100 900',
            style: 'normal',
            display: 'swap',
            unicodeRange: [latinExt],
          },
        ],
      },
    },
    {
      provider: local,
      name: 'Instrument Serif',
      cssVariable: '--font-instrument',
      fallbacks: ['Georgia', 'serif'],
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/instrument-serif-latin-400-normal.woff2'],
            weight: 400,
            style: 'normal',
            display: 'swap',
            unicodeRange: [latin],
          },
          {
            src: ['./src/assets/fonts/instrument-serif-latin-ext-400-normal.woff2'],
            weight: 400,
            style: 'normal',
            display: 'swap',
            unicodeRange: [latinExt],
          },
        ],
      },
    },
    {
      provider: local,
      name: 'JetBrains Mono',
      cssVariable: '--font-jetbrains',
      fallbacks: ['ui-monospace', 'monospace'],
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/jetbrains-mono-latin-400-normal.woff2'],
            weight: 400,
            style: 'normal',
            display: 'swap',
            unicodeRange: [latin],
          },
          {
            src: ['./src/assets/fonts/jetbrains-mono-latin-ext-400-normal.woff2'],
            weight: 400,
            style: 'normal',
            display: 'swap',
            unicodeRange: [latinExt],
          },
          {
            src: ['./src/assets/fonts/jetbrains-mono-latin-500-normal.woff2'],
            weight: 500,
            style: 'normal',
            display: 'swap',
            unicodeRange: [latin],
          },
          {
            src: ['./src/assets/fonts/jetbrains-mono-latin-ext-500-normal.woff2'],
            weight: 500,
            style: 'normal',
            display: 'swap',
            unicodeRange: [latinExt],
          },
        ],
      },
    },
  ],
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "form-action 'self'",
        "img-src 'self' data: https://cdn.sanity.io",
        "font-src 'self'",
        "connect-src 'self' https://cloud.umami.is https://gateway.umami.is https://cdn.sanity.io",
        "worker-src 'self' blob:",
        "media-src 'self'",
        "manifest-src 'self'",
        'upgrade-insecure-requests',
      ],
      scriptDirective: { resources: ["'self'", 'https://cloud.umami.is'] },
      styleDirective: { resources: ["'self'"] },
    },
  },
});
