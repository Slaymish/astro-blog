/**
 * Copy-to-clipboard buttons on rendered code blocks. Article pages only —
 * `.prose` is the wrapper the Portable Text and Markdown renderers emit, and
 * `prose.css` gives `.prose pre` the positioning the button anchors to.
 */

const CODE_BLOCK_SELECTOR = '.prose pre';
const BUTTON_CLASS = 'code-copy-btn';
/** How long the button shows the confirmation before reverting. */
const CONFIRM_MS = 2000;

export function initCodeCopy(): void {
  if (!navigator.clipboard?.writeText) return;

  document.querySelectorAll<HTMLPreElement>(CODE_BLOCK_SELECTOR).forEach((pre) => {
    if (pre.querySelector('.' + BUTTON_CLASS)) return;

    const button = document.createElement('button');
    button.className = `btn btn--secondary btn--sm btn--surface ${BUTTON_CLASS}`;
    button.type = 'button';
    button.setAttribute('aria-label', 'Copy code');
    button.textContent = 'Copy';

    let confirmation: ReturnType<typeof setTimeout>;
    button.addEventListener('click', async () => {
      const code = pre.querySelector('code');
      const text = code?.textContent ?? [...pre.childNodes]
        .filter((node) => node !== button).map((node) => node.textContent).join('');
      clearTimeout(confirmation);
      try {
        await navigator.clipboard.writeText(text || '');
        button.textContent = 'Copied!';
        confirmation = setTimeout(() => {
          button.textContent = 'Copy';
        }, CONFIRM_MS);
      } catch {
        // Keep the code selectable and allow another attempt after a denial.
        button.textContent = 'Copy';
      }
    });

    pre.appendChild(button);
  });
}
