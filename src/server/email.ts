import { CONTACT_EMAIL } from '../site/config';
import { secrets } from './secrets';

/** Plain-text notifications only; visitor input never becomes HTML or a header. */
export async function sendNotification(subject: string, text: string, replyTo?: string): Promise<void> {
  const apiKey = secrets.resendApiKey();
  const from = secrets.notificationFrom();
  if (!apiKey || !from) throw new Error('Email notifications are not configured');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from, to: [CONTACT_EMAIL], subject, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Email notification failed (${response.status})`);
}
