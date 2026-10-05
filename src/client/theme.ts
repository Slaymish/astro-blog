/**
 * The theme toggle. The pre-paint script in `themeBoot.ts` has already put the
 * right class on <html>; this only handles the visitor changing their mind, and
 * keeps following the system while they have not.
 */

type Theme = 'dark' | 'light';

const STORAGE_KEY = 'theme';
const TOGGLE_SELECTOR = '[data-theme-toggle]';

function currentTheme(root: HTMLElement): Theme {
  return root.classList.contains('light') ? 'light' : 'dark';
}

/**
 * The <meta name="theme-color"> elements are media-scoped so the browser picks
 * one before any script runs. Afterwards the canvas token is the source of
 * truth for both, including when the system preference changes.
 */
function applyMetaThemeColor(root: HTMLElement): void {
  const color = getComputedStyle(root).getPropertyValue('--color-bg-canvas').trim();
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    meta.setAttribute('content', color);
  });
}

function apply(root: HTMLElement, theme: Theme, source: 'user' | 'system'): void {
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  root.dataset.themeSource = source;
  applyMetaThemeColor(root);

  // The label names the action, so the button is not also a toggle: pairing a
  // changing label with aria-pressed reads as "Switch to dark theme, pressed".
  document.querySelectorAll<HTMLElement>(TOGGLE_SELECTOR).forEach((button) => {
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
