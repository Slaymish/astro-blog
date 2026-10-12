import { timingSafeEqual } from './timingSafe';
import { codexStore, writeSucceeded, type CodexStore } from './codexStore';
const encoder = new TextEncoder();
export const AUTH_COOKIE = 'codex_gh_session';
export const STATE_COOKIE = 'codex_gh_state';
export const SESSION_SECONDS = 60 * 60;
export const STATE_SECONDS = 10 * 60;
export function githubAuthConfig() {
  const clientId = process.env.CODEX_GITHUB_CLIENT_ID;
  const clientSecret = process.env.CODEX_GITHUB_CLIENT_SECRET;
  const signingSecret = process.env.CODEX_AUTH_SECRET;
  const origin = process.env.CODEX_GITHUB_ORIGIN || 'https://hamishburke.dev';
  const preview = process.env.CONTEXT === 'deploy-preview' && origin === process.env.DEPLOY_PRIME_URL;
  if (!clientId || !clientSecret || !signingSecret || signingSecret.length < 32 ||
      (origin !== 'https://hamishburke.dev' && !preview) || !/^https:\/\/[^/]+$/.test(origin)) return null;
  return { clientId, clientSecret, signingSecret, origin };
}
function b64(bytes: Uint8Array): string { return Buffer.from(bytes).toString('base64url'); }
export async function digest(value: string): Promise<string> {
  return b64(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))));
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
  if (!payload || !signature || extra !== undefined || !/^[A-Za-z0-9_-]+$/.test(payload)) return null;
  if (!timingSafeEqual(await sign(payload, secret), signature)) return null;
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch { return null; }
}
export function cookie(name: string, value: string, maxAge: number): string {
  const path = name === STATE_COOKIE ? '/api/codex/github' : '/api/';
  return `${name}=${value}; Path=${path}; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
export function clearCookies(response: Response): void {
  response.headers.append('set-cookie', cookie(AUTH_COOKIE, '', 0));
  response.headers.append('set-cookie', cookie(STATE_COOKIE, '', 0));
  // Retire the scaffold's narrower cookies too. Reject duplicates while they exist.
  for (const name of [AUTH_COOKIE, STATE_COOKIE]) response.headers.append('set-cookie', `${name}=; Path=/api/codex; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}
export function readCookie(request: Request, name: string): string | undefined {
  const matches = request.headers.get('cookie')?.split(';').map(x => x.trim()).filter(x => x.startsWith(name + '='));
  return matches?.length === 1 ? matches[0].slice(name.length + 1) : undefined;
}
export interface GithubIdentity { id: number; login: string; exp: number; csrf: string; sid: string }
export function validProfile(id: unknown, login: unknown): boolean {
  return typeof id === 'number' && Number.isSafeInteger(id) && id > 0 &&
    typeof login === 'string' && login.trim() === login && /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(login);
}
export async function identity(request: Request, store: CodexStore | null = codexStore('auth')): Promise<GithubIdentity | null> {
  const config = githubAuthConfig();
  if (!config || !store) return null;
  const token = await unseal(readCookie(request, AUTH_COOKIE), config.signingSecret) as Record<string, unknown> | null;
  if (!token || token.purpose !== 'session' || typeof token.sid !== 'string' || !/^[a-f0-9-]{36}$/.test(token.sid) ||
      typeof token.exp !== 'number' || !Number.isFinite(token.exp) || token.exp <= Date.now() || token.exp > Date.now() + SESSION_SECONDS * 1000) return null;
  const entry = await store.getWithMetadata('session/' + token.sid, { type: 'json' });
  const x = entry?.data as GithubIdentity | undefined;
  if (!x || !validProfile(x.id, x.login) || x.sid !== token.sid || x.exp !== token.exp ||
      typeof x.csrf !== 'string' || !/^[a-f0-9-]{36}$/.test(x.csrf)) return null;
  return x;
}
export function validMutation(request: Request, user: GithubIdentity): boolean {
  const config = githubAuthConfig();
  return !!config && new URL(request.url).origin === config.origin && request.headers.get('origin') === config.origin &&
    (!request.headers.get('sec-fetch-site') || request.headers.get('sec-fetch-site') === 'same-origin') &&
    timingSafeEqual(request.headers.get('x-codex-csrf') || '', user.csrf);
}
export async function accountKey(id: number): Promise<string> {
  // Stable across auth-secret rotation. This private pseudonym is not a credential or anonymity guarantee.
  return 'account/' + await digest('codex-github-id-v2:' + id);
}
export async function claimState(store: CodexStore, state: string, exp: number): Promise<boolean> {
  return writeSucceeded(await store.setJSON('state/' + await digest(state), { exp }, { onlyIfNew: true }));
}
