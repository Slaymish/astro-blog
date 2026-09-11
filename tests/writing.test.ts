import assert from 'node:assert/strict';
import test from 'node:test';
import { filterableTags, formatFullDate, formatMonthYear, tagSlug } from '../src/content/writing';
import type { WritingEntry } from '../src/content/types';

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

const entry = (tags: string[], publishedAt = '2026-01-01'): WritingEntry => ({
  type: 'post',
  title: 'T',
  excerpt: 'E',
  href: '/posts/t',
  publishedAt,
  displayDate: 'Jan 2026',
  tags,
});

test('filterableTags keeps only tags that would narrow to more than one entry', () => {
  const tags = filterableTags([entry(['ai', 'solo']), entry(['ai', 'systems']), entry(['systems'])]);
  assert.deepEqual(tags, ['ai', 'systems']);
});

test('filterableTags sorts alphabetically and drops everything when nothing repeats', () => {
  assert.deepEqual(filterableTags([entry(['zeta', 'alpha']), entry(['alpha', 'zeta'])]), ['alpha', 'zeta']);
  assert.deepEqual(filterableTags([entry(['one']), entry(['two'])]), []);
  assert.deepEqual(filterableTags([]), []);
});

test('a tag repeated within one entry does not qualify it as filterable', () => {
  assert.deepEqual(filterableTags([entry(['ai', 'ai'])]), ['ai']);
});

test('dates format in en-NZ, month and year for lists and the full date for articles', () => {
  assert.equal(formatMonthYear('2026-03-15T00:00:00.000Z'), 'Mar 2026');
  assert.equal(formatFullDate('2026-03-15T00:00:00.000Z'), '15 March 2026');
});
