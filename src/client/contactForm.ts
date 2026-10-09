/** Native validation and a normal form post remain available without JavaScript. */
export function initContactForms(): void {
  document.querySelectorAll<HTMLFormElement>('[data-contact-form]').forEach((form) => {
    const input = form.querySelector<HTMLInputElement>('[name="email"]');
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const announcer = form.querySelector<HTMLElement>('[data-contact-announce]');
    if (!input || !button) return;
    const setState = (state: string): void => {
      form.dataset.state = state;
      const busy = state === 'sending';
      input.readOnly = busy;
      button.setAttribute('aria-disabled', String(busy));
      button.setAttribute('aria-busy', String(busy));
      if (announcer) announcer.textContent = form.querySelector(`[data-for="${state}"]`)?.textContent ?? '';
    };
    input.addEventListener('input', () => {
      if (form.dataset.state !== 'sending') setState('idle');
    });
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (form.dataset.state === 'sending') return;
      setState('sending');
      try {
        const response = await fetch(form.action, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(form))),
        });
        if (response.ok) { input.value = ''; setState('success'); }
        else setState(response.status === 429 ? 'limited' : 'error');
      } catch { setState('error'); }
    });
  });
}
