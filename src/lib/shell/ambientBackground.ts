/**
 * Scroll-linked drift for the fixed ambient gradient layer.
 *
 * Only two custom properties are written, and only from inside a rAF callback,
 * so the gradient repaints on the compositor's schedule rather than once per
 * scroll event. Respects prefers-reduced-motion by leaving the tokens at their
 * CSS defaults.
 */

/** Horizontal drift, in percent, across the full scroll range. */
const SHIFT_X_START = -1.5;
const SHIFT_X_RANGE = 3;
/** Vertical drift, in percent, across the full scroll range. */
const SHIFT_Y_START = 1;
const SHIFT_Y_RANGE = -2;

export function initAmbientBackground(): void {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let progress = 0;

  function paintAmbientPosition() {
    frame = 0;
    root.style.setProperty('--ambient-shift-x', (SHIFT_X_START + progress * SHIFT_X_RANGE).toFixed(2) + '%');
    root.style.setProperty('--ambient-shift-y', (SHIFT_Y_START + progress * SHIFT_Y_RANGE).toFixed(2) + '%');
  }

  function ambientScroll() {
    if (reduceMotion.matches) return;

    const scrollable = root.scrollHeight - window.innerHeight;
    progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;

    if (!frame) frame = requestAnimationFrame(paintAmbientPosition);
  }

  window.addEventListener('scroll', ambientScroll, { passive: true });
  ambientScroll();
}
