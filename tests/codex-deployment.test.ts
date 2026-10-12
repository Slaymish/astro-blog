import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deploymentFromContext, previewOriginMatches, codexStoreName } from '../src/server/codexDeployment';

test('Netlify runtime metadata works without build-only environment variables', () => {
  const deployment = deploymentFromContext({ deploy: { context: 'deploy-preview', id: 'preview-deploy-123' }, site: { name: 'hamishswords' } }, {});
  assert.equal(previewOriginMatches('https://deploy-preview-45--hamishswords.netlify.app', deployment), true);
  assert.equal(codexStoreName('accounts', deployment), 'codex-accounts-v2-preview-deploy-123');
});
test('runtime context takes precedence over stale or misleading environment values', () => {
  const deployment = deploymentFromContext({ deploy: { context: 'deploy-preview', id: 'real-id' }, site: { name: 'hamishswords' } }, { CONTEXT: 'production', DEPLOY_ID: 'wrong-id', SITE_NAME: 'other-site' });
  assert.equal(codexStoreName('auth', deployment), 'codex-auth-v2-real-id');
  assert.equal(previewOriginMatches('https://deploy-preview-45--other-site.netlify.app', deployment), false);
});
test('production, missing metadata and unrelated preview origins fail safely', () => {
  assert.equal(codexStoreName('accounts', deploymentFromContext(null, {})), null);
  assert.equal(codexStoreName('auth', deploymentFromContext({ deploy: { context: 'deploy-preview' } }, {})), null);
  assert.equal(codexStoreName('accounts', deploymentFromContext({ deploy: { context: 'production', id: 'production-id' } }, {})), 'codex-accounts-v2');
  const production = deploymentFromContext({ deploy: { context: 'production' }, site: { name: 'hamishswords' } }, {});
  assert.equal(previewOriginMatches('https://deploy-preview-45--hamishswords.netlify.app', production), false);
  const preview = deploymentFromContext({ deploy: { context: 'deploy-preview', id: 'id' }, site: { name: 'hamishswords' } }, {});
  for (const origin of ['https://evil.example', 'https://deploy-preview-45--hamishswords.netlify.app.evil.example', 'http://deploy-preview-45--hamishswords.netlify.app', 'https://deploy-preview-45--hamishswords.netlify.app/path', 'https://hamishburke.dev']) assert.equal(previewOriginMatches(origin, preview), false);
});
