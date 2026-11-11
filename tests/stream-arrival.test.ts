import test from 'node:test';
import assert from 'node:assert/strict';
import { completionOffsets, hybridPhases, sentencesOf } from '../src/client/stream-arrival';

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

// The demo's own sample, which is what the published numbers describe.
const SAMPLE =
  'The library on the corner shut in 2019 and the building sat empty for three years, until a group of neighbours raised enough between them to reopen it as a tool library. You can borrow a drill or a ladder for a week instead of buying one, which is how most of them get used once or twice and then sit in a garage. The whole thing runs on two retired librarians and a rota they keep in a spreadsheet.';

const rejoin = ({ lead, words, sentences }: ReturnType<typeof hybridPhases>) =>
  [lead, words.join(' '), sentences.join(' ')].filter(Boolean).join(' ');

test('hybrid coarsens from the first clause to words to sentences', () => {
  const phases = hybridPhases(SAMPLE);
  assert.equal(phases.lead, 'The library on the corner shut in 2019 and the building sat empty for three years,');
  assert.equal(phases.words[0], 'until');
  assert.equal(phases.words.at(-1), 'library.');
  assert.equal(phases.sentences.length, 2);
  assert.match(phases.sentences[0]!, /^You can borrow a drill/);
  assert.match(phases.sentences[1]!, /^The whole thing runs/);
});

test('hybrid retypes the whole source exactly once', () => {
  assert.equal(rejoin(hybridPhases(SAMPLE)), SAMPLE);
});

test('every hybrid unit lands after the characters it needs, in source order', () => {
  const phases = hybridPhases(SAMPLE);
  const offsets = completionOffsets(SAMPLE, [...phases.words, ...phases.sentences]);
  assert.ok(offsets.every((offset, index) => index === 0 || offset > offsets[index - 1]!));
  assert.ok(offsets[0]! > phases.lead.length);
  assert.equal(offsets.at(-1), SAMPLE.length);
});

test('without a clause break the lead is the opening words, never the sentence', () => {
  const phases = hybridPhases('One two three four five six seven eight.');
  assert.equal(phases.lead, 'One two three four five six');
  assert.deepEqual(phases.words, ['seven', 'eight.']);
  assert.deepEqual(phases.sentences, []);
});

test('a first sentence that ends on its clause break leaves no word phase', () => {
  const phases = hybridPhases('Shut, and quiet. It stayed that way.');
  assert.deepEqual(phases.words, ['and', 'quiet.']);
  const only = hybridPhases('Shut.');
  assert.deepEqual(only, { lead: 'Shut.', words: [], sentences: [] });
});

test('sentences keep their trailing space for the sentence view', () => {
  assert.deepEqual(sentencesOf('One. Two.'), ['One. ', 'Two.']);
});
