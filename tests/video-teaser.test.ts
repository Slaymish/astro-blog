import assert from 'node:assert/strict';
import test from 'node:test';
import { initVideoTeaser } from '../src/client/videoTeaser';

/**
 * The plays/pauses-a-loop behaviour, without a browser. A fake observer stands
 * in for the intersection signal so the thresholds themselves are asserted:
 * full exit stops the clip, ten percent visible starts it.
 */
class FakeVideo extends EventTarget {
  paused = true;
  plays = 0;
  pauses = 0;
  play(): Promise<void> {
    this.plays++;
    this.paused = false;
    this.dispatchEvent(new Event('play'));
    return Promise.resolve();
  }
  pause(): void {
    if (!this.paused) this.pauses++;
    this.paused = true;
    this.dispatchEvent(new Event('pause'));
  }
}

function withTeaser(options: { reduced?: boolean }, run: (fixture: {
  video: FakeVideo;
  toggle: { hidden: boolean; dataset: Record<string, string>; labels: string[]; click: () => void };
  observe: (isIntersecting: boolean, ratio: number) => void;
  threshold: unknown;
}) => void): void {
  const video = new FakeVideo();
  const labels: string[] = [];
  const toggle = {
    hidden: true,
    dataset: {} as Record<string, string>,
    labels,
    setAttribute: (name: string, value: string) => { if (name === 'aria-label') labels.push(value); },
    addEventListener: (type: string, handler: () => void) => { if (type === 'click') toggle.click = handler; },
    click: () => {},
  };
  const root = {
    querySelector: (selector: string) => (selector === '[data-video-teaser]' ? video : toggle),
  };

  let callback: ((entries: unknown[]) => void) | undefined;
  let threshold: unknown;
  class FakeObserver {
    constructor(cb: (entries: unknown[]) => void, init?: { threshold?: unknown }) {
      callback = cb;
      threshold = init?.threshold;
    }
    observe(): void {}
  }

  const motion = Object.assign(new EventTarget(), { matches: options.reduced ?? false });
  const globals = {
    IntersectionObserver: FakeObserver,
    matchMedia: () => motion,
  };
  const previous = new Map<string, PropertyDescriptor | undefined>();
  for (const [key, value] of Object.entries(globals)) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, configurable: true });
  }
  try {
    initVideoTeaser(root as unknown as HTMLElement);
    run({
      video,
      toggle,
      threshold,
      observe(isIntersecting, ratio) {
        callback?.([{ isIntersecting, intersectionRatio: ratio }]);
      },
    });
  } finally {
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
}

test('the control ships hidden and is revealed once the behaviour runs', () => {
  withTeaser({}, ({ toggle, video }) => {
    assert.equal(toggle.hidden, false);
    assert.deepEqual(toggle.dataset.playing, 'false');
    assert.deepEqual(toggle.labels, ['Play animation']);
    assert.equal(video.paused, true);
  });
});

test('ten percent on screen starts the clip', () => {
  withTeaser({}, ({ video, observe }) => {
    observe(true, 0.1);
    assert.equal(video.plays, 1);
    assert.equal(video.paused, false);
  });
});

test('a sliver on screen leaves the clip stopped until enough of it shows', () => {
  withTeaser({}, ({ video, observe }) => {
    observe(true, 0.05);
    assert.equal(video.plays, 0, 'a sliver is not enough to play');
    observe(true, 0.4);
    assert.equal(video.plays, 1);
  });
});

test('the clip stops only once nothing of it is left on screen', () => {
  withTeaser({}, ({ video, observe, threshold }) => {
    assert.deepEqual(threshold, [0, 0.1], 'the observer must watch both edges of the threshold');
    observe(true, 0.3);
    assert.equal(video.paused, false);
    observe(true, 0.02);
    assert.equal(video.paused, false, 'still partially visible, so it keeps playing');
    observe(false, 0);
    assert.equal(video.paused, true);
  });
});

test('a viewer who pauses keeps it paused when they scroll back', () => {
  withTeaser({}, ({ video, toggle, observe }) => {
    observe(true, 0.5);
    assert.equal(video.paused, false);
    toggle.click();
    assert.equal(video.paused, true);
    observe(false, 0);
    observe(true, 0.5);
    assert.equal(video.paused, true, 'the user pause outranks the scroll position');
  });
});

test('reduced motion leaves the clip still', () => {
  withTeaser({ reduced: true }, ({ video, observe }) => {
    observe(true, 0.8);
    assert.equal(video.plays, 0);
    assert.equal(video.paused, true);
  });
});
