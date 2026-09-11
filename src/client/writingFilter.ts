/**
 * Tag filtering on /writing. Every entry is already in the document, so this
 * only hides and shows; the choice is mirrored into the URL as ?tag=<slug> so
 * a filtered view can be linked and is restored on load.
 */

const FILTER_ID = 'writing-filter';
const ALL = 'all';

export function initWritingFilter(): void {
  const filter = document.getElementById(FILTER_ID);
  if (!filter) return;

  const chips = Array.from(filter.querySelectorAll<HTMLButtonElement>('[data-tag]'));
  const entries = Array.from(document.querySelectorAll<HTMLElement>('[data-tags]'));
  if (chips.length === 0 || entries.length === 0) return;

  const apply = (tag: string, pushUrl: boolean): void => {
    for (const chip of chips) {
      chip.setAttribute('aria-pressed', String((chip.dataset.tag ?? ALL) === tag));
    }
    let visible = 0;
    for (const entry of entries) {
      const tags = (entry.dataset.tags ?? '').split(' ').filter(Boolean);
      const show = tag === ALL || tags.includes(tag);
      entry.hidden = !show;
      if (show) visible += 1;
    }
    const empty = document.getElementById('writing-empty');
    if (empty) empty.hidden = visible > 0;
    if (!pushUrl) return;
    const url = new URL(window.location.href);
    if (tag === ALL) url.searchParams.delete('tag');
    else url.searchParams.set('tag', tag);
    history.replaceState(null, '', url.pathname + url.search);
  };

  for (const chip of chips) {
    chip.addEventListener('click', () => {
      const tag = chip.dataset.tag ?? ALL;
      apply(chip.getAttribute('aria-pressed') === 'true' ? ALL : tag, true);
    });
  }

  const requested = new URL(window.location.href).searchParams.get('tag');
  const known = requested && chips.some((chip) => chip.dataset.tag === requested);
  apply(known ? requested : ALL, false);
}
