/** A single reply address, never a list or a header supplied by a visitor. */
export function cleanContactEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim();
  if (email.length > 254 || /[\s\x00-\x1f\x7f]/.test(email)) return null;
  return /^[^@<>(),;:\\"\[\]]+@[^@<>(),;:\\"\[\]]+\.[^@<>(),;:\\"\[\]]+$/.test(email) ? email : null;
}
