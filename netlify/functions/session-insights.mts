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

const UMAMI_API = 'https://api.umami.is/v1';
const WEBSITE_ID = '3b77a67f-19f6-4f3c-a7ab-8af0d58bfbc6';
const LOOKBACK_DAYS = 7;
const MAX_SESSIONS = 200;

interface UmamiSession {
  id: string;
}

interface UmamiActivity {
  createdAt: string;
  eventName?: string | null;
  urlPath?: string | null;
}

async function umami<T>(path: string, apiKey: string): Promise<T> {
  const response = await fetch(`${UMAMI_API}${path}`, {
    headers: { 'x-umami-api-key': apiKey, accept: 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`Umami ${path} responded ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/** One line per session: the ordered path plus any named events. */
function toSequence(activity: UmamiActivity[]): string {
  return activity
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((entry) => entry.eventName ?? entry.urlPath ?? '?')
    .join(' → ');
}

const PROMPT = `You are analysing anonymised visitor sessions for a software engineer's
portfolio site. The single conversion that matters is booking a call.

Each line below is one session: an ordered sequence of page paths and named events.
"book-call" means the visitor clicked through to the booking page.
"booking-confirmed" means a booking actually completed.

Identify:
1. The recurring session archetypes. Name each one for what the visitor appears
   to be doing, and say roughly how common it is.
2. Specifically: where do sessions that reach book-call diverge from those that
   do not? Name the pages or sequences that distinguish them.
3. Content gaps — what someone in a high-intent archetype seems to look for and
   not find.

Be concrete and quantitative where the data supports it. Where a pattern is too
thin to trust at this sample size, say so rather than inventing significance.
Return concise markdown.`;

export default async function handler(): Promise<Response> {
  const umamiKey = process.env.UMAMI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!umamiKey || !anthropicKey) {
    return new Response('UMAMI_API_KEY and ANTHROPIC_API_KEY must be set', { status: 503 });
  }

  const endAt = Date.now();
  const startAt = endAt - LOOKBACK_DAYS * 24 * 60 * 60 * 1000;

  const { data: sessions } = await umami<{ data: UmamiSession[] }>(
    `/websites/${WEBSITE_ID}/sessions?startAt=${startAt}&endAt=${endAt}&pageSize=${MAX_SESSIONS}`,
    umamiKey
  );

  if (!sessions?.length) {
    return new Response('No sessions in window', { status: 200 });
  }

  const sequences: string[] = [];
  for (const session of sessions) {
    try {
      const activity = await umami<UmamiActivity[]>(
        `/websites/${WEBSITE_ID}/sessions/${session.id}/activity?startAt=${startAt}&endAt=${endAt}`,
        umamiKey
      );
      const sequence = toSequence(activity ?? []);
      if (sequence) sequences.push(sequence);
    } catch {
      // One unreadable session should not abandon the whole report.
    }
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
        content: `${PROMPT}\n\nSessions (${sequences.length} over ${LOOKBACK_DAYS} days):\n\n${sequences.join('\n')}`
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

  const store = getStore('session-insights');
  const generatedAt = new Date().toISOString();
  await store.set(
    'latest',
    JSON.stringify({ generatedAt, sessionCount: sequences.length, report })
  );

  return new Response(`Analysed ${sequences.length} sessions`, { status: 200 });
}

export const config: Config = {
  schedule: '0 15 * * *'
};
