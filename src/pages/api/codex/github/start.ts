import { AUTH_COOKIE, STATE_COOKIE, STATE_SECONDS, cookie, githubAuthConfig, seal } from '../../../../server/codexAuth';
export const prerender = false;
export async function GET({ request }: { request: Request }): Promise<Response> {
  const config = githubAuthConfig();
  if (!config) return new Response('GitHub sign-in is not configured.', { status: 503 });
  const origin = new URL(request.url).origin;
  if (origin !== 'https://hamishburke.dev') return new Response('Unexpected origin.', { status: 400 });
  const state = crypto.randomUUID();
  const token = await seal({ state, exp: Date.now() + STATE_SECONDS * 1000 }, config.signingSecret);
  const target = new URL('https://github.com/login/oauth/authorize');
  target.searchParams.set('client_id', config.clientId);
  target.searchParams.set('redirect_uri', origin + '/api/codex/github/callback');
  target.searchParams.set('state', state);
  // Public profile only: no repository, email or organisation permissions.
  const response = new Response(null, { status: 302, headers: { location: target.href, 'cache-control': 'no-store' } });
  response.headers.append('set-cookie', cookie(STATE_COOKIE, token, STATE_SECONDS));
  response.headers.append('set-cookie', cookie(AUTH_COOKIE, '', 0));
  return response;
}
