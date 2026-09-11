import { timingSafeEqual } from './timingSafe';

export type StatsAuth =
  | { kind: 'ok' }
  | { kind: 'redirect'; setCookie: string }
  | { kind: 'unauthorised' }
  | { kind: 'unconfigured' };

export const STATS_COOKIE = 'stats_auth';
/** Thirty days. */
const COOKIE_MAX_AGE = 2_592_000;

function cookieValue(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return null;
}

/**
 * A one-time `?token=` sets an HttpOnly cookie and redirects, so the secret
 * appears in exactly one URL rather than in every request, the browser history
 * and every log line after it.
 */
export function authoriseStats(request: Request, url: URL, secret: string | undefined): StatsAuth {
  if (!secret) return { kind: 'unconfigured' };

  const queryToken = url.searchParams.get('token');
  if (queryToken !== null) {
    if (!timingSafeEqual(queryToken, secret)) return { kind: 'unauthorised' };
    return {
      kind: 'redirect',
      setCookie:
        `${STATS_COOKIE}=${encodeURIComponent(secret)}; Path=/stats; HttpOnly; Secure; ` +
        `SameSite=Strict; Max-Age=${COOKIE_MAX_AGE}`,
    };
  }

  const cookie = cookieValue(request.headers.get('cookie'), STATS_COOKIE);
  if (cookie && timingSafeEqual(decodeURIComponent(cookie), secret)) return { kind: 'ok' };

  const authorization = request.headers.get('authorization') ?? '';
  const bearer = authorization.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : null;
  if (bearer && timingSafeEqual(bearer, secret)) return { kind: 'ok' };

  return { kind: 'unauthorised' };
}
