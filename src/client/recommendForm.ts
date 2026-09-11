/**
 * Progressive enhancement for the book recommendation form on /reading.
 *
 * Without this module the browser posts the form encoded and follows the 303
 * to /reading/sent. With it, the same validation and metering happen over
 * fetch and the answer appears in place.
 */

type State = 'idle' | 'empty' | 'sending' | 'error' | 'limited' | 'success';

export function initRecommendForm(): void {
  const form = document.getElementById('recommend') as HTMLFormElement | null;
  const input = document.getElementById('recommend-title') as HTMLInputElement | null;
  if (!form || !input) return;

  const button = document.getElementById('recommend-submit') as HTMLButtonElement | null;

  const setState = (state: State): void => {
    form.dataset.state = state;
    const busy = state === 'sending';
    input.disabled = busy || state === 'success';
    if (button) {
      button.disabled = busy || state === 'success';
      if (busy) button.setAttribute('aria-busy', 'true');
      else button.removeAttribute('aria-busy');
    }
    input.setAttribute('aria-invalid', state === 'empty' ? 'true' : 'false');
  };

  // Typing again after a rejected send clears the message.
  input.addEventListener('input', () => {
    if (form.dataset.state === 'empty' || form.dataset.state === 'error') setState('idle');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
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
      else if (response.ok) setState('success');
      else setState('error');
    } catch {
      setState('error');
    }
  });
}
