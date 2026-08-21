import { publicPostSlug } from './legacyRoutes';
import type { PortableTextBody } from './portableText';

/** Which index a story appears on. Detail pages live at /work/<slug> for both. */
export type WorkKind = 'professional' | 'independent';
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
  | 'sprint-coach'
  | 'brontehf'
  | 'you-inc'
  | 'gpu-share'
  | 'health-agent'
  | 'home-lab'
  | 'wildfire';

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
  /** The measured fact shown on the homepage index. Absent on stories predating the field. */
  metric?: string;
  problem: string;
  role: string;
  timeframe?: string;
  interventions: string[];
  result: string;
  /** The four reflection answers. Required when kind is 'independent'. */
  question?: string;
  built?: string;
  learned?: string;
  differently?: string;
  graphic: {
    kind: GraphicKind;
    alt: string;
  };
  body: PortableTextBody;
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

/** The reflection answers an independent project must give, in the order they render. */
const REFLECTION_FIELDS = [
  ['question', 'what was the question'],
  ['built', 'what did I build'],
  ['learned', 'what did I learn'],
  ['differently', 'what would I do differently']
] as const;

export function validateWorkStories(stories: WorkStory[]): string[] {
  const errors: string[] = [];

  for (const story of stories) {
    if (!story.summary.trim()) {
      errors.push(`${story.title}: summary is required`);
    }
    if (story.kind === 'independent') {
      for (const [field, question] of REFLECTION_FIELDS) {
        if (!story[field]?.trim()) {
          errors.push(`${story.title}: ${field} (${question}) is required for independent projects`);
        }
      }
    }
    if (story.interventions.length < 1 || story.interventions.length > 3) {
      errors.push(`${story.title}: interventions must contain 1 to 3 items`);
    }
    if (!story.graphic.alt.trim()) {
      errors.push(`${story.title}: graphic alt text is required`);
    }
  }

  addDuplicateErrors(stories.map((story) => story.order), 'story order', errors);
  addDuplicateErrors(stories.map((story) => story.slug), 'story slug', errors);

  const assignedArtifacts = new Set<string>();
  const reportedArtifacts = new Set<string>();
  for (const story of stories) {
    const artifacts = [story.primaryArtifact, ...story.supportingArtifacts].filter(
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
