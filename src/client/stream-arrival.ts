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
