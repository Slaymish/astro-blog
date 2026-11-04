import type { WorkStory, WritingEntry } from './types';
import { isValueScore } from './valueScore';
import { artifactHref } from './work';

interface Rankable { valueScore?: number | null; publishedAt: string; href: string }
const HALF_LIFE = 90 * 24 * 60 * 60 * 1000;

/** Build-time only. Original publication dates earn at most five points. */
export function freshnessPoints(publishedAt: string, now: number): number {
  const age = now - Date.parse(publishedAt);
  return Number.isFinite(age) && age >= 0 ? 5 * 2 ** (-age / HALF_LIFE) : 0;
}

/** Keeps assessment private and leaves both the array and its entries untouched. */
export function rankByValue<T extends Rankable>(entries: readonly T[], now: number): T[] {
  const base = (entry: T) => isValueScore(entry.valueScore) ? entry.valueScore : -1;
  const effective = (entry: T) => base(entry) < 0 ? -1 : base(entry) + freshnessPoints(entry.publishedAt, now);
  const date = (entry: T) => Number.isFinite(Date.parse(entry.publishedAt)) ? Date.parse(entry.publishedAt) : -Infinity;
  return [...entries].sort((a, b) =>
    effective(b) - effective(a) || base(b) - base(a) || date(b) - date(a) ||
    (a.href < b.href ? -1 : a.href > b.href ? 1 : 0));
}

export function selectHomeWork(stories: readonly WorkStory[], curated: readonly string[], now: number): WorkStory[] {
  const eligible = stories.filter((story) => isValueScore(story.valueScore) && story.valueScore >= 70);
  if (eligible.length) return rankByValue(eligible.map((story) => ({
    story, valueScore: story.valueScore, publishedAt: story.date, href: `/work/${story.slug}`,
  })), now).slice(0, 5).map(({ story }) => story);
  const missing = curated.filter((slug) => !stories.some((story) => story.slug === slug));
  if (missing.length) throw new Error(`homePage.featured references missing work stories: ${missing.join(', ')}`);
  return curated.map((slug) => stories.find((story) => story.slug === slug)!);
}

export function selectHomeWriting(writing: readonly WritingEntry[], featured: readonly WorkStory[], now: number): WritingEntry | undefined {
  const linked = new Set(featured.flatMap((story) => story.artifacts.map((artifact) => artifactHref(artifact._type, artifact.slug))));
  return rankByValue(writing.filter((entry) => !linked.has(entry.href)), now)[0];
}
