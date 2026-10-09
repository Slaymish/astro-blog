/**
 * Resolves a theme's colour roles to literal hex from the two stylesheets, for
 * the places CSS cannot reach: the theme-color meta tags, the web manifest and
 * the generated icons. tokens.css stays the only file with a hex in it.
 */

type Role = 'bg-canvas' | 'text-primary';
type ThemeColors = Record<'dark' | 'light', Record<Role, string>>;

const ROLES: Role[] = ['bg-canvas', 'text-primary'];

function declarations(css: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const [, name, value] of css.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) found.set(name, value.trim());
  return found;
}

function block(css: string, selector: string): string {
  const match = css.match(new RegExp(`\\.${selector}\\s*\\{([^}]*)\\}`));
  if (!match) throw new Error(`themes.css has no .${selector} block`);
  return match[1];
}

export function resolveThemeColors(tokensCss: string, themesCss: string): ThemeColors {
  const tokens = declarations(tokensCss);
  const resolve = (theme: 'dark' | 'light') => {
    const roles = declarations(block(themesCss, theme));
    return Object.fromEntries(
      ROLES.map((role) => {
        const reference = roles.get(`color-${role}`)?.match(/^var\(--([\w-]+)\)$/)?.[1];
        const hex = reference ? tokens.get(reference) : undefined;
        if (!hex) throw new Error(`--color-${role} in .${theme} does not resolve to a token`);
        return [role, hex];
      }),
    ) as Record<Role, string>;
  };
  return { dark: resolve('dark'), light: resolve('light') };
}
