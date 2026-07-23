import { publicPostSlug } from './legacyRoutes';

export type WorkStatus = 'lead' | 'support';
export type WorkService = 'ai-automation' | 'digital-products' | 'technical-direction';
export type ArtifactType = 'project' | 'post' | 'report';
export type GraphicKind =
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
  status: WorkStatus;
  order: number;
  service: WorkService;
  date: string;
  summary: string;
  problem: string;
  role: string;
  timeframe?: string;
  interventions: string[];
  result: string;
  graphic: {
    kind: GraphicKind;
    alt: string;
  };
  body: unknown[];
  primaryArtifact?: WorkArtifact;
  supportingArtifacts: WorkArtifact[];
}

export function workStoryHref(slug: string): string {
  return `/work/${slug}`;
}

export function artifactHref(artifact: WorkArtifact): string {
  const route = artifact.type === 'post' ? 'posts' : `${artifact.type}s`;
  const slug = artifact.type === 'post' ? publicPostSlug(artifact.slug) : artifact.slug;
  return `/${route}/${slug}`;
}

export function validateWorkStories(stories: WorkStory[]): string[] {
  const errors: string[] = [];

  for (const story of stories) {
    if (!story.summary.trim()) {
      errors.push(`${story.title}: summary is required`);
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
