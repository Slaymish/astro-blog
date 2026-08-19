import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clientAddress,
  consume,
  counterKey,
  isExpiredCounter,
  windowId,
  type CounterStore
} from '../src/lib/rateLimit';

function fakeStore(): CounterStore & { data: Map<string, unknown> } {
  const data = new Map<string, unknown>();
  return {
    data,
    async get(key: string) {
      return data.has(key) ? data.get(key) : null;
    },
    async setJSON(key: string, value: unknown) {
      data.set(key, value);
    }
  };
}

test('windowId buckets by the hour', () => {
  assert.equal(windowId(new Date('2026-08-18T21:37:04Z')), '2026-08-18T21');
  assert.equal(windowId(new Date('2026-08-18T21:59:59Z')), '2026-08-18T21');
  assert.notEqual(windowId(new Date('2026-08-18T22:00:00Z')), '2026-08-18T21');
});

test('clientAddress prefers the Netlify header and falls back to the forwarded chain', () => {
  const netlify = new Headers({ 'x-nf-client-connection-ip': '203.0.113.7', 'x-forwarded-for': '198.51.100.1' });
  assert.equal(clientAddress(netlify), '203.0.113.7');

  const proxied = new Headers({ 'x-forwarded-for': '198.51.100.1, 203.0.113.9' });
  assert.equal(clientAddress(proxied), '198.51.100.1');

  assert.equal(clientAddress(new Headers()), null);
});

test('counterKey never embeds the raw address', async () => {
  const key = await counterKey('203.0.113.7', '2026-08-18T21', 'salt');

  assert.ok(!key.includes('203.0.113.7'));
  assert.match(key, /^2026-08-18T21\/[0-9a-f]{32}$/);
});

test('counterKey rotates the hash each window so visits cannot be correlated', async () => {
  const first = await counterKey('203.0.113.7', '2026-08-18T21', 'salt');
  const second = await counterKey('203.0.113.7', '2026-08-18T22', 'salt');

  assert.notEqual(first.split('/')[1], second.split('/')[1]);
});

test('counterKey separates different addresses and different salts', async () => {
  const a = await counterKey('203.0.113.7', '2026-08-18T21', 'salt');
  const b = await counterKey('203.0.113.8', '2026-08-18T21', 'salt');
  const c = await counterKey('203.0.113.7', '2026-08-18T21', 'other-salt');

  assert.notEqual(a, b);
  assert.notEqual(a, c);
});

test('counterKey falls back to one shared bucket when no address is available', async () => {
  assert.equal(await counterKey(null, '2026-08-18T21', 'salt'), '2026-08-18T21/unknown');
});

test('consume allows up to the limit and then refuses', async () => {
  const store = fakeStore();

  assert.equal(await consume(store, 'w/abc', 2), true);
  assert.equal(await consume(store, 'w/abc', 2), true);
  assert.equal(await consume(store, 'w/abc', 2), false);
  assert.equal(await consume(store, 'w/abc', 2), false);

  // A refused request must not keep incrementing the counter.
  assert.deepEqual(store.data.get('w/abc'), { n: 2 });
});

test('consume meters each key independently', async () => {
  const store = fakeStore();

  assert.equal(await consume(store, 'w/one', 1), true);
  assert.equal(await consume(store, 'w/two', 1), true);
  assert.equal(await consume(store, 'w/one', 1), false);
});

test('consume ignores a corrupted counter rather than locking the endpoint', async () => {
  const store = fakeStore();
  store.data.set('w/abc', { n: 'not-a-number' });

  assert.equal(await consume(store, 'w/abc', 1), true);
});

test('consume fails open when the store is unreadable', async () => {
  const broken: CounterStore = {
    async get() {
      throw new Error('store unavailable');
    },
    async setJSON() {
      throw new Error('store unavailable');
    }
  };

  assert.equal(await consume(broken, 'w/abc', 1), true);
});

test('consume accepts a store whose write resolves a result value', async () => {
  // Netlify's Store.setJSON resolves a WriteResult. CounterStore has to stay
  // wide enough to accept it, or the collector will not type-check.
  const writeResultStore: CounterStore = {
    async get() {
      return null;
    },
    async setJSON() {
      return { etag: 'abc123', modified: true };
    }
  };

  assert.equal(await consume(writeResultStore, 'w/abc', 1), true);
});

test('isExpiredCounter expires only windows before the cutoff', () => {
  assert.equal(isExpiredCounter('2026-08-16T21/abc', '2026-08-18T00'), true);
  assert.equal(isExpiredCounter('2026-08-18T21/abc', '2026-08-18T00'), false);
  assert.equal(isExpiredCounter('2026-08-18T00/abc', '2026-08-18T00'), false);
});
