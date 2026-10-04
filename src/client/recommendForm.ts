/**
 * Progressive enhancement for the book recommendation form on /reading.
 *
 * Without this module the browser posts the form encoded and follows the 303
 * to /reading/sent. With it, the same validation and metering happen over
 * fetch and the answer appears in place.
 *
 * Nothing the visitor is focused on is ever disabled: a disabled control drops
 * focus to the document. While a send is in flight the input is read-only and
 * the button is aria-disabled, and a second submit is ignored instead.
 */

type State = 'idle' | 'empty' | 'sending' | 'error' | 'limited' | 'success';

export function initRecommendForm(): void {
  const form = document.getElementById('recommend') as HTMLFormElement | null;
  const input = document.getElementById('recommend-title') as HTMLInputElement | null;
  if (!form || !input) return;

  const button = document.getElementById('recommend-submit') as HTMLButtonElement | null;
  const announcer = form.querySelector<HTMLElement>('[data-recommend-announce]');

  // The browser's own "fill in this field" bubble would pre-empt the empty
  // message below. `required` stays in the markup for the no-script post.
  form.noValidate = true;

  const setState = (state: State): void => {
    form.dataset.state = state;
    const busy = state === 'sending';
    input.readOnly = busy;
    if (button) {
      if (busy) {
        button.setAttribute('aria-busy', 'true');
        button.setAttribute('aria-disabled', 'true');
      } else {
        button.removeAttribute('aria-busy');
        button.removeAttribute('aria-disabled');
      }
    }
    input.setAttribute('aria-invalid', state === 'empty' ? 'true' : 'false');
    if (announcer) {
      const message = form.querySelector<HTMLElement>(`[data-for="${state}"]`);
      announcer.textContent = message?.textContent?.trim() ?? '';
    }
  };

  // Typing again clears the last message, including the thank-you, so the
  // form is ready for another recommendation without a reload.
  input.addEventListener('input', () => {
    const state = form.dataset.state;
    if (state === 'empty' || state === 'error' || state === 'success') setState('idle');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (form.dataset.state === 'sending') return;
    const title = input.value.replace(/\s+/g, ' ').trim();
    if (!title) {
      setState('empty');
      input.focus();
      return;
    }

    setState('sending');
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (response.status === 429) setState('limited');
      else if (response.ok) {
        input.value = '';
        setState('success');
      } else setState('error');
    } catch {
      setState('error');
    }
  });
}
