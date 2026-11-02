export type FeedView = 'all' | 'work' | 'writing';

export function readFeedFilter(url: URL, defaultType: FeedView = 'all'): FeedView {
  const type = url.searchParams.get('type');
  return type === 'work' || type === 'writing' || type === 'all' ? type : defaultType;
}

export function feedFilterUrl(url: URL, type: FeedView): string {
  const next = new URL(url);
  if (type === 'all') next.searchParams.delete('type');
  else next.searchParams.set('type', type);
  // Old topic-filter bookmarks now show the complete selected view.
  next.searchParams.delete('tag');
  return next.pathname + next.search + next.hash;
}

export function matchesFeedFilter(type: string, view: FeedView, linkedWriting = false): boolean {
  return view === 'all' ? type !== 'writing' || !linkedWriting : type === view;
}

export function initFeedFilter(): void {
  const feed = document.getElementById('feed-index');
  if (!feed) return;
  const controls = feed.querySelector<HTMLElement>('[data-feed-controls]');
  const views = [...feed.querySelectorAll<HTMLButtonElement>('[data-feed-view]')];
  if (!controls || !views.length) return;
  const entries = [...feed.querySelectorAll<HTMLElement>('[data-feed-entry]')];
  const years = [...feed.querySelectorAll<HTMLElement>('[data-feed-year]')];
  const empty = feed.querySelector<HTMLElement>('[data-feed-empty]');
  const startHere = feed.querySelector<HTMLElement>('[data-start-here]');
  const defaultType = feed.dataset.defaultType === 'writing' ? 'writing' : 'all';
  const readState = (): FeedView => {
    const url = new URL(window.location.href);
    return readFeedFilter(url, url.pathname === '/writing' ? defaultType : 'all');
  };
  let state = readState();

  const apply = (push: boolean): void => {
    for (const view of views) {
      view.setAttribute('aria-pressed', String(view.dataset.feedView === state));
    }
    let visible = 0;
    for (const entry of entries) {
      const show = matchesFeedFilter(entry.dataset.feedType ?? '', state, !!entry.dataset.associatedWork);
      entry.hidden = !show;
      if (show) visible += 1;
    }
    for (const year of years) {
      year.hidden = !year.querySelector('[data-feed-entry]:not([hidden])');
    }
    if (empty) empty.hidden = visible > 0;
    // The pinned band introduces the whole index, so it goes once a view is chosen.
    if (startHere) startHere.hidden = state !== 'all';
    const current = new URL(window.location.href);
    // Keep the local writing fallback consistent with its Netlify redirect.
    current.pathname = '/work';
    const next = feedFilterUrl(current, state);
    if (push) history.pushState(null, '', next);
    else history.replaceState(null, '', next);
  };

  for (const view of views) view.addEventListener('click', () => {
    const type = view.dataset.feedView;
    if (type !== 'all' && type !== 'work' && type !== 'writing') return;
    if (state === type) return;
    state = type;
    apply(true);
  });
  window.addEventListener('popstate', () => {
    state = readState();
    apply(false);
  });
  apply(false);
  controls.hidden = false;
}
