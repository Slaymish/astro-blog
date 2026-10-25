import { codexStore } from '../src/server/codexStore';
import { acceptContribution } from '../src/server/codexContributions';
// Operator supplies the privately reviewed account key, fingerprint and ETag. No bulk approval.
const [key, fingerprint, revision, ack] = process.argv.slice(2);
if (!key?.startsWith('account/') || !fingerprint || !revision || ack !== '--accept-reviewed-report') {
  throw new Error('Usage: tsx scripts/review-codex-report.ts account/key fingerprint revision --accept-reviewed-report');
}
const store = codexStore('accounts');
if (!store || !(await acceptContribution(store, key, fingerprint, revision))) throw new Error('Report changed, expired, withdrawn or storage unavailable. No approval confirmed.');
console.log('Reviewed report accepted. Attribution still requires consent and the privacy threshold.');
