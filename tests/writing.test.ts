import assert from 'node:assert/strict';
import test from 'node:test';
import { formatFullDate, formatMonthYear, tagSlug } from '../src/content/writing';

test('tagSlug lowercases, collapses punctuation and trims the hyphens', () => {
  assert.equal(tagSlug('AI'), 'ai');
  assert.equal(tagSlug('data-engineering'), 'data-engineering');
  assert.equal(tagSlug('BigData'), 'bigdata');
  assert.equal(tagSlug('Self Hosted'), 'self-hosted');
  assert.equal(tagSlug('C++ & Rust'), 'c-rust');
  assert.equal(tagSlug('  spaced  '), 'spaced');
});

test('tagSlug never returns an empty segment', () => {
  assert.equal(tagSlug('!!!'), 'tag');
  assert.equal(tagSlug(''), 'tag');
});

test('tagSlug is stable, so a link and its page agree', () => {
  for (const tag of ['AI', 'PySpark', 'self-hosted', 'Research']) {
    assert.equal(tagSlug(tag), tagSlug(tagSlug(tag)));
  }
});

test('dates format in en-NZ, month and year for lists and the full date for articles', () => {
  assert.equal(formatMonthYear('2026-03-15T00:00:00.000Z'), 'Mar 2026');
  assert.equal(formatFullDate('2026-03-15T00:00:00.000Z'), '15 March 2026');
});
