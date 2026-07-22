import { fetchSanity } from './sanity';
import { type WorkStory, validateWorkStories } from './work';

const workStoryFields = `
  "id": _id,
  title,
  descriptor,
  "slug": slug.current,
  status,
  order,
  service,
  date,
  summary,
  problem,
  role,
  timeframe,
  interventions,
  result,
  graphic,
  body,
  "primaryArtifact": primaryArtifact->{
    "id": _id,
    "type": _type,
    title,
    "slug": slug.current,
    "description": coalesce(description, excerpt),
    "date": coalesce(date, publishedAt),
    "liveUrl": link,
    "githubUrl": github
  },
  "supportingArtifacts": supportingArtifacts[]->{
    "id": _id,
    "type": _type,
    title,
    "slug": slug.current,
    "description": coalesce(description, excerpt),
    "date": coalesce(date, publishedAt),
    "liveUrl": link,
    "githubUrl": github
  }
`;

export async function getWorkStories(): Promise<WorkStory[]> {
  const stories = await fetchSanity<WorkStory[]>(`
    *[_type == "workStory"] | order(order asc) {
      ${workStoryFields}
    }
  `);

  assertValidCollection(stories);
  return stories;
}

export async function getWorkStory(slug: string): Promise<WorkStory | null> {
  const story = await fetchSanity<WorkStory | null>(
    `*[_type == "workStory" && slug.current == $slug][0] { ${workStoryFields} }`,
    { slug }
  );

  if (!story) return null;

  const errors = validateWorkStories([story]);
  if (errors.length > 0) {
    throw new Error(`Invalid work story: ${errors.join('; ')}`);
  }
  return story;
}

function assertValidCollection(stories: WorkStory[]): void {
  const errors = validateWorkStories(stories);
  if (errors.length > 0) {
    throw new Error(`Invalid work story collection: ${errors.join('; ')}`);
  }
}
