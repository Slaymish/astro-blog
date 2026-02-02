export async function GET({ request }: { request: Request }) {
  const requestUrl = new URL(request.url);
  const target = requestUrl.searchParams.get('url');

  if (!target) {
    return new Response('Missing url parameter', { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return new Response('Invalid url parameter', { status: 400 });
  }

  if (parsed.protocol !== 'https:') {
    return new Response('Only https URLs are allowed', { status: 400 });
  }

  const allowedHosts = new Set(['cdn.sanity.io', 'assets.sanity.io']);
  if (!allowedHosts.has(parsed.hostname)) {
    return new Response('Host not allowed', { status: 403 });
  }

  const upstream = await fetch(parsed.toString());

  if (!upstream.ok) {
    return new Response(`Upstream error: ${upstream.status}`, { status: upstream.status });
  }

  const headers = new Headers();
  const contentType = upstream.headers.get('content-type') ?? 'application/pdf';
  headers.set('content-type', contentType);

  const filename = parsed.pathname.split('/').pop() || 'document.pdf';
  headers.set('content-disposition', `inline; filename="${filename}"`);

  const cacheControl = upstream.headers.get('cache-control') ?? 'public, max-age=3600';
  headers.set('cache-control', cacheControl);

  return new Response(upstream.body, {
    status: upstream.status,
    headers
  });
}
