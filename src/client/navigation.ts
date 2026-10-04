/** Dismiss the mobile disclosure while preserving its native no-JS behaviour. */
export function initNavigation(): void {
  const menu = document.querySelector<HTMLDetailsElement>('.site-nav__mobile');
  const summary = menu?.querySelector('summary');
  if (!menu || !summary || menu.dataset.navigationReady) return;
  menu.dataset.navigationReady = 'true';

  const sync = (): void => {
    summary.setAttribute('aria-expanded', String(menu.open));
    summary.setAttribute('aria-label', menu.open ? 'Close navigation menu' : 'Open navigation menu');
  };
  const close = (): void => {
    menu.open = false;
    sync();
  };

  menu.addEventListener('toggle', sync);
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !menu.open) return;
    close();
    summary.focus();
  });
  document.addEventListener('pointerdown', (event) => {
    if (menu.open && event.target instanceof Node && !menu.contains(event.target)) close();
  });
  menu.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) close();
  });
  window.matchMedia('(min-width: 48rem)').addEventListener('change', (event) => {
    if (event.matches) close();
  });
  sync();
}
