export type FeedView = 'all' | 'work' | 'writing';
export interface FeedFilterState { type: FeedView; tag: string | null }

export function readFeedFilter(url: URL, knownTags: string[], defaultType: FeedView = 'all'): FeedFilterState {
  const requestedType = url.searchParams.get('type');
  const type = requestedType === 'work' || requestedType === 'writing' || requestedType === 'all'
    ? requestedType : defaultType;
  const requestedTag = url.searchParams.get('tag');
  return { type, tag: requestedTag && knownTags.includes(requestedTag) ? requestedTag : null };
}

export function feedFilterUrl(url: URL, state: FeedFilterState): string {
  const next = new URL(url);
  if (state.type === 'all') next.searchParams.delete('type');
  else next.searchParams.set('type', state.type);
  if (state.tag === null) next.searchParams.delete('tag');
  else next.searchParams.set('tag', state.tag);
  return next.pathname + next.search + next.hash;
}

export function matchesFeedFilter(type: string, tags: string[], state: FeedFilterState): boolean {
  return (state.type === 'all' || type === state.type) && (state.tag === null || tags.includes(state.tag));
}

export function initFeedFilter(): void {
  const feed = document.getElementById('feed-index');
  if (!feed) return;
  const controls = feed.querySelector<HTMLElement>('[data-feed-controls]');
  const select = feed.querySelector<HTMLSelectElement>('[data-feed-view]');
  if (!controls || !select) return;
  const chips = [...feed.querySelectorAll<HTMLButtonElement>('[data-feed-tag]')];
  const entries = [...feed.querySelectorAll<HTMLElement>('[data-feed-entry]')];
  const years = [...feed.querySelectorAll<HTMLElement>('[data-feed-year]')];
  const empty = feed.querySelector<HTMLElement>('[data-feed-empty]');
  const status = feed.querySelector<HTMLElement>('[data-feed-status]');
  const reset = feed.querySelector<HTMLButtonElement>('[data-feed-reset]');
  const topics = feed.querySelector<HTMLDetailsElement>('[data-feed-topics]');
  const wide = window.matchMedia('(min-width: 48rem)');
  const knownTags = chips.map((chip) => chip.dataset.feedTag ?? '').filter(Boolean);
  const defaultType = feed.dataset.defaultType === 'writing' ? 'writing' : 'all';
  let state = readFeedFilter(new URL(window.location.href), knownTags, defaultType);

  const apply = (push: boolean): void => {
    select.value = state.type;
    for (const chip of chips) {
      chip.setAttribute('aria-pressed', String((chip.dataset.feedTag || null) === state.tag));
    }
    let visible = 0;
    for (const entry of entries) {
      const show = matchesFeedFilter(entry.dataset.feedType ?? '',
        (entry.dataset.tags ?? '').split(' ').filter(Boolean), state);
      entry.hidden = !show;
      if (show) visible += 1;
    }
    for (const year of years) {
      year.hidden = !year.querySelector('[data-feed-entry]:not([hidden])');
    }
    if (empty) empty.hidden = visible > 0;
    if (status) status.textContent = `${visible} ${status.dataset.resultsLabel ?? ''}`;
    if (reset) reset.hidden = state.type === 'all' && state.tag === null;
    // An active tag is never folded out of sight.
    if (topics && state.tag !== null) topics.open = true;
    const current = new URL(window.location.href);
    // Local /writing is a fallback for the Netlify redirect. Canonicalise its
    // filter links too, so resetting All works after reload.
    current.pathname = '/work';
    const next = feedFilterUrl(current, state);
    if (push) history.pushState(null, '', next);
    else history.replaceState(null, '', next);
  };

  select.addEventListener('change', () => {
    state = { ...state, type: select.value as FeedView };
    apply(true);
  });
  for (const chip of chips) chip.addEventListener('click', () => {
    const tag = chip.dataset.feedTag || null;
    state = { ...state, tag: state.tag === tag ? null : tag };
    apply(true);
  });
  reset?.addEventListener('click', () => {
    state = { type: 'all', tag: null };
    apply(true);
  });
  window.addEventListener('popstate', () => {
    state = readFeedFilter(new URL(window.location.href), knownTags, defaultType);
    apply(false);
  });
  // Open on wide screens, folded on a phone. The markup ships open so the tags
  // are never hidden from a visitor whose script does not run.
  if (topics) {
    topics.open = wide.matches;
    wide.addEventListener('change', (event) => {
      if (event.matches) topics.open = true;
    });
  }
  apply(false);
  controls.hidden = false;
}
