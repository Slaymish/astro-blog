import assert from 'node:assert/strict';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { THEME_BOOT } from '../src/client/themeBoot';

function boot(stored: string | null, light: boolean, storageBlocked = false) {
  const classes = new Set(['dark']);
  const root = {
    classList: {
      remove: (...names: string[]) => names.forEach((name) => classes.delete(name)),
      add: (name: string) => classes.add(name),
    },
    dataset: { themeSource: '' },
  };
  runInNewContext(THEME_BOOT, {
    document: { documentElement: root },
    localStorage: { getItem: () => {
      if (storageBlocked) throw new Error('Storage blocked');
      return stored;
    } },
    window: { matchMedia: () => ({ matches: light }) },
  });
  return { theme: [...classes][0], source: root.dataset.themeSource };
}

test('valid saved themes override the system preference', () => {
  assert.deepEqual(boot('dark', true), { theme: 'dark', source: 'user' });
  assert.deepEqual(boot('light', false), { theme: 'light', source: 'user' });
});

test('invalid or absent preferences keep following the system', () => {
  for (const stored of [null, '', 'invalid']) {
    assert.deepEqual(boot(stored, true), { theme: 'light', source: 'system' });
    assert.deepEqual(boot(stored, false), { theme: 'dark', source: 'system' });
  }
});

test('blocked storage still allows the system theme to initialise', () => {
  assert.deepEqual(boot(null, true, true), { theme: 'light', source: 'system' });
});
