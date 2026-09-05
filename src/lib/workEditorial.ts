import type { WorkStory } from './work';

export const featuredSlugs = ['you-inc', 'sprint-coach', 'home-lab'];
const introductions: Record<string, string> = {
  'you-inc': 'I wanted one view of what I own, owe, earn and spend. I built a finance product around a ledger, then removed the SaaS layer so it could belong to the person running it.',
  'sprint-coach': 'Nathan’s coaching business grew by word of mouth. His first website needed to show athletes and parents who they would be training with, and make the next step easy.',
  'home-lab': 'What would happen if I lost the machine running my home services? I built a small server around that question, then tested a full recovery.',
  'brontehf': 'Brontë brought the design. I built a portfolio they could keep updating themselves, with an editing workflow that preserves their visual direction.',
  'gpu-share': 'My desktop GPU sits idle most of the day. I built a way for friends to share it for local AI and rendering, with the limits of a home machine visible.',
  'health-agent': 'My nutrition and activity lived in different apps. I brought their Apple Health exports together so I could see the trends in one place.',
  'wildfire-pyspark': 'A model can look accurate while missing the fires that matter most. I explored that problem across 1.88 million wildfire records.'
};
export function introduction(story: WorkStory): string {
  return story.introduction || introductions[story.slug] || story.summary;
}
export function workCategory(story: WorkStory): string {
  return story.graphic.kind === 'wildfire' ? 'Research' : story.kind === 'professional' ? 'Client' : 'Independent';
}
