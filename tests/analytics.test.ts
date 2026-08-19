import assert from 'node:assert/strict';
import test from 'node:test';
import { MAX_EVENTS, cleanEvents, cleanNonce, parseBookingRef } from '../src/lib/analytics';

test('cleanEvents keeps well-formed events and drops the rest', () => {
  const cleaned = cleanEvents([
    { t: 0, p: '/writing' },
    { t: 1200.6, p: '/work', n: 'book-call' },
    { t: 5, p: 'https://evil.example/steal' },
    { t: 5, p: '/ok', n: 'SHOUTING' },
    'not an object'
  ]);

  assert.deepEqual(cleaned, [
    { t: 0, p: '/writing' },
    { t: 1201, p: '/work', n: 'book-call' },
    { t: 5, p: '/ok' }
  ]);
});

test('cleanEvents rejects payloads that are not arrays', () => {
  assert.deepEqual(cleanEvents({ p: '/writing' }), []);
  assert.deepEqual(cleanEvents(null), []);
  assert.deepEqual(cleanEvents('/writing'), []);
});

test('cleanEvents caps the number of events it will accept', () => {
  const flood = Array.from({ length: MAX_EVENTS * 5 }, (_, i) => ({ t: i, p: '/writing' }));

  assert.equal(cleanEvents(flood).length, MAX_EVENTS);
});

test('cleanEvents bounds path length and clamps negative timestamps', () => {
  const [event] = cleanEvents([{ t: -9000, p: `/${'a'.repeat(500)}` }]);

  assert.equal(event.t, 0);
  assert.equal(event.p.length, 120);
});

test('cleanNonce accepts only the opaque browser-minted format', () => {
  assert.equal(cleanNonce('a1b2c3d4'), 'a1b2c3d4');
  assert.equal(cleanNonce('UPPERCASE'), null);
  assert.equal(cleanNonce('abc'), null);
  assert.equal(cleanNonce('x'.repeat(33)), null);
  assert.equal(cleanNonce(12345678), null);
});

test('parseBookingRef splits a well-formed ref', () => {
  assert.deepEqual(parseBookingRef('/contact|a1b2c3d4'), { page: '/contact', nonce: 'a1b2c3d4' });
});

test('parseBookingRef falls back to an unknown nonce rather than dropping the page', () => {
  assert.deepEqual(parseBookingRef('/contact'), { page: '/contact', nonce: 'unknown' });
  assert.deepEqual(parseBookingRef('/contact|NOPE'), { page: '/contact', nonce: 'unknown' });
});

test('parseBookingRef rejects anything that is not a site-relative path', () => {
  assert.equal(parseBookingRef('https://evil.example|a1b2c3d4'), null);
  assert.equal(parseBookingRef('contact'), null);
  assert.equal(parseBookingRef(''), null);
  assert.equal(parseBookingRef({ page: '/contact' }), null);
});
