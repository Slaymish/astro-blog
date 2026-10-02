import type { WorkStory } from './work';

export const featuredSlugs = ['you-inc', 'sprint-coach', 'home-lab'];
const introductions: Record<string, string> = {
  'you-inc': 'I wanted one view of what I own, owe, earn and spend. I built You Inc around a ledger, then took the accounts and billing back out so people could run it on their own machine.',
  'sprint-coach': 'Nathan’s coaching business grew by word of mouth. His first website needed to show athletes and parents who they would be training with, and make the next step easy.',
  'home-lab': 'What would happen if I lost the machine running my home services? I built a small server around that question, then tested a full recovery.',
  'brontehf': 'Brontë brought the design. I built the portfolio around it, with the project content in a CMS so they could keep updating it themselves.',
  'gpu-share': 'My desktop GPU sits idle most of the day. I built a way for friends to share it for local AI and rendering, with the limits of a home machine visible.',
  'health-agent': 'My nutrition and activity lived in different apps. I brought their Apple Health exports together so I could see the trends in one place.',
  'wildfire-pyspark': 'I worked with 1.88 million US wildfire records for a university project, and got into how a model could look accurate while missing the larger fires.'
};
export function introduction(story: WorkStory): string {
  return story.introduction || introductions[story.slug] || story.summary;
}
export function workCategory(story: WorkStory): string {
  return story.graphic.kind === 'wildfire' ? 'Research' : story.kind === 'professional' ? 'Client' : 'Independent';
}
