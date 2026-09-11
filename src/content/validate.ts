import type { Post, Report, WorkStory } from './types';

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
