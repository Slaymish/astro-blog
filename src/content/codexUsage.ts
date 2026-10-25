/** Required Sanity copy contract, shared by schema, build validation and browser. */
export const CODEX_COPY_KEYS = {
  page: ['title', 'description', 'back', 'intro', 'contributeHeading', 'contributeIntro', 'peopleHeading', 'peopleEmpty', 'source'],
  calculator: ['hoursLabel', 'hoursUnit', 'minimum', 'maximum', 'sessionHint', 'costLabel', 'subscriptions', 'credits', 'disclaimer', 'sample', 'plusLabel', 'pro100Label', 'pro200Label', 'pro500Label'],
  contribution: ['generateHeading', 'generateIntro', 'skillLink', 'checkHeading', 'checkIntro', 'fileLabel', 'sessions', 'buckets', 'input', 'output', 'privacy', 'details', 'shareHeading', 'closed', 'signIn', 'signedIn', 'consent', 'optIn', 'submit', 'replace', 'withdraw', 'withdrawConfirm', 'saveAttribution', 'logout', 'noScript', 'avatarAlt'],
  messages: ['noFile', 'tooLarge', 'invalidReport', 'loaded', 'sending', 'pending', 'accepted', 'withdrawn', 'saved', 'signedOut', 'failed', 'changed', 'signInFailed'],
} as const;
export type CodexUsageCopy = { [Group in keyof typeof CODEX_COPY_KEYS]: { [Key in typeof CODEX_COPY_KEYS[Group][number]]: string } };
export function validateCodexCopy(value: unknown): value is CodexUsageCopy {
  if (!value || typeof value !== 'object') return false;
  const x = value as Record<string, Record<string, unknown>>;
  return Object.entries(CODEX_COPY_KEYS).every(([group, keys]) => x[group] && keys.every(key => typeof x[group][key] === 'string' && (x[group][key] as string).trim().length > 0));
}
