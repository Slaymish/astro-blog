import assert from 'node:assert/strict';
import test from 'node:test';
import { initWheelScroll } from '../src/client/wheelScroll';

function fixture(run: (f: {
  wheel: (options?: Record<string, unknown>) => Event;
  advance: (time: number) => void;
  inputs: EventTarget & { scrollY: number };
  motion: EventTarget & { matches: boolean };
  nested: object;
}) => void): void {
  let now = 0;
  let id = 0;
  const frames = new Map<number, FrameRequestCallback>();
  class Element {
    tagName = 'DIV';
    isContentEditable = false;
    scrollHeight = 800;
    clientHeight = 200;
    overflowY = 'auto';
  }
  const nested = new Element();
  const body = new Element();
  const root = Object.assign(new Element(), { scrollHeight: 3000 });
  const motion = Object.assign(new EventTarget(), { matches: false });
  const inputs = Object.assign(new EventTarget(), {
    scrollY: 0, innerHeight: 1000, matchMedia: () => motion,
    scrollTo: ({ top }: { top: number }) => { inputs.scrollY = top; },
  });
  const globals = {
    window: inputs, document: { body, documentElement: root }, HTMLElement: Element,
    performance: { now: () => now },
    getComputedStyle: (el: Element) => ({ overflowY: el.overflowY, lineHeight: '24px' }),
    requestAnimationFrame: (cb: FrameRequestCallback) => { frames.set(++id, cb); return id; },
    cancelAnimationFrame: (key: number) => frames.delete(key),
  };
  const previous = new Map<string, PropertyDescriptor | undefined>();
  for (const [key, value] of Object.entries(globals)) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, value });
  }
  try {
    initWheelScroll();
    run({ inputs, motion, nested,
      wheel(options = {}) {
        const event = new Event('wheel', { cancelable: true });
        Object.assign(event, { deltaMode: 0, deltaY: 100, deltaX: 0, ctrlKey: false,
          metaKey: false, altKey: false, shiftKey: false, composedPath: () => [body, root], ...options });
        inputs.dispatchEvent(event);
        return event;
      },
      advance(time) {
        now = time;
        const pending = [...frames.values()];
        frames.clear();
        pending.forEach((cb) => cb(now));
      },
    });
  } finally {
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
}

test('a wheel notch moves through intermediate positions and lands within 140ms', () => {
  fixture(({ wheel, advance, inputs }) => {
    assert.equal(wheel().defaultPrevented, true);
    assert.equal(inputs.scrollY, 0);
    advance(70);
    assert.ok(inputs.scrollY > 0 && inputs.scrollY < 100);
    advance(140);
    assert.equal(inputs.scrollY, 100);
  });
});

test('repeated notches preserve distance; reversing abandons pending travel', () => {
  fixture(({ wheel, advance, inputs }) => {
    wheel(); advance(30); wheel(); advance(170);
    assert.equal(inputs.scrollY, 200);
    wheel(); advance(200);
    const position = inputs.scrollY;
    wheel({ deltaY: -100 }); advance(340);
    assert.equal(inputs.scrollY, position - 100);
  });
});

test('precision gestures and their following events remain native', () => {
  for (const options of [{ deltaY: 12 }, { deltaY: 60.5 }, { deltaX: 20 }]) {
    fixture(({ wheel, advance, inputs }) => {
      assert.equal(wheel(options).defaultPrevented, false);
      assert.equal(wheel().defaultPrevented, false);
      advance(300);
      assert.equal(inputs.scrollY, 0);
      assert.equal(wheel().defaultPrevented, true);
    });
  }
});

test('nested scroll regions, modified wheels and reduced motion stay native', () => {
  fixture(({ wheel, nested, motion }) => {
    assert.equal(wheel({ composedPath: () => [nested] }).defaultPrevented, false);
    for (const modifier of ['ctrlKey', 'metaKey', 'shiftKey', 'altKey']) {
      assert.equal(wheel({ [modifier]: true }).defaultPrevented, false);
    }
    motion.matches = true;
    assert.equal(wheel().defaultPrevented, false);
  });
});

test('keyboard, touch, focus, preference changes and external jumps cancel motion', () => {
  for (const event of ['keydown', 'touchstart', 'pointerdown', 'focusin', 'hashchange', 'resize']) {
    fixture(({ wheel, advance, inputs }) => {
      wheel(); advance(30); const position = inputs.scrollY;
      inputs.dispatchEvent(new Event(event)); advance(140);
      assert.equal(inputs.scrollY, position);
    });
  }
  fixture(({ wheel, advance, inputs, motion }) => {
    wheel(); motion.matches = true; motion.dispatchEvent(new Event('change')); advance(140);
    assert.equal(inputs.scrollY, 0);
    motion.matches = false; wheel(); inputs.scrollY = 500; advance(150);
    assert.equal(inputs.scrollY, 500);
  });
});

test('line deltas use line height and the document bounds limit travel', () => {
  fixture(({ wheel, advance, inputs }) => {
    wheel({ deltaMode: 1, deltaY: 3 }); advance(140);
    assert.equal(inputs.scrollY, 72);
    inputs.scrollY = 1990;
    wheel(); advance(280);
    assert.equal(inputs.scrollY, 2000);
    assert.equal(wheel().defaultPrevented, false);
  });
});
