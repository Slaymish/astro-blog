import assert from 'node:assert/strict';
import test from 'node:test';
import { readRecommendations, type RecommendationReadStore } from '../src/server/recommendations';

function fakeStore(data: Record<string, unknown>): RecommendationReadStore {
  return {
    async list() {
      return { blobs: Object.keys(data).map((key) => ({ key })) };
    },
    async get(key: string) {
      const value = data[key];
      if (value instanceof Error) throw value;
      return value ?? null;
    }
  };
}

test('readRecommendations returns entries newest first', async () => {
  const store = fakeStore({
    '2026-09-01/a': { title: 'The Fall', receivedAt: '2026-09-01T10:00:00.000Z' },
    '2026-09-05/b': { title: 'The Gay Science', receivedAt: '2026-09-05T09:00:00.000Z' },
    '2026-09-03/c': { title: 'Ecce Homo', receivedAt: '2026-09-03T12:00:00.000Z' }
  });

  const result = await readRecommendations(store);
  assert.deepEqual(
    result.map((entry) => entry.title),
    ['The Gay Science', 'Ecce Homo', 'The Fall']
  );
});

test('readRecommendations skips malformed and unreadable blobs', async () => {
  const store = fakeStore({
    '2026-09-01/good': { title: 'The Fall', receivedAt: '2026-09-01T10:00:00.000Z' },
    '2026-09-02/missing-title': { receivedAt: '2026-09-02T10:00:00.000Z' },
    '2026-09-03/not-an-object': 'nope',
    '2026-09-04/throws': new Error('blob unavailable')
  });

  const result = await readRecommendations(store);
  assert.deepEqual(result.map((entry) => entry.title), ['The Fall']);
});

test('readRecommendations caps the read at the limit, keeping the newest days', async () => {
  const data: Record<string, unknown> = {};
  for (let day = 1; day <= 10; day += 1) {
    const stamp = `2026-09-${String(day).padStart(2, '0')}`;
    data[`${stamp}/id`] = { title: `Book ${day}`, receivedAt: `${stamp}T00:00:00.000Z` };
  }

  const result = await readRecommendations(fakeStore(data), 3);
  assert.deepEqual(result.map((entry) => entry.title), ['Book 10', 'Book 9', 'Book 8']);
});

test('readRecommendations handles an empty store', async () => {
  assert.deepEqual(await readRecommendations(fakeStore({})), []);
});
