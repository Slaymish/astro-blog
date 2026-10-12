import { consumeLimit, json } from './codexContributions';
import { clientAddress } from './rateLimit';
import { AUTH_COOKIE, STATE_COOKIE, SESSION_SECONDS, STATE_SECONDS, cookie, clearCookies, githubAuthConfig, readCookie, seal, unseal, validProfile, digest, claimState, identity, validMutation } from './codexAuth';
import { timingSafeEqual } from './timingSafe';
import { codexStore, writeSucceeded, type CodexStore } from './codexStore';
const headers = { 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' };
export async function startOAuth(request: Request, store: CodexStore | null = codexStore('auth')): Promise<Response> {
  const config = githubAuthConfig();
  if (!config || !store) return new Response(null, { status: 503, headers });
  if (new URL(request.url).origin !== config.origin || (request.headers.has('sec-fetch-site') && request.headers.get('sec-fetch-site') !== 'same-origin')) return new Response(null, { status: 403, headers });
  const state = crypto.randomUUID();
  const verifier = crypto.randomUUID() + crypto.randomUUID();
  const token = await seal({ purpose: 'state', state, verifier, exp: Date.now() + STATE_SECONDS * 1000 }, config.signingSecret);
  const target = new URL('https://github.com/login/oauth/authorize');
  target.searchParams.set('client_id', config.clientId);
  target.searchParams.set('redirect_uri', config.origin + '/api/codex/github/callback');
  target.searchParams.set('state', state);
  target.searchParams.set('scope', '');
  target.searchParams.set('code_challenge', await digest(verifier));
  target.searchParams.set('code_challenge_method', 'S256');
  target.searchParams.set('prompt', 'select_account');
  const response = new Response(null, { status: 302, headers: { ...headers, location: target.href } });
  // Starting sign-in preserves the existing session until a new account is verified.
  response.headers.append('set-cookie', cookie(STATE_COOKIE, token, STATE_SECONDS));
  response.headers.append('set-cookie', `${STATE_COOKIE}=; Path=/api/codex; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  return response;
}
export async function finishOAuth(request: Request, store: CodexStore | null = codexStore('auth'), fetcher: typeof fetch = fetch, limits: CodexStore | null = codexStore('limits')): Promise<Response> {
  const config = githubAuthConfig();
  if (!config || !store) return new Response(null, { status: 503, headers });
  const url = new URL(request.url);
  if (url.origin !== config.origin) return new Response(null, { status: 403, headers });
  const redirect = (ok: boolean) => {
    const response = new Response(null, { status: 303, headers: { ...headers, location: '/work/codex-usage?github=' + (ok ? 'connected' : 'failed') } });
    response.headers.append('set-cookie', cookie(STATE_COOKIE, '', 0));
    return response;
  };
  try {
    const state = url.searchParams.get('state');
    const code = url.searchParams.get('code');
    const x = await unseal(readCookie(request, STATE_COOKIE), config.signingSecret) as Record<string, unknown> | null;
    if (!x || x.purpose !== 'state' || !state || state.length > 128 || typeof x.state !== 'string' || !timingSafeEqual(x.state, state) ||
        typeof x.exp !== 'number' || !Number.isFinite(x.exp) || x.exp <= Date.now() || x.exp > Date.now() + STATE_SECONDS * 1000 ||
        typeof x.verifier !== 'string' || !/^[A-Za-z0-9._~-]{43,128}$/.test(x.verifier) ||
        url.searchParams.getAll('state').length !== 1 || url.searchParams.getAll('code').length > 1) return redirect(false);
    if (!limits || !(await consumeLimit(limits, clientAddress(request.headers) || 'unknown', 'oauth', 20))) return redirect(false);
    // Atomic claim precedes network calls. Clearing a browser cookie alone cannot stop replay.
    if (!(await claimState(store, state, x.exp))) return redirect(false);
    if (!code || code.length > 512 || url.searchParams.has('error')) return redirect(false);
    const exchange = await fetcher('https://github.com/login/oauth/access_token', {
      method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/json' }, redirect: 'error',
      body: JSON.stringify({ client_id: config.clientId, client_secret: config.clientSecret, code, code_verifier: x.verifier, redirect_uri: config.origin + '/api/codex/github/callback' }), signal: AbortSignal.timeout(8000),
    });
    if (!exchange.ok) return redirect(false);
    const token = await exchange.json() as { access_token?: unknown; token_type?: unknown; scope?: unknown };
    if (typeof token.access_token !== 'string' || token.access_token.length > 512 || token.token_type !== 'bearer' || token.scope !== '') return redirect(false);
    const userResponse = await fetcher('https://api.github.com/user', {
      headers: { authorization: 'Bearer ' + token.access_token, accept: 'application/vnd.github+json', 'user-agent': 'codex-usage-benchmark' }, redirect: 'error', signal: AbortSignal.timeout(8000),
    });
    if (!userResponse.ok) return redirect(false);
    const user = await userResponse.json() as { id?: unknown; login?: unknown };
    if (!validProfile(user.id, user.login)) return redirect(false);
    const previousSession = await identity(request, store);
    const session = { id: user.id, login: user.login, sid: crypto.randomUUID(), csrf: crypto.randomUUID(), exp: Date.now() + SESSION_SECONDS * 1000 };
    if (!writeSucceeded(await store.setJSON('session/' + session.sid, session, { onlyIfNew: true }))) return redirect(false);
    if (previousSession) await store.delete('session/' + previousSession.sid);
    const response = redirect(true);
    clearCookies(response);
    response.headers.append('set-cookie', cookie(AUTH_COOKIE, await seal({ purpose: 'session', sid: session.sid, exp: session.exp }, config.signingSecret), SESSION_SECONDS));
    // Access tokens are never returned to the browser or persisted.
    return response;
  } catch { return redirect(false); }
}
export async function endSession(request: Request, store: CodexStore | null = codexStore('auth')): Promise<Response> {
  try {
    const user = await identity(request, store);
    if (!store || !user) return json(401, { error: 'sign_in_required' });
    if (!validMutation(request, user)) return json(403, { error: 'csrf_failed' });
    await store.delete('session/' + user.sid);
    const response = json(200, { ok: true }); clearCookies(response); return response;
  } catch { return json(503, { error: 'unavailable' }); }
}
