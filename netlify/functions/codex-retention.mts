import type { Config } from '@netlify/functions';
import { codexStore } from '../../src/server/codexStore';
import { expireContributions } from '../../src/server/codexContributions';
export default async function (): Promise<Response> {
  // Scheduled production maintenance only. No report or identity in logs.
  if (process.env.CONTEXT !== 'production') return new Response(null, { status: 204 });
  try {
    const accounts = codexStore('accounts'), auth = codexStore('auth'), limits = codexStore('limits');
    if (!accounts || !auth || !limits) return new Response(null, { status: 503 });
    await expireContributions(accounts);
    for (const store of [auth, limits]) for await (const page of store.list({ paginate: true })) for (const blob of page.blobs) {
      const entry = await store.getWithMetadata(blob.key, { type: 'json' });
      const exp = (entry?.data as { exp?: number } | undefined)?.exp;
      // These entries are immutable and keys are random or tied to an expired hourly window.
      if (typeof exp === 'number' && exp < Date.now()) await store.delete(blob.key);
    }
    return new Response(null, { status: 204 });
  } catch { return new Response(null, { status: 503 }); }
}
export const config: Config = { schedule: '15 * * * *' };
