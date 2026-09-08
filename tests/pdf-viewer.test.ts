import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { setImmediate } from 'node:timers/promises';
import test from 'node:test';

const source = readFileSync(new URL('../src/components/features/PDFViewer.astro', import.meta.url), 'utf8');
const script = source.match(/<script is:inline data-cfasync="false"[^>]*>([\s\S]*?)<\/script>/)![1];

function viewer({ missing = false, loadError = false, renderError = false, slow = false } = {}) {
  const events = new Map<string, Function>();
  const elements = new Map<string, any>();
  const renders: Array<{ page: number; scale: number }> = [];
  const release: Function[] = [];
  let resize: Function | undefined;
  const get = (id: string): any => {
    if (!elements.has(id)) elements.set(id, {
      style: {}, textContent: '', clientWidth: 1032,
      getContext: () => ({}),
      addEventListener: (_: string, action: Function) => events.set(id, action),
    });
    return elements.get(id);
  };
  const document = {
    getElementById: get,
    querySelector: () => ({
      querySelector: () => get('container'),
      requestFullscreen: async () => { document.fullscreenElement = true; },
    }),
    fullscreenElement: false,
    exitFullscreen: async () => { document.fullscreenElement = false; },
    addEventListener: (name: string, action: Function) => events.set(name, action),
  };
  const pdf = {
    numPages: 4,
    getPage: async (page: number) => ({
      getViewport: ({ scale }: { scale: number }) => ({ width: 500 * scale, height: 700 * scale, scale }),
      render: ({ viewport }: any) => {
        renders.push({ page, scale: viewport.scale });
        return { promise: renderError ? Promise.reject(Error('render failed')) : slow
          ? new Promise<void>(resolve => release.push(resolve)) : Promise.resolve() };
      },
    }),
  };
  let load!: (pdf: unknown) => void;
  const promise = loadError ? Promise.reject(Error('load failed')) : new Promise(resolve => { load = resolve; });
  runInNewContext(script, {
    document, pdfPath: '/test.pdf', console: { error() {} },
    window: {
      pdfjsLib: missing ? undefined : { GlobalWorkerOptions: {}, getDocument: () => ({ promise }) },
      addEventListener: (name: string, action: Function) => events.set(name, action),
    },
    setTimeout: (action: Function) => { resize = action; return 1; },
    clearTimeout: () => { resize = undefined; },
  });
  return {
    get, renders, release, document,
    load: () => load(pdf),
    click: (id: string) => events.get(id)!(),
    resize: () => { events.get('resize')!(); resize!(); },
    key: (key: string, editable = false) => {
      let prevented = false;
      events.get('keydown')!({ key, target: { closest: () => editable }, preventDefault: () => { prevented = true; } });
      return prevented;
    },
  };
}

test('PDF navigation is safe before load and stays within page bounds', async () => {
  const v = viewer();
  v.click('next-page');
  assert.equal(v.renders.length, 0);
  v.load(); await setImmediate();
  assert.equal(v.get('page-count').textContent, 4);
  v.click('prev-page'); await setImmediate();
  assert.equal(v.renders.at(-1)!.page, 1);
  for (let i = 0; i < 8; i++) v.click('next-page');
  await setImmediate();
  assert.equal(v.renders.at(-1)!.page, 4);
  for (let i = 0; i < 8; i++) v.click('prev-page');
  await setImmediate();
  assert.equal(v.renders.at(-1)!.page, 1);
});

test('PDF zoom, shortcuts, fullscreen and resize retain their controls', async () => {
  const v = viewer(); v.load(); await setImmediate();
  for (let i = 0; i < 20; i++) v.click('zoom-in');
  await setImmediate();
  assert.equal(v.get('zoom-level').textContent, '300%');
  for (let i = 0; i < 20; i++) v.key('-');
  await setImmediate();
  assert.equal(v.get('zoom-level').textContent, '50%');
  assert.equal(v.key('0'), true); await setImmediate();
  assert.equal(v.get('zoom-level').textContent, '100%');
  assert.equal(v.key('ArrowRight', true), false);
  assert.equal(v.key('ArrowRight'), true); await setImmediate();
  assert.equal(v.renders.at(-1)!.page, 2);
  await v.click('fullscreen-btn'); assert.equal(v.document.fullscreenElement, true);
  await v.click('fullscreen-btn'); assert.equal(v.document.fullscreenElement, false);
  v.get('container').clientWidth = 282;
  v.resize(); await setImmediate();
  assert.equal(v.renders.at(-1)!.scale, 0.75);
});

test('PDF render queue never overlaps canvas renders and coalesces rapid changes', async () => {
  const v = viewer({ slow: true }); v.load(); await setImmediate();
  v.click('next-page'); v.click('next-page'); v.click('zoom-in');
  assert.equal(v.renders.length, 1);
  v.release.shift()!(); await setImmediate();
  assert.deepEqual(v.renders, [{ page: 1, scale: 1 }, { page: 3, scale: 1.25 }]);
  v.release.shift()!(); await setImmediate();
  assert.equal(v.get('pdf-canvas').style.display, 'block');
});

for (const failure of ['missing', 'loadError', 'renderError'] as const) {
  test(`PDF ${failure} exposes the download fallback`, async () => {
    const v = viewer({ [failure]: true });
    if (failure === 'renderError') v.load();
    await setImmediate();
    assert.equal(v.get('pdf-loading').style.display, 'none');
    assert.equal(v.get('pdf-error').style.display, 'flex');
  });
}
