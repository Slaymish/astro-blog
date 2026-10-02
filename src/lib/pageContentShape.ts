export function normalizeAboutPage(document: Record<string, any>) {
  const hero = document.hero ?? { intro: document.intro, heading: document.heading };
  const portrait = document.portrait ?? { imageAlt: document.portraitAlt, largeCopy: document.largeCopy };
  if (typeof hero.intro !== 'string' || !hero.intro.trim() ||
      typeof portrait.imageAlt !== 'string' || !portrait.imageAlt.trim() ||
      !Array.isArray(portrait.largeCopy) || !portrait.largeCopy.length ||
      !document.seo?.title || !document.seo?.description || !Array.isArray(document.background?.paragraphs)) {
    throw new Error('Invalid aboutPage: intro, portrait, SEO and background must be supplied by Sanity');
  }
  return { ...document, hero, portrait };
}

export function normalizeWritingPage(document: Record<string, any>) {
  if (!document.hero?.intro || !Array.isArray(document.hero.headlineLines)) {
    throw new Error('Invalid writingIndexPage: hero copy must be supplied by Sanity');
  }
  return {
    ...document,
    seo: document.seo ?? { title: 'Writing', description: 'Notes on AI and software systems by Hamish Burke.' },
    hero: { ...document.hero, eyebrow: document.hero.eyebrow ?? 'Writing' },
    filterLabel: document.filterLabel ?? 'Filter by tag',
    emptyMessage: document.emptyMessage ?? 'Nothing here yet.'
  };
}
