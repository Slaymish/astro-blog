/**
 * Icon path registry, the single source of truth for icon geometry. Every
 * glyph on the site is drawn from here through Icon.astro.
 *
 * Shapes follow Lucide (ISC): a 24x24 grid with a 2px stroke and round caps
 * and joins. That open, geometric construction sits well next to Geist, and
 * every icon inherits weight and colour from the surrounding text rather than
 * baking either into the markup.
 *
 * To restyle every arrow on the site, edit the `--icon-*` tokens in
 * `src/styles/tokens.css`. To change a shape, edit it here.
 */
export const ICON_PATHS = {
  'arrow-right': ['M5 12h14', 'm12 5 7 7-7 7'],
  'arrow-left': ['M19 12H5', 'm12 19-7-7 7-7'],
  'arrow-up-right': ['M7 7h10v10', 'M7 17 17 7'],
  'arrow-down': ['M12 5v14', 'm19 12-7 7-7-7'],
  pause: ['M6 4h4v16H6z', 'M14 4h4v16h-4z'],
  play: ['M6 3 20 12 6 21z'],
  alert: ['M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z', 'M12 8v4', 'M12 16h.01'],
  'chevron-left': ['m15 18-6-6 6-6'],
  'chevron-right': ['m9 18 6-6-6-6'],
  menu: ['M3 6h18', 'M3 12h18', 'M3 18h18'],
  close: ['M18 6 6 18', 'm6 6 12 12'],
  sun: [
    'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
    'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41',
  ],
  moon: ['M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'],
  'zoom-in': ['M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0z', 'M11 8v6', 'M8 11h6', 'm21 21-4.35-4.35'],
  'zoom-out': ['M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0z', 'M8 11h6', 'm21 21-4.35-4.35'],
  'zoom-reset': [
    'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8',
    'M21 3v5h-5',
    'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16',
    'M3 21v-5h5',
  ],
  fullscreen: ['M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3'],
} as const;

export type IconName = keyof typeof ICON_PATHS;

/** Directions the icon nudges towards when its parent link is hovered. Icons
 *  that are not arrows have no axis to travel along, so they are absent here. */
export const ICON_MOTION: Partial<Record<IconName, 'right' | 'left' | 'up-right' | 'down'>> = {
  'arrow-right': 'right',
  'arrow-left': 'left',
  'arrow-up-right': 'up-right',
  'arrow-down': 'down',
};
