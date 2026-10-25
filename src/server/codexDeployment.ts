import { getContext } from '@netlify/functions';

interface RuntimeMetadata { deploy?: { context?: string; id?: string }; site?: { name?: string } }
/** CONTEXT / DEPLOY_ID / DEPLOY_PRIME_URL are build variables, not function runtime variables. */
export function deploymentFromContext(context: RuntimeMetadata | null, env: NodeJS.ProcessEnv = process.env) {
  const mode = context?.deploy?.context ?? env.CONTEXT ?? 'local';
  const id = context?.deploy?.id ?? env.DEPLOY_ID;
  const siteName = context?.site?.name ?? env.SITE_NAME;
  return { mode, id, siteName };
}
export function codexDeployment() {
  try { return deploymentFromContext(getContext()); }
  catch { return deploymentFromContext(null); }
}
export function previewOriginMatches(origin: string, deployment = codexDeployment()): boolean {
  if (deployment.mode !== 'deploy-preview' || !deployment.siteName || !/^[a-z0-9-]+$/.test(deployment.siteName)) return false;
  try {
    const url = new URL(origin);
    return url.origin === origin && url.protocol === 'https:' &&
      new RegExp(`^deploy-preview-[1-9][0-9]*--${deployment.siteName}\\.netlify\\.app$`).test(url.hostname);
  } catch { return false; }
}
/** Unknown/local deployments must never silently use a production store. */
export function codexStoreName(name: string, deployment = codexDeployment()): string | null {
  if (deployment.mode === 'production') return `codex-${name}-v2`;
  if (!['deploy-preview', 'branch-deploy', 'dev'].includes(deployment.mode) || !deployment.id || !/^[a-z0-9-]{1,100}$/.test(deployment.id)) return null;
  return `codex-${name}-v2-${deployment.id}`;
}
