import assert from 'node:assert/strict';
import test from 'node:test';
import { MAX_EVENTS, NAME_PATTERN, PATH_PATTERN, cleanEvents } from '../src/lib/analytics';
import {
  ANALYTICS_EVENT_NAMES,
  SCROLL_MILESTONES,
  createSequenceBuffer,
  cvEventName,
  outboundDestination,
  scrollDepthPercent,
  sharePlatform
} from '../src/lib/shell/analyticsTracker';

const START = 1_700_000_000_000;

/** A plausible session: the pageview, three milestones, and the exit pair. */
function exampleSession(path = '/work/gpu-share') {
  const buffer = createSequenceBuffer(path, START);
  buffer.push('scroll-depth', START + 1_200);
  buffer.push('work-view', START + 4_500);
  buffer.push('scroll-depth-final', START + 30_000);
  buffer.push('time-on-page', START + 30_001);
  return buffer;
}

test('the buffer opens with the pageview event the server expects', () => {
  assert.deepEqual(createSequenceBuffer('/writing', START).events, [{ t: 0, p: '/writing' }]);
});

test('offsets are milliseconds since the session started, not wall-clock times', () => {
  assert.deepEqual(exampleSession().events[1], {
    t: 1_200,
    p: '/work/gpu-share',
    n: 'scroll-depth'
  });
});

// The point of the module: the client that produces the beacon and the server
// that validates it share one definition, so a sequence the client built can
// never be silently reshaped on arrival.
test('a sequence built by the client survives cleanEvents unchanged', () => {
  const { events } = exampleSession();

  assert.deepEqual(cleanEvents(events), events);
});

test('the client cap is MAX_EVENTS itself, not a second copy of the number', () => {
  const buffer = createSequenceBuffer('/writing', START);
  for (let i = 0; i < MAX_EVENTS * 3; i += 1) {
    buffer.push('scroll-depth', START + i);
  }

  assert.equal(buffer.events.length, MAX_EVENTS);
  // A full buffer is exactly what the server accepts: nothing is truncated.
  assert.equal(cleanEvents(buffer.events).length, MAX_EVENTS);
});

test('every event name the tracker can emit passes the server name pattern', () => {
  for (const name of ANALYTICS_EVENT_NAMES) {
    assert.ok(NAME_PATTERN.test(name), `${name} would be dropped by cleanEvents`);
  }
});

test('event names are unique', () => {
  assert.equal(new Set(ANALYTICS_EVENT_NAMES).size, ANALYTICS_EVENT_NAMES.length);
});

test('the paths the tracker writes pass the server path pattern', () => {
  for (const path of ['/', '/writing', '/work/gpu-share', '/posts/some-post-slug', '/cv']) {
    const [pageview] = createSequenceBuffer(path, START).events;
    assert.ok(PATH_PATTERN.test(pageview.p), `${path} would be dropped by cleanEvents`);
  }
});

test('scroll depth is a whole percentage, and null when the page cannot scroll', () => {
  assert.equal(scrollDepthPercent(0, 1000), 0);
  assert.equal(scrollDepthPercent(507, 1000), 51);
  assert.equal(scrollDepthPercent(1000, 1000), 100);
  assert.equal(scrollDepthPercent(0, 0), null);
  assert.equal(scrollDepthPercent(10, -40), null);
});

test('every scroll milestone is reachable from a real scroll position', () => {
  for (const milestone of SCROLL_MILESTONES) {
    assert.equal(scrollDepthPercent(milestone * 10, 1000), milestone);
  }
});

test('share links are attributed to the right network', () => {
  assert.equal(sharePlatform('https://twitter.com/intent/tweet?url=x'), 'twitter');
  assert.equal(sharePlatform('https://x.com/intent/tweet?url=x'), 'twitter');
  assert.equal(sharePlatform('https://www.linkedin.com/share?url=x'), 'linkedin');
  assert.equal(sharePlatform('https://example.com/share'), 'unknown');
});

test('outbound clicks are counted only for the two destinations that matter', () => {
  assert.equal(outboundDestination('https://github.com/slaymish'), 'github');
  assert.equal(outboundDestination('https://www.linkedin.com/in/hamish'), 'linkedin');
  assert.equal(outboundDestination('https://cdn.sanity.io/files/x.pdf'), null);
});

test('a CV link is a download only when its label says so', () => {
  assert.equal(cvEventName('Download CV'), 'cv-download');
  assert.equal(cvEventName('download the pdf'), 'cv-download');
  assert.equal(cvEventName('View CV'), 'cv-view');
});
