/** Light easing for coarse wheel steps. Precision gestures stay with the browser. */
export function initWheelScroll(): void {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let target = window.scrollY;
  let lastWritten = target;
  let precisionUntil = 0;
  let direction = 0;

  const stop = (): void => {
    cancelAnimationFrame(frame);
    frame = 0;
    target = window.scrollY;
    lastWritten = target;
    direction = 0;
  };

  window.addEventListener('wheel', (event: WheelEvent) => {
    const now = performance.now();
    const mode = event.deltaMode;
    const delta = event.deltaY;
    if (motion.matches || event.defaultPrevented || !event.cancelable ||
        event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || !delta) {
      stop();
      return;
    }
    // Pixel gestures with small/fractional steps or horizontal movement are
    // likely precision input. Leave the rest of that gesture native too.
    if (event.deltaX || mode === 2 ||
        (mode === 0 && (Math.abs(delta) < 40 || !Number.isInteger(delta)))) {
      precisionUntil = now + 200;
      stop();
      return;
    }
    if (now < precisionUntil) { stop(); return; }

    // Never take a wheel event from a scroll region, even at its boundary:
    // native scroll chaining and overscroll rules belong to that element.
    for (const node of event.composedPath()) {
      if (!(node instanceof HTMLElement) || node === document.body || node === document.documentElement) continue;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(node.tagName) || node.isContentEditable) {
        stop();
        return;
      }
      const overflow = getComputedStyle(node).overflowY;
      if (/(auto|scroll|overlay)/.test(overflow) && node.scrollHeight > node.clientHeight) {
        stop();
        return;
      }
    }

    const current = window.scrollY;
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const lineHeight = parseFloat(getComputedStyle(document.body).lineHeight) || 24;
    const pixels = mode === 1 ? delta * lineHeight : delta;
    const nextDirection = Math.sign(pixels);
    if (!frame || direction !== nextDirection || Math.abs(current - lastWritten) > 2) target = current;
    target = Math.max(0, Math.min(max, target + pixels));
    if (target === current) { stop(); return; }
    event.preventDefault();
    direction = nextDirection;
    cancelAnimationFrame(frame);
    const from = current;
    const started = now;
    lastWritten = current;
    const tick = (time: number): void => {
      // A focus jump, scrollbar drag or another script always takes priority.
      if (Math.abs(window.scrollY - lastWritten) > 2) { stop(); return; }
      const progress = Math.min(1, Math.max(0, (time - started) / 140));
      const eased = 1 - Math.pow(1 - progress, 3);
      window.scrollTo({ top: from + (target - from) * eased, behavior: 'instant' });
      lastWritten = window.scrollY;
      if (progress < 1) frame = requestAnimationFrame(tick);
      else { frame = 0; direction = 0; }
    };
    frame = requestAnimationFrame(tick);
  }, { passive: false });

  for (const event of ['keydown', 'pointerdown', 'touchstart', 'focusin', 'hashchange', 'resize', 'pagehide']) {
    window.addEventListener(event, stop, { passive: true });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
  });
  motion.addEventListener('change', stop);
}
