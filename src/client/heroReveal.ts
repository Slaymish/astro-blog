/** Reveal once; the first downward wheel gesture can hold the opening for 400ms. */
export function initHeroReveal(): void {
  const hero = document.querySelector<HTMLElement>('[data-hero-reveal]');
  const name = hero?.querySelector<HTMLElement>('h1');
  if (!hero || !name || hero.dataset.reveal !== 'pending') return;

  const controller = new AbortController();
  const wheelController = new AbortController();
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let animation: Animation | undefined;
  let holding = false;
  let releaseTimer: number | undefined;
  const release = (): void => {
    holding = false;
    window.clearTimeout(releaseTimer);
    wheelController.abort();
  };
  const cancel = (): void => { release(); animation?.cancel(); };
  const reveal = (animate = true, duration = 700): void => {
    if (hero.dataset.reveal !== 'pending') return;
    controller.abort();
    if (!holding) release();
    const before = name.getBoundingClientRect();
    hero.dataset.reveal = 'revealed';
    const after = name.getBoundingClientRect();

    if (animate && !motion.matches) {
      animation = name.animate([
        { transform: `translate(${before.left - after.left}px, ${before.top - after.top}px)` },
        { transform: 'translate(0, 0)' },
      ], { duration, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    }
  };

  window.addEventListener('resize', cancel, { passive: true });
  window.addEventListener('pagehide', () => { reveal(false); cancel(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { reveal(false); cancel(); }
  });
  motion.addEventListener('change', () => {
    if (motion.matches) { reveal(false); cancel(); }
  });

  if (window.scrollY > 0 || location.hash || motion.matches || document.hidden) {
    hero.dataset.reveal = 'revealed';
    release();
    return;
  }

  // Capture before the shell's wheel smoother, which honours defaultPrevented.
  // Discard the held deltas rather than replaying a queued jump after release.
  window.addEventListener('wheel', (event: WheelEvent) => {
    if (!event.cancelable || event.defaultPrevented || motion.matches ||
        event.ctrlKey || event.metaKey || event.altKey || event.shiftKey ||
        event.deltaX || event.deltaY <= 0 || window.scrollY > 2) {
      if (holding) cancel();
      return;
    }
    for (const node of event.composedPath()) {
      if (!(node instanceof HTMLElement)) continue;
      const nativeControl = ['INPUT', 'SELECT', 'TEXTAREA'].includes(node.tagName) || node.isContentEditable;
      const scrollRegion = node !== document.body && node !== document.documentElement &&
        /(auto|scroll|overlay)/.test(getComputedStyle(node).overflowY) && node.scrollHeight > node.clientHeight;
      if (nativeControl || scrollRegion) {
        if (holding) cancel();
        return;
      }
    }
    if (holding) { event.preventDefault(); return; }
    if (hero.dataset.reveal !== 'pending') return;
    event.preventDefault();
    holding = true;
    hero.dataset.revealMotion = 'brief';
    reveal(true, 400);
    releaseTimer = window.setTimeout(release, 400);
  }, { capture: true, passive: false, signal: wheelController.signal });

  // Other ways of navigating remain native and can interrupt the brief hold.
  for (const event of ['keydown', 'pointerdown', 'touchstart', 'focusin', 'hashchange', 'scroll']) {
    window.addEventListener(event, () => { if (holding) cancel(); }, { passive: true });
  }

  for (const event of ['wheel', 'scroll', 'touchstart', 'pointerdown', 'keydown']) {
    window.addEventListener(event, () => reveal(), { passive: true, signal: controller.signal });
  }
}
