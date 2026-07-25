/**
 * Nightly session-archetype synthesis.
 *
 * Statistical tests need volume this site does not have. Qualitative synthesis
 * works at N=50: reconstruct anonymised event sequences from Umami, and ask
 * Claude what distinguishes sessions that reached a booking from those that did
 * not. The report is written to Netlify Blobs and read via /api/insights.
 *
 * Schedule is declared in netlify.toml.
 */

import type { Config } from '@netlify/functions';
import Anthropic from '@anthropic-ai/sdk';
import { getStore } from '@netlify/blobs';

const LOOKBACK_DAYS = 7;
const MAX_SESSIONS = 200;

interface StoredSession {
  day: string;
  visitor?: string | null;
  events: Array<{ t: number; p: string; n?: string }>;
}

interface StoredConversion {
  visitor?: string | null;
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
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return new Response('ANTHROPIC_API_KEY must be set', { status: 503 });
  }

  const store = getStore('sessions');
  const days = recentDays(LOOKBACK_DAYS);

  // Which visitors actually completed a booking. Without this join the analysis
  // could only see booking-link clicks, not bookings.
  const convertedVisitors = new Set<string>();
  for (const day of days) {
    const { blobs } = await store.list({ prefix: `conversions/${day}/` });
    for (const blob of blobs) {
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

    const { blobs } = await store.list({ prefix: `${day}/` });
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

  const reportStore = getStore('session-insights');
  const generatedAt = new Date().toISOString();
  await reportStore.set(
    'latest',
    JSON.stringify({ generatedAt, sessionCount: sequences.length, report })
  );

  return new Response(`Analysed ${sequences.length} sessions`, { status: 200 });
}

export const config: Config = {
  schedule: '0 15 * * *'
};
