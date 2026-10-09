import assert from 'node:assert/strict';
import test from 'node:test';
import { initHeroReveal } from '../src/client/heroReveal';

function withHero(options: { reduced?: boolean; scrollY?: number }, run: (fixture: {
  hero: { dataset: { reveal: string } };
  inputs: EventTarget;
  animations: unknown[];
}) => void): void {
  const animations: unknown[] = [];
  const hero = {
    dataset: { reveal: 'pending' },
    querySelector: () => name,
  };
  const name = {
    getBoundingClientRect: () => ({ left: hero.dataset.reveal === 'pending' ? 300 : 40, top: 400 }),
    animate: (frames: unknown) => animations.push(frames),
  };
  const inputs = Object.assign(new EventTarget(), {
    scrollY: options.scrollY ?? 0,
    matchMedia: () => ({ matches: options.reduced ?? false }),
  });
  const globals = {
    window: inputs,
    document: { querySelector: () => hero },
    location: { hash: '' },
  };
  const previous = new Map<string, PropertyDescriptor | undefined>();
  for (const [key, value] of Object.entries(globals)) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, configurable: true });
  }
  try {
    initHeroReveal();
    run({ hero, inputs, animations });
  } finally {
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
}

test('pointer movement and focus alone leave the hero centred', () => {
  withHero({}, ({ hero, inputs, animations }) => {
    inputs.dispatchEvent(new Event('pointermove'));
    inputs.dispatchEvent(new Event('focusin'));
    assert.equal(hero.dataset.reveal, 'pending');
    assert.equal(animations.length, 0);
    inputs.dispatchEvent(new Event('keydown'));
    assert.equal(hero.dataset.reveal, 'revealed');
    assert.equal(animations.length, 1);
    inputs.dispatchEvent(new Event('wheel'));
    assert.equal(animations.length, 1, 'later input must not replay the reveal');
  });
});

test('clicking, tapping and scrolling each reveal the introduction', () => {
  for (const event of ['pointerdown', 'touchstart', 'wheel', 'scroll']) {
    withHero({}, ({ hero, inputs }) => {
      inputs.dispatchEvent(new Event(event));
      assert.equal(hero.dataset.reveal, 'revealed', event);
    });
  }
});

test('reduced motion reveals without animation; restored scrolling starts revealed', () => {
  withHero({ reduced: true }, ({ hero, inputs, animations }) => {
    inputs.dispatchEvent(new Event('keydown'));
    assert.equal(hero.dataset.reveal, 'revealed');
    assert.equal(animations.length, 0);
  });
  withHero({ scrollY: 200 }, ({ hero, animations }) => {
    assert.equal(hero.dataset.reveal, 'revealed');
    assert.equal(animations.length, 0);
  });
});
