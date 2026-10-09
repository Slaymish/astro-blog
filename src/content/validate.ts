import type { Post, Report, SiteSettings, WorkStory } from './types';

const missing = (value: string | undefined | null): boolean => !value || value.trim().length === 0;

function duplicates<T>(values: T[]): T[] {
  const seen = new Set<T>();
  const dupes = new Set<T>();
  for (const value of values) {
    if (seen.has(value)) dupes.add(value);
    seen.add(value);
  }
  return [...dupes];
}

/**
 * Everything the work pages assume but Studio cannot enforce across documents.
 * The queries throw on a non-empty result, which fails the build.
 */
export function validateWorkStories(stories: WorkStory[]): string[] {
  const errors: string[] = [];

  for (const order of duplicates(stories.map((s) => s.order))) {
    errors.push(`duplicate order ${order}`);
  }
  for (const slug of duplicates(stories.map((s) => s.slug))) {
    errors.push(`duplicate slug "${slug}"`);
  }

  for (const story of stories) {
    const where = story.slug || story._id;

    for (const field of ['introduction', 'summary', 'result', 'role'] as const) {
      if (missing(story[field])) errors.push(`${where}: ${field} is empty`);
    }

    if (!story.cover) {
      errors.push(`${where}: cover is missing`);
    } else {
      if (missing(story.cover.alt)) errors.push(`${where}: cover.alt is empty`);
      if (story.cover.kind === 'image' && !story.cover.image?.asset?.url) {
        errors.push(`${where}: image cover has no asset`);
      }
      if (story.cover.kind === 'figure') {
        if (missing(story.cover.figure?.title)) errors.push(`${where}: figure cover has no title`);
        if (!story.cover.figure?.facts?.length) errors.push(`${where}: figure cover has no facts`);
      }
    }

    if (story.introductionLink && !story.introduction?.includes(story.introductionLink.text)) {
      errors.push(`${where}: introductionLink text "${story.introductionLink.text}" is not in the introduction`);
    }

    for (const link of story.links ?? []) {
      if (missing(link.label) || missing(link.href)) {
        errors.push(`${where}: a link is missing its label or href`);
        continue;
      }
      if (link.href.startsWith('http') && !link.external) {
        errors.push(`${where}: link "${link.label}" is external but not marked external`);
      }
    }

    for (const item of story.evidence ?? []) {
      if (!item.image?.asset?.url) errors.push(`${where}: an evidence item has no asset`);
      if (missing(item.alt)) errors.push(`${where}: an evidence item has no alt text`);
    }
  }

  return errors;
}

export function validatePosts(posts: Post[]): string[] {
  const errors: string[] = [];

  for (const slug of duplicates(posts.map((p) => p.slug))) {
    errors.push(`duplicate slug "${slug}"`);
  }

  for (const post of posts) {
    const where = post.slug || post._id;
    if (missing(post.excerpt)) errors.push(`${where}: excerpt is empty`);
    if (missing(post.markdownBody)) errors.push(`${where}: markdownBody is empty`);
    if (post.coverImage?.asset?.url && missing(post.coverImage.alt)) {
      errors.push(`${where}: cover image has no alt text`);
    }
  }

  return errors;
}

export function validateReports(reports: Report[]): string[] {
  const errors: string[] = [];

  for (const slug of duplicates(reports.map((r) => r.slug))) {
    errors.push(`duplicate slug "${slug}"`);
  }

  for (const report of reports) {
    const where = report.slug || report._id;
    if (missing(report.description)) errors.push(`${where}: description is empty`);
    if (missing(report.pdfUrl)) errors.push(`${where}: pdfUrl is empty`);
  }

  return errors;
}

/**
 * Every string the shell and the entry pages read from Site Settings. Studio
 * marks them required, but a document saved before a field existed has no
 * value, and an empty label would render as an unnamed link or button.
 */
const SITE_SETTINGS_FIELDS: { [Group in keyof SiteSettings]: SiteSettings[Group] extends string ? true : Array<keyof SiteSettings[Group]> } = {
  header: ['readingLabel', 'aboutLabel', 'contactLabel', 'navigationLabel', 'homeLinkLabel', 'menuLabel', 'themeToLightLabel', 'themeToDarkLabel'],
  footer: ['tagline', 'navigationLabel', 'emailLabel', 'githubLabel', 'linkedinLabel', 'cvLabel', 'rssLabel', 'privacyLabel', 'termsLabel'],
  newTabNote: true,
  contactBand: ['label', 'defaultHeading', 'professionalHeading', 'contactLabel', 'bookingLabel'],
  workCtaLabel: true,
  entryLabels: [
    'allWorkLabel', 'allWritingLabel', 'outcomeHeading', 'artifactsHeading', 'sourceCodeLabel', 'relatedHeading',
    'articleLabel', 'reportLabel', 'readingTimeSuffix', 'pdfSizeSuffix', 'openPdfLabel',
  ],
  pdfViewer: ['previousPage', 'nextPage', 'zoomOut', 'zoomIn', 'resetZoom', 'fullscreen', 'loading', 'error', 'openDirectly'],
};

export function validateSiteSettings(settings: SiteSettings): string[] {
  const errors: string[] = [];
  for (const [group, fields] of Object.entries(SITE_SETTINGS_FIELDS)) {
    const value = (settings as unknown as Record<string, unknown>)[group];
    if (fields === true) {
      if (typeof value !== 'string' || missing(value)) errors.push(`${group} is empty`);
      continue;
    }
    const object = (value ?? {}) as Record<string, unknown>;
    for (const field of fields as string[]) {
      const leaf = object[field];
      if (typeof leaf !== 'string' || missing(leaf)) errors.push(`${group}.${field} is empty`);
    }
  }
  return errors;
}
