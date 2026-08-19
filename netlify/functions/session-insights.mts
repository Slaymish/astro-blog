/**
 * Nightly session-archetype synthesis.
 *
 * Statistical tests need volume this site does not have. Qualitative synthesis
 * works at N=50: read the anonymised event sequences /api/collect wrote to
 * Netlify Blobs, join them against confirmed bookings, and ask Claude what
 * distinguishes sessions that reached a booking from those that did not. The
 * report is written back to Blobs and read via /api/insights.
 *
 * The schedule lives in the `config` export at the foot of this file, and
 * nowhere else. netlify.toml used to carry a second copy, which is a drift risk
 * for no benefit: the export is type-checked and sits beside the code it times.
 */

import type { Config } from '@netlify/functions';
import Anthropic from '@anthropic-ai/sdk';
import { getStore, type Store } from '@netlify/blobs';
import { RATE_LIMIT_STORE, isExpiredCounter, windowId } from '../../src/lib/rateLimit';
import {
  INSIGHTS_STORE,
  LATEST_REPORT_KEY,
  SESSION_STORE,
  conversionPrefix,
  isConversionKey,
  isExpiredKey,
  retentionCutoff,
  sessionPrefix
} from '../../src/lib/sessionStore';

const LOOKBACK_DAYS = 7;
const MAX_SESSIONS = 200;

/**
 * Ceiling on conversion blobs read per run. Bookings are rare enough that this
 * should never bind, but the loop below does a serial `get` per blob across the
 * whole lookback, so an unexpected flood would otherwise stall the function.
 */
const MAX_CONVERSIONS = 200;

/**
 * How long collected sessions are kept. Well past the analysis window, so a
 * lookback change does not silently start reading pruned days.
 */
const SESSION_RETENTION_DAYS = 30;

/**
 * Confirmed bookings are kept far longer. They are a handful of tiny records a
 * year and the only ground truth the analysis has, so the storage saved by
 * expiring them on the session schedule would not be worth losing them.
 */
const CONVERSION_RETENTION_DAYS = 365;

/** Rate-limit counters are only meaningful inside their own hour. */
const COUNTER_RETENTION_HOURS = 48;

interface StoredSession {
  day: string;
  visitor?: string | null;
  events: Array<{ t: number; p: string; n?: string }>;
}

interface StoredConversion {
  visitor?: string | null;
}

/**
 * Deletes blobs past their retention window.
 *
 * Nothing else ever removes them: the collector and the webhook only write.
 * Left unpruned the store grows without bound, and storage is paid for data no
 * report has read in weeks.
 */
async function prune(store: Store, isExpired: (key: string) => boolean): Promise<number> {
  let deleted = 0;

  for await (const page of store.list({ paginate: true })) {
    for (const blob of page.blobs) {
      if (!isExpired(blob.key)) continue;
      try {
        await store.delete(blob.key);
        deleted += 1;
      } catch {
        // A key that fails to delete is simply retried tomorrow.
      }
    }
  }

  return deleted;
}

/** The last N days as YYYY-MM-DD, matching the collector's blob key prefix. */
function recentDays(count: number): string[] {
  const days: string[] = [];
  for (let i = 0; i < count; i += 1) {
    days.push(new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10));
  }
  return days;
}

/** One line per session: ordered steps, with dwell time where it is meaningful. */
function toSequence(session: StoredSession): string {
  return session.events
    .slice()
    .sort((a, b) => a.t - b.t)
    .map((event, index, all) => {
      const label = event.n ? `${event.p} [${event.n}]` : event.p;
      const next = all[index + 1];
      const dwell = next ? Math.round((next.t - event.t) / 1000) : null;
      return dwell !== null && dwell > 0 ? `${label} (${dwell}s)` : label;
    })
    .join(' → ');
}

const PROMPT = `You are analysing anonymised visitor sessions for a software engineer's
portfolio site. The single conversion that matters is booking a call.

Each line below is one session: an ordered sequence of page paths, with dwell
time in seconds between steps, and named events in square brackets.
"[book-call]" means the visitor clicked through to the booking page.
A line prefixed "[BOOKED]" is a session where a booking was actually confirmed —
this is the outcome that matters, and it is rarer than a book-call click.

Identify:
1. The recurring session archetypes. Name each one for what the visitor appears
   to be doing, and say roughly how common it is.
2. Specifically: where do [BOOKED] sessions diverge from sessions that clicked
   [book-call] but did not book, and from sessions that did neither? Name the
   pages, dwell patterns or sequences that distinguish them.
3. Content gaps — what someone in a high-intent archetype seems to look for and
   not find.

Be concrete and quantitative where the data supports it. Where a pattern is too
thin to trust at this sample size, say so rather than inventing significance.
Return concise markdown.`;

