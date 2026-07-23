import { chromium } from 'playwright';

const baseURL = process.env.SITE_URL ?? 'http://127.0.0.1:4321';
const executablePath = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const viewports = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

const failures = [];
const browser = await chromium.launch({ executablePath, headless: true });

function fail(context, message) {
  failures.push(`${context}: ${message}`);
}

async function auditPage(path, viewport, javaScriptEnabled = true, expectedStatus = 200) {
  const contextName = `${path} ${viewport.width}x${viewport.height}${javaScriptEnabled ? '' : ' no-js'}`;
  const page = await browser.newPage({ viewport, javaScriptEnabled });
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  const response = await page.goto(`${baseURL}${path}`, { waitUntil: 'networkidle' });
  if (response?.status() !== expectedStatus) {
    fail(contextName, `expected ${expectedStatus}, received ${response?.status()}`);
  }

  const result = await page.evaluate(() => {
    const essential = [...document.querySelectorAll('h1, #main-content > article, #main-content > section, [data-reveal]')];
    const hiddenEssential = essential.filter((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0 || rect.width === 0;
    });
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      h1Count: document.querySelectorAll('h1').length,
      hiddenEssential: hiddenEssential.length,
      emptyLinks: [...document.querySelectorAll('a')].filter(
        (link) =>
          !link.textContent?.trim() &&
          !link.getAttribute('aria-label') &&
          !link.querySelector('img[alt]:not([alt=""])')
      ).length,
    };
  });

  if (result.overflow > 1) fail(contextName, `horizontal overflow of ${result.overflow}px`);
  if (result.h1Count !== 1) fail(contextName, `expected one h1, found ${result.h1Count}`);
  if (result.hiddenEssential > 0) fail(contextName, `${result.hiddenEssential} essential elements are hidden`);
  if (result.emptyLinks > 0) fail(contextName, `${result.emptyLinks} links have no accessible name`);
  for (const error of consoleErrors) {
    if (expectedStatus < 400 || !error.includes('Failed to load resource')) {
      fail(contextName, `console error: ${error}`);
    }
  }

  if (path === '/') {
    const booking = page.locator('main a[href*="cal.com/hamishburke"]');
    const work = page.locator('main a[href="/work"]');
    if ((await booking.count()) < 1) fail(contextName, 'missing Book a call action');
    if ((await work.count()) < 1) fail(contextName, 'missing Work action');
  }

  await page.close();
}

for (const viewport of viewports) {
  for (const path of ['/', '/work', '/about']) {
    await auditPage(path, viewport);
  }
}

for (const path of ['/', '/work', '/work/gpu-share', '/about']) {
  await auditPage(path, { width: 390, height: 844 }, false);
}

const modePage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await modePage.emulateMedia({ reducedMotion: 'reduce' });
await modePage.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
const modeResult = await modePage.evaluate(() => {
  document.documentElement.style.zoom = '2';
  const clippedControls = [...document.querySelectorAll('h1, a, button')].filter((element) => {
    const rect = element.getBoundingClientRect();
    return rect.left < -1 || rect.right > window.innerWidth + 1;
  });
  const infiniteAnimations = [...document.querySelectorAll('*')].filter(
    (element) => getComputedStyle(element).animationIterationCount === 'infinite'
  );
  return {
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    clippedControls: clippedControls.length,
    infiniteAnimations: infiniteAnimations.length,
  };
});
if (modeResult.overflow > 1) fail('homepage 200% zoom', `horizontal overflow of ${modeResult.overflow}px`);
if (modeResult.clippedControls > 0) fail('homepage 200% zoom', `${modeResult.clippedControls} headings or controls are clipped`);
if (modeResult.infiniteAnimations > 0) fail('homepage reduced motion', `${modeResult.infiniteAnimations} permanent animations remain`);
await modePage.close();

const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
const touchPage = await touchContext.newPage();
await touchPage.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
const smallHeaderTargets = await touchPage.locator('#site-header a, #site-header summary').evaluateAll((elements) =>
  elements.filter((element) => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
  }).length
);
if (smallHeaderTargets > 0) fail('homepage coarse pointer', `${smallHeaderTargets} header targets are smaller than 44px`);
await touchContext.close();

for (const path of [
  '/posts/splitting-the-stack-and-making-setup-actually-work',
  '/projects/otto',
  '/reports/wildfire-analysis-with-pyspark',
  '/cv',
  '/writing',
  '/reading',
  '/tags/ai',
]) {
  await auditPage(path, { width: 390, height: 844 });
}
await auditPage('/404', { width: 390, height: 844 }, true, 404);

const request = await browser.newPage();
const routeExpectations = [
  ['/projects', 301, '/work'],
  ['/tools', 301, '/work'],
  ['/projects/brontehf', 301, '/work/brontehf'],
  ['/posts/gpu-share', 301, '/posts/building-a-private-ai-server-for-friends'],
  ['/projects/wiki-router', 410],
  ['/reports/a-survey-of-nosql-databases-and-polyglot-persistence-patterns', 410],
];

for (const [path, status, location] of routeExpectations) {
  const response = await request.request.get(`${baseURL}${path}`, { maxRedirects: 0 });
  if (response.status() !== status) fail(path, `expected ${status}, received ${response.status()}`);
  if (location && response.headers().location !== location) {
    fail(path, `expected location ${location}, received ${response.headers().location}`);
  }
}

const otto = await request.request.get(`${baseURL}/projects/otto`);
if (otto.headers()['x-robots-tag'] !== 'noindex, nofollow') {
  fail('/projects/otto', 'missing noindex response header');
}

await request.close();
await browser.close();

if (failures.length > 0) {
  console.error(`Site audit failed (${failures.length}):\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
  process.exit(1);
}

console.log(`Site audit passed: ${viewports.length} viewports, core no-JS pages, retained routes, redirects, 410s, and Otto noindex.`);
