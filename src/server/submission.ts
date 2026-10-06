/** Bound both native form and enhanced JSON submissions before parsing them. */
export async function submissionBody(request: Request): Promise<Record<string, unknown> | Response> {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return submissionJson(403, { error: 'wrong_origin' });

  const reader = request.body?.getReader();
  if (!reader) return submissionJson(400, { error: 'bad_body' });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2048) {
        await reader.cancel();
        return submissionJson(413, { error: 'too_large' });
      }
      chunks.push(value);
    }
  } catch {
    return submissionJson(400, { error: 'bad_body' });
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const raw = new TextDecoder().decode(bytes);
  if (isNativeForm(request)) return Object.fromEntries(new URLSearchParams(raw));
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('Invalid payload');
    return value as Record<string, unknown>;
  } catch {
    return submissionJson(400, { error: 'bad_json' });
  }
}

export function isNativeForm(request: Request): boolean {
  return (request.headers.get('content-type') ?? '').includes('application/x-www-form-urlencoded');
}

export function submissionJson(status: number, body: Record<string, unknown>, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

export function submissionRedirect(path: string, state: string): Response {
  return new Response(null, {
    status: 303,
    headers: { location: `${path}?state=${state}`, 'cache-control': 'no-store' },
  });
}
