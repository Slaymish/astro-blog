/**
 * The theme toggle. The pre-paint script in `themeBoot.ts` has already put the
 * right class on <html>; this only handles the visitor changing their mind, and
 * keeps following the system while they have not.
 */

/** Duplicates --color-ink-950 and --color-paper-100 for the browser chrome. */
const THEME_COLORS = { dark: '#0b0d0c', light: '#f6f7f3' } as const;

type Theme = keyof typeof THEME_COLORS;

const STORAGE_KEY = 'theme';
const TOGGLE_SELECTOR = '[data-theme-toggle]';

function currentTheme(root: HTMLElement): Theme {
  return root.classList.contains('light') ? 'light' : 'dark';
}

/**
 * The <meta name="theme-color"> elements are media-scoped so the browser picks
 * one before any script runs. Once the visitor chooses, both are set to the
 * chosen colour so the choice wins whatever the system says.
 */
function applyMetaThemeColor(theme: Theme, pinned: boolean): void {
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    const media = meta.getAttribute('media') ?? '';
    if (pinned) {
      meta.setAttribute('content', THEME_COLORS[theme]);
    } else if (media.includes('light')) {
      meta.setAttribute('content', THEME_COLORS.light);
    } else {
      meta.setAttribute('content', THEME_COLORS.dark);
    }
  });
}

function apply(root: HTMLElement, theme: Theme, source: 'user' | 'system'): void {
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  root.dataset.themeSource = source;
  root.style.colorScheme = theme;
  applyMetaThemeColor(theme, source === 'user');

  document.querySelectorAll<HTMLElement>(TOGGLE_SELECTOR).forEach((button) => {
    button.setAttribute('aria-pressed', String(theme === 'light'));
    const next = theme === 'light' ? 'dark' : 'light';
    button.setAttribute('aria-label', `Switch to ${next} theme`);
  });
}

export function initTheme(): void {
  const root = document.documentElement;
  apply(root, currentTheme(root), root.dataset.themeSource === 'user' ? 'user' : 'system');

  document.querySelectorAll<HTMLElement>(TOGGLE_SELECTOR).forEach((button) => {
    button.addEventListener('click', () => {
      const next: Theme = currentTheme(root) === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // A visitor who blocks storage still gets the switch for this page.
      }
      apply(root, next, 'user');
    });
  });

  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (event) => {
    if (root.dataset.themeSource === 'user') return;
    apply(root, event.matches ? 'light' : 'dark', 'system');
  });
}
