import { publicPostSlug } from './legacyRoutes';

/** Which index a story appears on. Detail pages live at /work/<slug> for both. */
export type WorkKind = 'professional' | 'independent' | 'research';
export type WorkStatus = 'lead' | 'support';
export type WorkService = 'ai-automation' | 'digital-products' | 'technical-direction';
/**
 * What a story can cite as source material. `project` is legacy: the schema no
 * longer offers it as a reference target, but five published stories still point
 * at one, and those documents carry the repo and live-site URLs the work cards
 * render. Keep it here until that data is migrated.
 */
export type ArtifactType = 'project' | 'post' | 'report';
export type GraphicKind =
  | 'the-city'
  | 'sprint-coach'
  | 'brontehf'
  | 'you-inc'
  | 'gpu-share'
  | 'health-agent'
  | 'home-lab'
  | 'wildfire';

/**
 * The kinds backed by a screenshot rather than a composed diagram. The composed
 * ones are authored for the work page's ~34rem frame and are unreadable below
 * it, so this is what decides where a graphic may be shown small. Every kind
 * listed here must have an image in WorkGraphic.astro, which types its map
 * against `ScreenshotGraphicKind` so the two cannot drift.
 */
export const SCREENSHOT_GRAPHIC_KINDS = ['sprint-coach', 'brontehf', 'health-agent'] as const;
export type ScreenshotGraphicKind = (typeof SCREENSHOT_GRAPHIC_KINDS)[number];

export function isScreenshotGraphic(kind: GraphicKind): kind is ScreenshotGraphicKind {
  return (SCREENSHOT_GRAPHIC_KINDS as readonly GraphicKind[]).includes(kind);
}

export interface WorkArtifact {
  id: string;
  type: ArtifactType;
  title: string;
  slug: string;
  description?: string;
  date?: string;
  liveUrl?: string;
  githubUrl?: string;
}

export interface WorkStory {
  id: string;
  title: string;
  descriptor: string;
  slug: string;
  kind: WorkKind;
  status: WorkStatus;
  order: number;
  service: WorkService;
  date: string;
  summary: string;
  introduction?: string;
  body?: unknown[];
  narrative?: unknown[];
  /** The measured fact shown on the homepage index. Absent on stories predating the field. */
  metric?: string;
  problem: string;
  role: string;
  timeframe?: string;
  interventions: string[];
  result: string;
  /**
   * Legacy reflection answers. Optional: nothing has rendered them since the
   * September 2026 redesign, and the site's content rules steer away from the
   * "what would I do differently" formula they encoded.
   */
  question?: string;
  built?: string;
  learned?: string;
  differently?: string;
  graphic: {
    kind: GraphicKind;
    alt: string;
    src?: string;
  };
  cover?: { alt: string; imageUrl?: string };
  links?: { href: string; label: string; external?: boolean }[];
  evidence?: { heading: string; caption: string; alt: string; imageUrl?: string }[];
  primaryArtifact?: WorkArtifact;
  supportingArtifacts: WorkArtifact[];
}

export function workStoryHref(slug: string): string {
  return `/work/${slug}`;
}

/** Posts are published under their public alias; reports under their own slug. */
export function artifactHref(artifact: WorkArtifact): string {
  return artifact.type === 'post'
    ? `/posts/${publicPostSlug(artifact.slug)}`
    : `/reports/${artifact.slug}`;
}

export function validateWorkStories(stories: WorkStory[]): string[] {
  const errors: string[] = [];

  for (const story of stories) {
    if (typeof story.summary !== 'string' || !story.summary.trim()) {
      errors.push(`${story.title}: summary is required`);
    }
    if (!Array.isArray(story.interventions) || story.interventions.length < 1 || story.interventions.length > 3) {
      errors.push(`${story.title}: interventions must contain 1 to 3 items`);
    }
    if (typeof story.graphic?.alt !== 'string' || !story.graphic.alt.trim()) {
      errors.push(`${story.title}: graphic alt text is required`);
    }
    if (!Number.isInteger(story.order) || story.order < 0) errors.push(`${story.title}: order must be a non-negative integer`);
    if (story.graphic?.kind === 'the-city' && !story.graphic.src?.startsWith('https://cdn.sanity.io/images/')) {
      errors.push(`${story.title}: The City requires its Sanity cover image`);
    }
  }

  addDuplicateErrors(stories.map((story) => story.order), 'story order', errors);
  addDuplicateErrors(stories.map((story) => story.slug), 'story slug', errors);

  const assignedArtifacts = new Set<string>();
  const reportedArtifacts = new Set<string>();
  for (const story of stories) {
    const artifacts = [story.primaryArtifact, ...(story.supportingArtifacts ?? [])].filter(
      (artifact): artifact is WorkArtifact => Boolean(artifact)
    );
    for (const artifact of artifacts) {
      if (assignedArtifacts.has(artifact.id) && !reportedArtifacts.has(artifact.id)) {
        errors.push(`Artifact ${artifact.id} is assigned more than once`);
        reportedArtifacts.add(artifact.id);
      }
      assignedArtifacts.add(artifact.id);
    }
  }

  return errors;
}

export function normalizeWorkStory(story: WorkStory): WorkStory {
  if (story.slug !== 'the-city') return story;
  const headings = (story.body ?? []).filter((block: any) => block.style === 'h2')
    .slice(0, 3).map((block: any) => block.children.map((child: any) => child.text ?? '').join(''));
  return {
    ...story,
    status: story.status ?? 'support',
    service: story.service ?? 'digital-products',
    problem: story.problem ?? story.summary,
    interventions: story.interventions ?? headings,
    graphic: story.graphic ?? { kind: 'the-city', alt: story.cover?.alt ?? '', src: story.cover?.imageUrl },
    supportingArtifacts: story.supportingArtifacts ?? []
  };
}

function addDuplicateErrors(
  values: Array<string | number>,
  label: string,
  errors: string[]
): void {
  const seen = new Set<string | number>();
  const reported = new Set<string | number>();
  for (const value of values) {
    if (seen.has(value) && !reported.has(value)) {
      errors.push(`Duplicate ${label}: ${value}`);
      reported.add(value);
    }
    seen.add(value);
  }
}
