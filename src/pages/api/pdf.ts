const ALLOWED_HOSTS = new Set(['cdn.sanity.io', 'assets.sanity.io']);
const IMPORT_META_ENV = (import.meta as { env?: Record<string, string> }).env || {};
const ALLOWED_PROJECT_ID =
  IMPORT_META_ENV.PUBLIC_SANITY_PROJECT_ID ||
  IMPORT_META_ENV.SANITY_PROJECT_ID ||
  process.env.SANITY_PROJECT_ID ||
  'qnuj1c4o';
const ALLOWED_DATASET =
  IMPORT_META_ENV.PUBLIC_SANITY_DATASET ||
  IMPORT_META_ENV.SANITY_DATASET ||
  process.env.SANITY_DATASET ||
  'production';
const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20 MiB guardrail

function isAllowedSanityFilePath(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length < 4) return false;

  const [assetType, projectId, dataset] = segments;
  return assetType === 'files' && projectId === ALLOWED_PROJECT_ID && dataset === ALLOWED_DATASET;
}

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

  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    return new Response('Host not allowed', { status: 403 });
  }

  if (!isAllowedSanityFilePath(parsed.pathname)) {
    return new Response('Project or dataset not allowed', { status: 403 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let upstream: Response;
  try {
    upstream = await fetch(parsed.toString(), {
      redirect: 'manual',
      signal: controller.signal
    });
  } catch {
    return new Response('Failed to fetch upstream PDF', { status: 502 });
  } finally {
    clearTimeout(timeout);
  }

  // Prevent redirecting to non-allowlisted hosts.
  if (upstream.status >= 300 && upstream.status < 400) {
    return new Response('Upstream redirects are not allowed', { status: 502 });
  }

  if (!upstream.ok) {
    return new Response(`Upstream error: ${upstream.status}`, { status: upstream.status });
  }

  const contentType = upstream.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/pdf')) {
    return new Response('Upstream resource is not a PDF', { status: 415 });
  }

  const contentLengthHeader = upstream.headers.get('content-length');
  const contentLength = Number(contentLengthHeader);
  if (!contentLengthHeader || !Number.isFinite(contentLength) || contentLength <= 0) {
    return new Response('Missing or invalid upstream content length', { status: 502 });
  }
  if (contentLength > MAX_PDF_BYTES) {
    return new Response('Upstream PDF exceeds maximum allowed size', { status: 413 });
  }

  const headers = new Headers();
  headers.set('content-type', 'application/pdf');
  headers.set('x-content-type-options', 'nosniff');
  headers.set('content-length', String(contentLength));

  const rawFilename = parsed.pathname.split('/').pop() || 'document.pdf';
  const filename = rawFilename.replace(/[^\w.-]/g, '_');
  headers.set('content-disposition', `inline; filename="${filename}"`);

  const cacheControl = upstream.headers.get('cache-control') ?? 'public, max-age=3600';
  headers.set('cache-control', cacheControl);

  return new Response(upstream.body, {
    status: upstream.status,
    headers
  });
}
