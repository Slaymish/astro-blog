/**
 * Renders a report PDF onto a canvas. PDF.js comes from npm and the document
 * is fetched straight from the Sanity CDN, which sends CORS headers for this
 * origin; the worker is a hashed asset under /_astro, which satisfies
 * `worker-src 'self'`.
 */
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const RESIZE_DEBOUNCE_MS = 250;
/** Room for the container's padding when fitting a page to the width. */
const GUTTER_PX = 32;

export async function initPdfViewer(root: HTMLElement): Promise<void> {
  const url = root.dataset.pdfUrl;
  const canvas = root.querySelector<HTMLCanvasElement>('[data-pdf="canvas"]');
  const container = root.querySelector<HTMLElement>('[data-pdf="container"]');
  const loading = root.querySelector<HTMLElement>('[data-pdf="loading"]');
  const error = root.querySelector<HTMLElement>('[data-pdf="error"]');
  if (!url || !canvas || !container || !loading || !error) return;

  const find = (name: string): HTMLElement | null => root.querySelector(`[data-pdf="${name}"]`);
  const pageNumEl = find('page-num');
  const pageCountEl = find('page-count');
  const zoomEl = find('zoom-level');

  const showError = (reason: unknown): void => {
    console.error('PDF viewer:', reason);
    loading.hidden = true;
    canvas.hidden = true;
    error.hidden = false;
  };

  let pdfjs: typeof import('pdfjs-dist');
  try {
    pdfjs = await import('pdfjs-dist');
  } catch (reason) {
    showError(reason);
    return;
  }
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  let pdfDoc: Awaited<ReturnType<typeof pdfjs.getDocument>['promise']> | undefined;
  let pageNum = 1;
  let scale = 1;
  let rendering = false;
  let pending = false;

  // One canvas render at a time. Changes during a render coalesce into the
  // latest requested page and zoom, then the loop paints that state next.
  async function renderPage(): Promise<void> {
    pending = true;
    if (rendering || !pdfDoc) return;
    rendering = true;
    try {
      while (pending) {
        pending = false;
        const page = await pdfDoc.getPage(pageNum);
        const fit = (container!.clientWidth - GUTTER_PX) / page.getViewport({ scale: 1 }).width;
        const viewport = page.getViewport({ scale: Math.min(scale, fit * 1.5) });
        canvas!.height = viewport.height;
        canvas!.width = viewport.width;
        if (pageNumEl) pageNumEl.textContent = String(pageNum);
        const context = canvas!.getContext('2d');
        if (!context) throw new Error('Canvas 2D context unavailable');
        await page.render({ canvas: canvas!, canvasContext: context, viewport }).promise;
        loading!.hidden = true;
        error!.hidden = true;
        canvas!.hidden = false;
      }
    } catch (reason) {
      showError(reason);
    } finally {
      rendering = false;
    }
  }

  function navigate(delta: number): void {
    if (!pdfDoc) return;
    const next = Math.max(1, Math.min(pdfDoc.numPages, pageNum + delta));
    if (next === pageNum) return;
    pageNum = next;
    void renderPage();
  }

  function zoom(value: number): void {
    scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, value));
    if (zoomEl) zoomEl.textContent = `${Math.round(scale * 100)}%`;
    void renderPage();
  }

  const actions: Record<string, () => void> = {
    'prev-page': () => navigate(-1),
    'next-page': () => navigate(1),
    'zoom-in': () => zoom(scale + 0.25),
    'zoom-out': () => zoom(scale - 0.25),
    'zoom-reset': () => zoom(1),
    fullscreen: () => {
      const request = document.fullscreenElement ? document.exitFullscreen() : root.requestFullscreen();
      request.catch((reason) => console.error('PDF fullscreen:', reason));
    },
  };

  for (const [name, action] of Object.entries(actions)) {
    find(name)?.addEventListener('click', action);
  }

  const shortcuts: Record<string, string> = {
    ArrowLeft: 'prev-page',
    ArrowRight: 'next-page',
    '+': 'zoom-in',
    '=': 'zoom-in',
    '-': 'zoom-out',
    '0': 'zoom-reset',
  };

  document.addEventListener('keydown', (event) => {
    const target = event.target as Element | null;
    if (target?.closest('input, textarea, select, [contenteditable]')) return;
    const action = actions[shortcuts[event.key] ?? ''];
    if (!action) return;
    event.preventDefault();
    action();
  });

  let resizeTimeout: ReturnType<typeof setTimeout>;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => void renderPage(), RESIZE_DEBOUNCE_MS);
  });

  try {
    pdfDoc = await pdfjs.getDocument({ url }).promise;
    if (pageCountEl) pageCountEl.textContent = String(pdfDoc.numPages);
    await renderPage();
  } catch (reason) {
    showError(reason);
  }
}
