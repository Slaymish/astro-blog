/** A present score is an editorial integer from 0 to 100, including zero. */
export function isValueScore(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 100;
}
