/** Reveal the introduction on the first input without capturing scrolling. */
export function initHeroReveal(): void {
  const hero = document.querySelector<HTMLElement>('[data-hero-reveal]');
  const name = hero?.querySelector<HTMLElement>('h1');
  if (!hero || !name || hero.dataset.reveal !== 'pending') return;

  const controller = new AbortController();
  const reveal = (): void => {
    controller.abort();
    const before = name.getBoundingClientRect();
    hero.dataset.reveal = 'revealed';
    const after = name.getBoundingClientRect();

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      name.animate([
        { transform: `translate(${before.left - after.left}px, ${before.top - after.top}px)` },
        { transform: 'translate(0, 0)' },
      ], { duration: 700, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    }
  };

  if (window.scrollY > 0 || location.hash) {
    hero.dataset.reveal = 'revealed';
    return;
  }

  for (const event of ['wheel', 'scroll', 'touchstart', 'pointerdown', 'keydown']) {
    window.addEventListener(event, reveal, { passive: true, signal: controller.signal });
  }
}
