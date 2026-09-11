/**
 * Runtime secrets, read from `process.env` in one place.
 *
 * Deliberately not `astro:env/server`: the route tests import these modules
 * under `tsx`, where that virtual module does not resolve. The public Sanity
 * variables still go through `astro:env`, so a missing project id fails the
 * build rather than a request.
 */
export const secrets = {
  insightsToken: () => process.env.INSIGHTS_TOKEN,
  calWebhookSecret: () => process.env.CAL_WEBHOOK_SECRET,
  rateLimitSalt: () => process.env.RATE_LIMIT_SALT ?? '',
};
