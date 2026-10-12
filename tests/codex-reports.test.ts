import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateUsageReport, reportFingerprint } from '../src/server/codexReports';

const sample = () => ({
  schemaVersion: 1, collectorVersion: '0.1.0', dataType: 'aggregate_token_usage',
  privacy: 'monthly-model-aggregates',
  summary: { filesInspected: 1, usableSessions: 1, snapshotsFound: 2, skippedFiles: 0 },
  buckets: [{ month: '2026-10', model: 'gpt-6.1-sol', sessions: 1,
    input_tokens: 100, cached_input_tokens: 20, output_tokens: 30,
    reasoning_output_tokens: 10, total_tokens: 130 }],
});
test('accepts v1 aggregate report', () => assert.ok(validateUsageReport(sample())));
test('rejects spoofed contributor identities', () => assert.equal(validateUsageReport({ ...sample(), github: 'Slaymish' }), null));
test('rejects private fields', () => {
  const report = sample();
  assert.equal(validateUsageReport({ ...report, buckets: [{ ...report.buckets[0], projectPath: '/secret' }] }), null);
});
test('rejects duplicate buckets', () => {
  const report = sample();
  assert.equal(validateUsageReport({ ...report, buckets: [report.buckets[0], report.buckets[0]] }), null);
});
test('rejects impossible totals', () => {
  const report = sample();
  report.buckets[0].cached_input_tokens = 101;
  assert.equal(validateUsageReport(report), null);
});
test('stable fingerprint ignores summary metadata', async () => {
  const report = validateUsageReport(sample());
  assert.ok(report);
  const other = validateUsageReport({ ...sample(), summary: { ...sample().summary, snapshotsFound: 9 } });
  assert.ok(other);
  assert.equal(await reportFingerprint(report), await reportFingerprint(other));
});

test('matches the companion Python validator on shared contract fixtures', async () => {
  const { readFile } = await import('node:fs/promises');
  const cases = JSON.parse(await readFile(new URL('./fixtures/report-validation.json', import.meta.url), 'utf8')) as { name: string; valid: boolean; report: unknown }[];
  for (const item of cases) assert.equal(validateUsageReport(item.report) !== null, item.valid, item.name);
});
