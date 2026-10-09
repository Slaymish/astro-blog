import assert from 'node:assert/strict';
import test from 'node:test';
import { initHeroReveal } from '../src/client/heroReveal';

function withHero(options: { reduced?: boolean; scrollY?: number }, run: (fixture: {
  hero: { dataset: { reveal: string; revealMotion?: string } };
  inputs: EventTarget;
  animations: unknown[];
  motion: EventTarget & { matches: boolean };
  doc: EventTarget & { hidden: boolean };
  cancelled: () => number;
  timers: Map<number, () => void>;
  delays: number[];
  nested: object;
  wheel: (deltaY?: number, options?: Record<string, unknown>) => Event;
}) => void): void {
  const animations: unknown[] = [];
  let cancellations = 0;
  const timers = new Map<number, () => void>();
  const delays: number[] = [];
  class El { tagName = "DIV"; isContentEditable = false; scrollHeight = 800; clientHeight = 200; }
  const nested = new El();
  const motion = Object.assign(new EventTarget(), { matches: options.reduced ?? false });
  const doc = Object.assign(new EventTarget(), { hidden: false, querySelector: () => hero });
  const hero = {
    dataset: { reveal: 'pending' },
    querySelector: () => name,
  };
  const name = {
    getBoundingClientRect: () => ({ left: hero.dataset.reveal === 'pending' ? 300 : 40, top: 400 }),
    animate: (frames: unknown) => { animations.push(frames); return { cancel: () => cancellations++ }; },
  };
  const inputs = Object.assign(new EventTarget(), {
    scrollY: options.scrollY ?? 0,
    matchMedia: () => motion,
    setTimeout: (callback: () => void, delay: number) => { delays.push(delay); timers.set(1, callback); return 1; },
    clearTimeout: (id: number) => timers.delete(id),
  });
  const globals = {
    HTMLElement: El,
    getComputedStyle: () => ({ overflowY: "auto" }),
    window: inputs,
    document: doc,
    location: { hash: '' },
  };
  const previous = new Map<string, PropertyDescriptor | undefined>();
  for (const [key, value] of Object.entries(globals)) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, configurable: true });
  }
  try {
    initHeroReveal();
    run({ hero, inputs, animations, motion, doc, cancelled: () => cancellations, timers, delays, nested,
      wheel(deltaY = 100, options = {}) {
        const event = new Event('wheel', { cancelable: true });
        Object.assign(event, { deltaY, deltaX: 0, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, ...options });
        inputs.dispatchEvent(event);
        return event;
      },
    });
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


test('changing to reduced motion reveals a pending introduction immediately', () => {
  withHero({}, ({ hero, motion, animations }) => {
    motion.matches = true;
    motion.dispatchEvent(new Event('change'));
    assert.equal(hero.dataset.reveal, 'revealed');
    assert.equal(animations.length, 0);
  });
});

test('resizing or changing motion preference cancels an active name relocation', () => {
  withHero({}, ({ inputs, cancelled, motion }) => {
    inputs.dispatchEvent(new Event('wheel'));
    inputs.dispatchEvent(new Event('resize'));
    assert.equal(cancelled(), 1);
    motion.matches = true;
    motion.dispatchEvent(new Event('change'));
    assert.equal(cancelled(), 2);
  });
});

test('leaving or hiding a pending page prepares a stable introduction for return', () => {
  for (const hiding of [false, true]) {
    withHero({}, ({ hero, inputs, doc, animations }) => {
      if (hiding) { doc.hidden = true; doc.dispatchEvent(new Event('visibilitychange')); }
      else inputs.dispatchEvent(new Event('pagehide'));
      assert.equal(hero.dataset.reveal, 'revealed');
      inputs.dispatchEvent(new Event('scroll'));
      assert.equal(animations.length, 0);
    });
  }
});


test('the first downward wheel gesture pauses once for 400ms without queuing travel', () => {
  withHero({}, ({ wheel, hero, timers, animations, delays }) => {
    assert.equal(wheel().defaultPrevented, true);
    assert.equal(hero.dataset.reveal, 'revealed');
    assert.equal(hero.dataset.revealMotion, 'brief');
    assert.deepEqual(delays, [400]);
    assert.equal(animations.length, 1);
    assert.equal(wheel().defaultPrevented, true, 'subsequent notches during the hold are absorbed');
    const release = timers.get(1);
    assert.ok(release);
    release();
    assert.equal(timers.size, 0);
    assert.equal(wheel().defaultPrevented, false, 'scrolling is released after the hold');
    assert.equal(wheel().defaultPrevented, false, 'returning to the top cannot hold a second time');
  });
});

test('reversed, horizontal or modified wheel input can escape the opening hold', () => {
  for (const options of [{ deltaY: -100 }, { deltaX: 20 }, { ctrlKey: true }, { shiftKey: true }]) {
    withHero({}, ({ wheel, timers }) => {
      wheel();
      assert.equal(wheel(100, options).defaultPrevented, false);
      assert.equal(timers.size, 0);
      assert.equal(wheel().defaultPrevented, false);
    });
  }
});

test('keyboard, touch, focus and resizing release a held opening immediately', () => {
  for (const event of ['keydown', 'touchstart', 'pointerdown', 'focusin', 'hashchange', 'resize', 'pagehide']) {
    withHero({}, ({ wheel, inputs, timers }) => {
      wheel();
      inputs.dispatchEvent(new Event(event));
      assert.equal(timers.size, 0, event);
      assert.equal(wheel().defaultPrevented, false, event);
    });
  }
});

test('restored positions and reduced motion never hold wheel input', () => {
  for (const options of [{ reduced: true }, { scrollY: 500 }]) {
    withHero(options, ({ wheel, timers }) => {
      assert.equal(wheel().defaultPrevented, false);
      assert.equal(timers.size, 0);
    });
  }
});


test('nested scroll areas are never captured by the opening hold', () => {
  withHero({}, ({ wheel, nested, timers }) => {
    assert.equal(wheel(100, { composedPath: () => [nested] }).defaultPrevented, false);
    assert.equal(timers.size, 0);
  });
});
