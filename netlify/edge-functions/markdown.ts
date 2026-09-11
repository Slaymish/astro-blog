/**
 * Accept-header content negotiation for a site that is entirely prerendered.
 * `scripts/build-markdown.ts` writes a .md twin beside every page at build
 * time; this serves that twin when a request asks for markdown, and returns
 * nothing when it does not, which passes the request through to the HTML.
 *
 * The path config lives in the `config` export below and nowhere else, matching
 * how netlify/functions/session-insights.mts carries its schedule.
 */
import type { Config, Context } from '@netlify/edge-functions';

/** A path that names a file answers as itself; only routes negotiate. */
const HAS_EXTENSION = /\.[a-z0-9]+$/i;

/**
 * The header is advisory and the edge has no tokeniser, so this is an estimate
 * at the usual four characters per token, not a count.
 */
const CHARS_PER_TOKEN = 4;

/** The built file answering a route, mirroring build.format 'file'. */
export function markdownTwin(pathname: string): string {
  const base = pathname === '/' ? '/index' : pathname.replace(/\/$/, '');
  return `${base}.md`;
}

export default async function handler(request: Request, context: Context): Promise<Response | undefined> {
  if (request.method !== 'GET' && request.method !== 'HEAD') return undefined;
  if (!(request.headers.get('accept') ?? '').includes('text/markdown')) return undefined;

  const url = new URL(request.url);
  if (HAS_EXTENSION.test(url.pathname)) return undefined;

  // context.rewrite is deprecated; a rewritten Request through next() is the
  // replacement, and it does not re-enter this function.
  const twin = await context.next(new Request(new URL(markdownTwin(url.pathname), url.origin), request));
  if (!twin.ok) return undefined;

  const markdown = await twin.text();
  return new Response(markdown, {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'x-markdown-tokens': String(Math.ceil(markdown.length / CHARS_PER_TOKEN)),
      'cache-control': 'public, max-age=0, must-revalidate',
      // Only this branch varies by Accept. The HTML branch is a pass-through,
      // so it keeps the headers netlify.toml already sets for it.
      vary: 'Accept',
    },
  });
}

export const config: Config = {
  path: '/*',
  excludedPath: ['/_astro/*', '/api/*'],
};
