/**
 * Copy-to-clipboard buttons on rendered code blocks. Article pages only —
 * `.prose` is the wrapper the Portable Text and Markdown renderers emit.
 */

const CODE_BLOCK_SELECTOR = '.prose pre';
const BUTTON_CLASS = 'code-copy-btn';
/** How long the button shows the confirmation before reverting. */
const CONFIRM_MS = 2000;

export function initCodeCopy(): void {
  document.querySelectorAll<HTMLPreElement>(CODE_BLOCK_SELECTOR).forEach((pre) => {
    if (pre.querySelector('.' + BUTTON_CLASS)) return;

    const button = document.createElement('button');
    button.className = BUTTON_CLASS;
    button.setAttribute('aria-label', 'Copy code');
    button.textContent = 'Copy';

    button.addEventListener('click', () => {
      const code = pre.querySelector('code');
      const text = code ? code.textContent : pre.textContent;
      navigator.clipboard.writeText(text || '').then(() => {
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.textContent = 'Copy';
        }, CONFIRM_MS);
      });
    });

    pre.style.position = 'relative';
    pre.appendChild(button);
  });
}
