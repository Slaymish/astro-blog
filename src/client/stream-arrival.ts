/** Release units only after their characters (and a boundary) have arrived. */
export function completionOffsets(source: string, units: readonly string[]): number[] {
  let cursor = 0;
  return units.map((unit) => {
    const text = unit.trim();
    const start = source.indexOf(text, cursor);
    if (start < 0) throw new Error('Reveal unit does not match source stream');
    cursor = start + text.length;
    // One following character confirms a word/chunk boundary; EOF confirms the last.
    return Math.min(source.length, cursor + 1);
  });
}

/** Sentences keep their trailing space: the sentence view joins them with none. */
export function sentencesOf(text: string): string[] {
  return text.match(/[^.!?]+[.!?]+['\u2019]?\s*/g) ?? [text];
}

export interface HybridPhases {
  /** Typed a character at a time: the answer's first clause. */
  lead: string;
  /** Revealed a word at a time: the rest of the first sentence. */
  words: string[];
  /** Revealed whole: every sentence after the first. */
  sentences: string[];
}

const CLAUSE_BREAK = /[,;:]\s/;
const LEAD_WORDS = 6;

/**
 * A hybrid answer starts at the finest granularity and coarsens, so the first
 * text arrives at character speed and the rest of the answer does not keep
 * arriving at a speed the reader has to fight. Each phase ends where the next
 * one begins, so the coarsening follows the text rather than a second clock.
 *
 * The lead is the first clause of the first sentence; without a clause break it
 * is the opening few words, because a whole first sentence painted at once is
 * not a fast start.
 */
export function hybridPhases(source: string): HybridPhases {
  const sentences = sentencesOf(source);
  const first = sentences[0]!.trim();
  const rest = sentences
    .slice(1)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const breakAt = CLAUSE_BREAK.exec(first);
  let leadEnd: number;
  if (breakAt) {
    leadEnd = breakAt.index + 1;
  } else {
    const words = first.split(/\s+/);
    leadEnd = words.length > LEAD_WORDS ? words.slice(0, LEAD_WORDS).join(' ').length : first.length;
  }

  return {
    lead: first.slice(0, leadEnd),
    words: first.slice(leadEnd).trim().split(/\s+/).filter(Boolean),
    sentences: rest,
  };
}
