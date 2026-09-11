const WORDS_PER_MINUTE = 200;

export function readingTime(text: string): { minutes: number; words: number } {
  const words = text.split(/\s+/).filter(Boolean).length;
  return { minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)), words };
}
