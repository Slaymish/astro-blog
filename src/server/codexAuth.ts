/** Minimal signed GitHub identity cookies for the Codex contribution flow. */
const encoder = new TextEncoder();
export const AUTH_COOKIE = 'codex_gh_session';
export const STATE_COOKIE = 'codex_gh_state';
export const SESSION_SECONDS = 60 * 60;
export const STATE_SECONDS = 10 * 60;

export function githubAuthConfig() {
  const clientId = process.env.CODEX_GITHUB_CLIENT_ID;
  const clientSecret = process.env.CODEX_GITHUB_CLIENT_SECRET;
  const signingSecret = process.env.CODEX_AUTH_SECRET;
  if (!clientId || !clientSecret || !signingSecret || signingSecret.length < 32) return null;
  return { clientId, clientSecret, signingSecret };
}
function b64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function unb64(value: string): Uint8Array {
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4));
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}
async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(payload))));
}
export async function seal(value: object, secret: string): Promise<string> {
  const payload = b64(encoder.encode(JSON.stringify(value)));
  return payload + '.' + await sign(payload, secret);
}
export async function unseal(value: string | undefined, secret: string): Promise<unknown | null> {
  if (!value || value.length > 4096) return null;
  const [payload, signature, extra] = value.split('.');
  if (!payload || !signature || extra !== undefined) return null;
  const expected = await sign(payload, secret);
  // Fixed-length signatures, compared without early exit.
  if (expected.length !== signature.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  if (diff !== 0) return null;
  try { return JSON.parse(new TextDecoder().decode(unb64(payload))); } catch { return null; }
}
export function cookie(name: string, value: string, maxAge: number): string {
  return `${name}=${value}; Path=/api/codex; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
export function readCookie(request: Request, name: string): string | undefined {
  return request.headers.get('cookie')?.split(';').map(x => x.trim()).find(x => x.startsWith(name + '='))?.slice(name.length + 1);
}
export interface GithubIdentity { id: number; login: string; exp: number }
export async function identity(request: Request): Promise<GithubIdentity | null> {
  const config = githubAuthConfig();
  if (!config) return null;
  const data = await unseal(readCookie(request, AUTH_COOKIE), config.signingSecret);
  if (!data || typeof data !== 'object') return null;
  const x = data as Record<string, unknown>;
  if (typeof x.id !== 'number' || !Number.isSafeInteger(x.id) || x.id < 1 ||
    typeof x.login !== 'string' || !/^[a-zA-Z0-9-]{1,39}$/.test(x.login) ||
    typeof x.exp !== 'number' || x.exp <= Date.now()) return null;
  return x as unknown as GithubIdentity;
}
