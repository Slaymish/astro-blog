import test from 'node:test';
import assert from 'node:assert/strict';
import { completionOffsets } from '../src/client/stream-arrival';

test('words wait for their boundary; sentences wait for their complete source', () => {
  const source = 'One two. Three four.';
  assert.deepEqual(completionOffsets(source, ['One', 'two.', 'Three', 'four.']), [4, 9, 15, 20]);
  assert.deepEqual(completionOffsets(source, ['One two. ', 'Three four.']), [9, 20]);
});

test('repeated units consume the next occurrence and finish at EOF', () => {
  assert.deepEqual(completionOffsets('a a a', ['a', 'a', 'a']), [2, 4, 5]);
});

test('a unit missing from the character stream cannot be revealed', () => {
  assert.throws(() => completionOffsets('One two.', ['invented']), /does not match/);
});