export default async function handler(): Promise<Response> {
  const store = getStore(SESSION_STORE);

  // Runs before the report so that a missing API key, a thin night or a model
  // refusal cannot leave retention permanently unenforced.
  try {
    const sessionCutoff = retentionCutoff(SESSION_RETENTION_DAYS);
    const conversionCutoff = retentionCutoff(CONVERSION_RETENTION_DAYS);
    const sessions = await prune(store, (key) =>
      isExpiredKey(key, isConversionKey(key) ? conversionCutoff : sessionCutoff)
    );
    const counterCutoff = windowId(new Date(Date.now() - COUNTER_RETENTION_HOURS * 3_600_000));
    const counters = await prune(getStore(RATE_LIMIT_STORE), (key) => isExpiredCounter(key, counterCutoff));
    console.log(`[session-insights] pruned ${sessions} session blobs and ${counters} rate-limit counters`);
  } catch (error) {
    console.error('[session-insights] prune failed:', error);
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return new Response('ANTHROPIC_API_KEY must be set', { status: 503 });
  }

  const days = recentDays(LOOKBACK_DAYS);

  // Which visitors actually completed a booking. Without this join the analysis
  // could only see booking-link clicks, not bookings.
  const convertedVisitors = new Set<string>();
  let conversionsRead = 0;

  for (const day of days) {
    if (conversionsRead >= MAX_CONVERSIONS) break;

    const { blobs } = await store.list({ prefix: conversionPrefix(day) });
    for (const blob of blobs) {
      if (conversionsRead >= MAX_CONVERSIONS) break;
      conversionsRead += 1;
      try {
        const conversion = (await store.get(blob.key, { type: 'json' })) as StoredConversion | null;
        if (conversion?.visitor) convertedVisitors.add(conversion.visitor);
      } catch {
        // Ignore an unreadable conversion record rather than losing the report.
      }
    }
  }

  const sequences: string[] = [];
  let convertedSessions = 0;

  for (const day of days) {
    if (sequences.length >= MAX_SESSIONS) break;

    const { blobs } = await store.list({ prefix: sessionPrefix(day) });
    for (const blob of blobs) {
      if (sequences.length >= MAX_SESSIONS) break;
      try {
        const session = (await store.get(blob.key, { type: 'json' })) as StoredSession | null;
        if (!session?.events?.length) continue;
        const sequence = toSequence(session);
        if (!sequence) continue;

        const converted = Boolean(session.visitor && convertedVisitors.has(session.visitor));
        if (converted) convertedSessions += 1;
        sequences.push(converted ? `[BOOKED] ${sequence}` : sequence);
      } catch {
        // One unreadable session should not abandon the whole report.
      }
    }
  }

  if (sequences.length === 0) {
    return new Response('No sessions in window', { status: 200 });
  }

  const anthropic = new Anthropic({ apiKey: anthropicKey });

  const message = await anthropic.beta.messages.create({
    model: 'claude-opus-5',
    max_tokens: 4000,
    thinking: { type: 'adaptive' },
    // Opus 5's safety classifiers can decline a request; fall back rather than
    // losing the night's report. The array form pairs with the -06-01 header.
    betas: ['server-side-fallback-2026-06-01'],
    fallbacks: [{ model: 'claude-opus-4-8' }],
    messages: [
      {
        role: 'user',
        content:
          `${PROMPT}\n\nSessions (${sequences.length} over ${LOOKBACK_DAYS} days, ` +
          `${convertedSessions} of them confirmed bookings):\n\n${sequences.join('\n')}`
      }
    ]
  });

  if (message.stop_reason === 'refusal') {
    return new Response('Model declined the request', { status: 502 });
  }

  const report = message.content
    .filter((block): block is Extract<typeof block, { type: 'text' }> => block.type === 'text')
    .map((block) => block.text)
    .join('\n');

  const reportStore = getStore(INSIGHTS_STORE);
  const generatedAt = new Date().toISOString();
  await reportStore.set(
    LATEST_REPORT_KEY,
    JSON.stringify({ generatedAt, sessionCount: sequences.length, report })
  );

  return new Response(`Analysed ${sequences.length} sessions`, { status: 200 });
}

export const config: Config = {
  schedule: '0 15 * * *'
};
