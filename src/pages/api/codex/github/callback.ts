import { AUTH_COOKIE, STATE_COOKIE, SESSION_SECONDS, cookie, githubAuthConfig, readCookie, seal, unseal } from '../../../../server/codexAuth';
export const prerender = false;
export async function GET({ request }: { request: Request }): Promise<Response> {
  const config = githubAuthConfig();
  if (!config) return new Response('GitHub sign-in is not configured.', { status: 503 });
  const url = new URL(request.url);
  if (url.origin !== 'https://hamishburke.dev') return new Response('Unexpected origin.', { status: 400 });
  const redirect = (ok: boolean) => {
    const response = new Response(null, { status: 303, headers: { location: ok ? '/work/codex-usage?github=connected' : '/work/codex-usage?github=failed', 'cache-control': 'no-store' } });
    response.headers.append('set-cookie', cookie(STATE_COOKIE, '', 0));
    return response;
  };
  const state = url.searchParams.get('state');
  const code = url.searchParams.get('code');
  const stored = await unseal(readCookie(request, STATE_COOKIE), config.signingSecret);
  if (!stored || typeof stored !== 'object' || !state || !code || code.length > 512) return redirect(false);
  const check = stored as Record<string, unknown>;
  if (check.state !== state || typeof check.exp !== 'number' || check.exp <= Date.now()) return redirect(false);
  try {
    const exchange = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({ client_id: config.clientId, client_secret: config.clientSecret, code, redirect_uri: url.origin + '/api/codex/github/callback' }),
      signal: AbortSignal.timeout(8000),
    });
    if (!exchange.ok) return redirect(false);
    const token = await exchange.json() as { access_token?: unknown };
    if (typeof token.access_token !== 'string') return redirect(false);
    const userResponse = await fetch('https://api.github.com/user', {
      headers: { authorization: 'Bearer ' + token.access_token, accept: 'application/vnd.github+json', 'user-agent': 'codex-usage-benchmark' },
      signal: AbortSignal.timeout(8000),
    });
    if (!userResponse.ok) return redirect(false);
    const user = await userResponse.json() as { id?: unknown; login?: unknown };
    if (typeof user.id !== 'number' || !Number.isSafeInteger(user.id) || user.id < 1 ||
      typeof user.login !== 'string' || !/^[a-zA-Z0-9-]{1,39}$/.test(user.login)) return redirect(false);
    const response = redirect(true);
    response.headers.append('set-cookie', cookie(AUTH_COOKIE, await seal({ id: user.id, login: user.login, exp: Date.now() + SESSION_SECONDS * 1000 }, config.signingSecret), SESSION_SECONDS));
    return response;
  } catch { return redirect(false); }
}
