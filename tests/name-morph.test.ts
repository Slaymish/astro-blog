import assert from 'node:assert/strict';
import test from 'node:test';
import { initNameMorph } from '../src/client/nameMorph';

async function withPendingFonts(options: { scrollY?: number; hash?: string; reduced?: boolean; revealed?: boolean } = {},
  run: (f: {
    heading: { dataset: { morph: string } };
    inputs: EventTarget;
    doc: EventTarget & { hidden: boolean };
    motion: EventTarget & { matches: boolean };
    timers: Map<number, () => void>;
  }) => void): Promise<void> {
  let resolveFonts!: () => void;
  const ready = new Promise<void>((resolve) => { resolveFonts = resolve; });
  const heading = {
    dataset: { morph: 'pending' },
    querySelector: () => ({}),
    closest: () => ({ dataset: { reveal: options.revealed ? 'revealed' : 'pending' } }),
  };
  const timers = new Map<number, () => void>();
  const motion = Object.assign(new EventTarget(), { matches: options.reduced ?? false });
  const inputs = Object.assign(new EventTarget(), {
    scrollY: options.scrollY ?? 0,
    matchMedia: () => motion,
    setTimeout: (callback: () => void) => { timers.set(1, callback); return 1; },
    clearTimeout: (id: number) => timers.delete(id),
  });
  const doc = Object.assign(new EventTarget(), { hidden: false, fonts: { ready }, querySelector: () => heading });
  let frames = 0;
  const globals = {
    window: inputs, document: doc, location: { hash: options.hash ?? '' },
    cancelAnimationFrame: () => {},
    requestAnimationFrame: () => { frames++; return frames; },
  };
  const previous = new Map<string, PropertyDescriptor | undefined>();
  for (const [key, value] of Object.entries(globals)) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, value });
  }
  try {
    const pending = initNameMorph();
    run({ heading, inputs, doc, motion, timers });
    resolveFonts();
    await pending;
    assert.equal(frames, 0, 'a cancelled or restored page must not start an animation after fonts load');
    assert.equal(timers.size, 0, 'completion removes the fallback timer');
  } finally {
    resolveFonts();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
}

test('scrolling, clicking, typing and resizing during font loading complete the name immediately', async () => {
  for (const event of ['wheel', 'scroll', 'touchstart', 'pointerdown', 'keydown', 'resize']) {
    await withPendingFonts({}, ({ inputs, heading }) => {
      inputs.dispatchEvent(new Event(event));
      assert.equal(heading.dataset.morph, 'complete', event);
    });
  }
});

test('restored scrolling, fragment navigation and an already revealed hero skip the logo animation', async () => {
  for (const options of [{ scrollY: 600 }, { hash: '#main' }, { revealed: true }, { reduced: true }]) {
    await withPendingFonts(options, ({ heading }) => assert.equal(heading.dataset.morph, 'complete'));
  }
});

test('leaving or hiding the page while fonts load cannot replay an unfinished mark on return', async () => {
  await withPendingFonts({}, ({ inputs, heading }) => {
    inputs.dispatchEvent(new Event('pagehide'));
    assert.equal(heading.dataset.morph, 'complete');
  });
  await withPendingFonts({}, ({ doc, heading }) => {
    doc.hidden = true;
    doc.dispatchEvent(new Event('visibilitychange'));
    assert.equal(heading.dataset.morph, 'complete');
  });
});

test('a motion preference change while loading exposes the ordinary name', async () => {
  await withPendingFonts({}, ({ motion, heading }) => {
    motion.matches = true;
    motion.dispatchEvent(new Event('change'));
    assert.equal(heading.dataset.morph, 'complete');
  });
});

test('the font-loading fallback exposes the heading and cannot start late animation', async () => {
  await withPendingFonts({}, ({ timers, heading }) => {
    const fallback = timers.get(1);
    assert.ok(fallback);
    fallback();
    assert.equal(heading.dataset.morph, 'complete');
  });
});
