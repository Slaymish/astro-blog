/**
 * Icon path registry — the single source of truth for icon geometry.
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
