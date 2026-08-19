import assert from 'node:assert/strict';
import test from 'node:test';
import { timingSafeEqual } from '../src/lib/timingSafe';

test('timingSafeEqual matches identical strings', () => {
  assert.equal(timingSafeEqual('s3cr3t-token', 's3cr3t-token'), true);
});

test('timingSafeEqual rejects a differing byte at any position', () => {
  assert.equal(timingSafeEqual('s3cr3t-token', 'S3cr3t-token'), false);
  assert.equal(timingSafeEqual('s3cr3t-token', 's3cr3t-tokeN'), false);
});

test('timingSafeEqual rejects length mismatches without reading past the end', () => {
  assert.equal(timingSafeEqual('short', 'short-but-longer'), false);
  assert.equal(timingSafeEqual('', 'x'), false);
  assert.equal(timingSafeEqual('', ''), true);
});
