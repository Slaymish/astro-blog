/**
 * THEME INITIALIZATION SCRIPT (Inline)
 *
 * This script MUST be inline in the <head> and run as early as possible
 * to prevent flash of unstyled content (FOUC).
 *
 * This file is meant to be inlined, not imported.
 */
(function() {
  try {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');

    // Apply theme class immediately
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.add('light');
    }
  } catch (e) {
    // Fail silently if localStorage is not available
    // Default to system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.add('light');
    }
  }
})();
