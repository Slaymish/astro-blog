import { readFile, writeFile, mkdir, realpath, rename } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { fingerprint, planMigration, planRollback, patches, equal, valueAt, validateManifest,
  type Manifest, type Document, type Backup, type PlannedDocument } from './copy-migration/core';

const repository = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flags = new Set(['--apply', '--plan-sha256', '--out', '--rollback', '--help']);
const options = new Map<string, string>();
let apply = false;
for (let index = 0; index < args.length; index++) {
  const flag = args[index];
  if (!flags.has(flag)) throw new Error(`Unknown argument: ${flag}`);
  if (flag === '--help') {
    console.log('Dry run: pnpm exec tsx --env-file=/absolute/private.env scripts/migrate-approved-copy.ts --out /outside/git/report-dir');
    console.log('Apply requires --apply --plan-sha256 HASH and SANITY_WRITE_ACK=1. Rollback: --rollback /outside/git/backup.json (dry run unless --apply).');
    process.exit(0);
  }
  if (flag === '--apply') { apply = true; continue; }
  const value = args[++index];
  if (!value || value.startsWith('--') || options.has(flag)) throw new Error(`Expected one value for ${flag}`);
  options.set(flag, value);
}

async function privateDirectory(path: string) {
  const absolute = resolve(path);
  if (absolute === repository || absolute.startsWith(repository + '/')) throw new Error('Reports/backups must be outside the repository');
  await mkdir(absolute, { recursive: true, mode: 0o700 });
  const actual = await realpath(absolute);
  let trackedRoot: string | undefined;
  try { trackedRoot = execFileSync('git', ['-C', actual, 'rev-parse', '--show-toplevel'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch {}
  if (trackedRoot) throw new Error('Reports/backups must be outside every Git checkout');
  return actual;
}

async function save(path: string, data: unknown, exclusive = false) {
  const bytes = JSON.stringify(data, null, 2) + '\n';
  if (exclusive) await writeFile(path, bytes, { mode: 0o600, flag: 'wx' });
  else {
    const temporary = `${path}.${randomUUID()}.tmp`;
    await writeFile(temporary, bytes, { mode: 0o600, flag: 'wx' });
    await rename(temporary, path);
  }
}

async function main() {
  const bytes = await readFile(join(repository, 'scripts/copy-migration/approved.json'), 'utf8');
  const manifest = JSON.parse(bytes) as Manifest;
  validateManifest(manifest);
  const manifestHash = fingerprint(bytes);
  const projectId = process.env.SANITY_PROJECT_ID;
  const dataset = process.env.SANITY_DATASET || 'production';
  const token = process.env.SANITY_API_TOKEN;
  if (projectId !== manifest.projectId || dataset !== manifest.dataset) throw new Error('Environment project/dataset does not match the frozen approved manifest');
  if (apply && (process.env.SANITY_WRITE_ACK !== '1' || options.get('--plan-sha256') !== manifestHash)) {
    throw new Error('Apply requires SANITY_WRITE_ACK=1 and --plan-sha256 matching the reviewed manifest');
  }
  if (!token) throw new Error('SANITY_API_TOKEN required for authenticated raw drafts/release safety read, even in dry run');
  const output = await privateDirectory(options.get('--out') || join(process.env.HOME || '/tmp', '.codex', 'copy-migration-reports'));
  const sourceRecords = [];
  if (manifest.sourceChecks?.length) {
    for (const source of manifest.sourceChecks) {
      const path = resolve(repository, source.path);
      if (!path.startsWith(repository + '/')) throw new Error('Source target escapes repository');
      const current = fingerprint(await readFile(path, 'utf8'));
      sourceRecords.push({ ...source, currentSha256: current, status: current === source.sha256 ? 'verified' : 'conflict' });
    }
  } else {
    sourceRecords.push({ status: 'not-frozen', note: 'This manifest contains source dispositions but no frozen source fingerprints. Review source changes before any apply.' });
  }
  const sourceConflicts = sourceRecords.filter(source => source.status === 'conflict').length;
  const api = `https://${projectId}.api.sanity.io/v2024-01-01`;
  async function request(path: string, init: RequestInit = {}) {
    const response = await fetch(api + path, { ...init, cache: 'no-store', signal: AbortSignal.timeout(60000),
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
    if (!response.ok) throw new Error(`Sanity request failed (HTTP ${response.status}); no automatic retry`);
    return response.json();
  }
  const ids = manifest.documents.map(document => document.id);
  async function readDocuments(): Promise<Document[]> {
    const query = '*[_id in $ids || _id in path("drafts.**") || _id in path("versions.**")]';
    const response = await request(`/data/query/${dataset}?perspective=raw&query=${encodeURIComponent(query)}&$ids=${encodeURIComponent(JSON.stringify(ids))}`);
    if (!Array.isArray(response.result)) throw new Error('Raw query did not return documents');
    return response.result;
  }
  const documents = await readDocuments();
  const backupPath = options.get('--rollback');
  let changes: PlannedDocument[];
  let records: unknown;
  let conflictCount: number;
  if (backupPath) {
    const backup = JSON.parse(await readFile(backupPath, 'utf8')) as Backup;
    if (backup.version !== 1 || backup.projectId !== projectId || backup.dataset !== dataset || backup.manifestHash !== manifestHash) {
      throw new Error('Rollback receipt belongs to a different manifest/project/dataset');
    }
    const approved = new Map(manifest.documents.map(document => [document.id, document]));
    for (const change of backup.changes) {
      const target = approved.get(change.id);
      if (!target || change.fields.some(field => !target.fields.some(candidate => equal(candidate, field)))) {
        throw new Error('Backup contains a mutation outside the frozen approved scope');
      }
    }
    const plan = planRollback(backup, documents, true);
    changes = plan.changes;
    records = plan.conflicts;
    conflictCount = plan.conflicts.length + sourceConflicts;
  } else {
    const plan = planMigration(manifest, documents, true);
    changes = plan.changes;
    records = plan.records;
    conflictCount = plan.records.filter(record => record.status === 'conflict').length + sourceConflicts;
  }
  const live = [];
  if (!backupPath) {
    for (const route of [...new Set(manifest.findings.map(finding => finding.route))]) {
      try {
        const response = await fetch(`https://hamishburke.dev${route}`, { cache: 'no-store', signal: AbortSignal.timeout(20000) });
        const html = await response.text();
        live.push({ route, status: response.status, sha256: fingerprint(html),
          approvedFindings: manifest.findings.filter(finding => finding.route === route).map(finding => finding.id),
          note: 'Deployed HTML snapshot fingerprint, not a deployment or proof that proposed CMS values are visible.' });
      } catch { live.push({ route, status: 'unavailable' }); }
    }
  }
  const coverage = Object.fromEntries(['CMS', 'source', 'keep', 'factual-dependency'].map(disposition =>
    [disposition, manifest.findings.filter(finding => finding.disposition === disposition).length]));
  const report = { generatedAt: new Date().toISOString(), mode: backupPath ? 'rollback' : 'migration', apply,
    projectId, dataset, manifestHash, authenticatedRawRead: true,
    draftCount: documents.filter(document => document._id.startsWith('drafts.')).length,
    releaseCount: documents.filter(document => document._id.startsWith('versions.')).length,
    coverage, findingCount: manifest.findings.length, readyDocuments: changes.length, conflictCount, records, sourceRecords,
    findings: manifest.findings, live, deployment: 'Not performed. CMS apply alone does not update prerendered pages.' };
  const reportPath = join(output, `${backupPath ? 'rollback' : 'dry-run'}-${Date.now()}.json`);
  await save(reportPath, report, true);
  console.log(JSON.stringify({ manifestHash, coverage, readyDocuments: changes.length, conflictCount, reportPath }, null, 2));
  if (conflictCount || (apply && !manifest.sourceChecks?.length)) { process.exitCode = 2; return; }
  if (!apply || !changes.length) return;
  const fresh = await readDocuments();
  if (fresh.some(document => document._id.startsWith('drafts.') && changes.some(change => document._id === `drafts.${change.id}`)) ||
      fresh.some(document => document._id.startsWith('versions.') && changes.some(change => document._id.endsWith(`.${change.id}`))) ||
      changes.some(change => {
        const document = fresh.find(document => document._id === change.id);
        return !document || document._rev !== change.revision || change.fields.some(field => !equal(valueAt(document, field.field), field.before));
      })) throw new Error('Content/drafts changed after planning. Rerun dry run; nothing written.');
  const transactionId = randomUUID();
  const receipt: Backup = { version: 1, projectId, dataset, manifestHash, transactionId, state: 'prepared', changes };
  const receiptPath = join(output, `backup-${transactionId}.json`);
  await save(receiptPath, receipt, true);
  console.log(`Prepared backup: ${receiptPath}`);
  const response = await request(`/data/mutate/${dataset}?returnDocuments=true&visibility=sync&transactionId=${transactionId}`, {
    method: 'POST', body: JSON.stringify({ mutations: patches(changes) }) });
  const returned = response.results?.map((result: any) => result.document) as Document[] | undefined;
  if (!returned || changes.some(change => !returned.some(document => document?._id === change.id && document._rev))) {
    throw new Error(`Mutation receipt incomplete. Transaction may have committed. Preserve prepared backup ${receiptPath}; inspect Sanity transaction ${transactionId} before retrying. Never blindly rollback.`);
  }
  receipt.state = 'applied';
  receipt.postRevisions = Object.fromEntries(returned.map(document => [document._id, document._rev]));
  await save(receiptPath, receipt);
  console.log(`Applied ${changes.length} documents in one revision-guarded transaction. Receipt: ${receiptPath}`);
}

main().catch((error: unknown) => {
  console.error(`Migration stopped: ${error instanceof Error ? error.message : 'unknown local failure'}`);
  process.exitCode = 1;
});
