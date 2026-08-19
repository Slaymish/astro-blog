/**
 * The two chrome colours the browser needs before any stylesheet exists.
 *
 * These duplicate `--color-paper-100` and `--color-ink-950` in
 * `src/design-system/tokens.css`, and they have to: the theme resolver in
 * Layout.astro runs before the first stylesheet parses, so `getComputedStyle`
 * would return an empty string there. Deriving them from tokens.css instead
 * would need a build step that parses CSS and emits TS, which is more
 * machinery than two hex values are worth.
 *
 * This file is that duplication, in one place. Both inline scripts (the
 * pre-paint resolver and the toggle) read it at build time through
 * `define:vars`, and the `theme-color` / `msapplication-TileColor` meta tags
 * are rendered from it, so the three former copies now agree by construction.
 * If a token changes, change it here too — nothing else needs touching.
 */
export const THEME_COLORS = {
  /** --color-paper-100 */
  light: '#f6f7f3',
  /** --color-ink-950 */
  dark: '#0b0d0c'
} as const;
