import assert from 'node:assert/strict';
import test from 'node:test';
import {
  conversionKey,
  dayFromKey,
  dayStamp,
  isConversionKey,
  isExpiredKey,
  retentionCutoff,
  sessionKey
} from '../src/lib/sessionStore';

test('keys round-trip back to the day they were written', () => {
  const day = '2026-08-18';

  assert.equal(dayFromKey(sessionKey(day, 'abc-123')), day);
  assert.equal(dayFromKey(conversionKey(day, 'abc-123')), day);
});

test('conversion keys are distinguishable from session keys', () => {
  assert.equal(isConversionKey(conversionKey('2026-08-18', 'abc')), true);
  assert.equal(isConversionKey(sessionKey('2026-08-18', 'abc')), false);
});

test('dayFromKey rejects keys that do not carry a valid day', () => {
  assert.equal(dayFromKey('garbage'), null);
  assert.equal(dayFromKey('2026-8-1/abc'), null);
  assert.equal(dayFromKey('latest'), null);
  assert.equal(dayFromKey(''), null);
});

test('isExpiredKey expires only days strictly before the cutoff', () => {
  assert.equal(isExpiredKey('2026-07-01/abc', '2026-08-18'), true);
  assert.equal(isExpiredKey('2026-08-18/abc', '2026-08-18'), false);
  assert.equal(isExpiredKey('2026-09-01/abc', '2026-08-18'), false);
});

test('isExpiredKey never expires a key whose day cannot be parsed', () => {
  // Deleting an unrecognised key would silently lose data on a format change.
  assert.equal(isExpiredKey('latest', '2026-08-18'), false);
  assert.equal(isExpiredKey('some/other/shape', '2026-08-18'), false);
});

test('retentionCutoff walks back the requested number of days', () => {
  const now = new Date('2026-08-18T09:00:00Z');

  assert.equal(retentionCutoff(30, now), '2026-07-19');
  assert.equal(retentionCutoff(0, now), '2026-08-18');
  assert.equal(retentionCutoff(365, now), '2025-08-18');
});

test('dayStamp matches the day component the keys are built from', () => {
  const now = new Date('2026-08-18T23:59:59Z');

  assert.equal(dayStamp(now), '2026-08-18');
  assert.equal(dayFromKey(sessionKey(dayStamp(now), 'abc')), '2026-08-18');
});
