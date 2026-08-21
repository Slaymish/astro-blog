import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  type WorkStory,
  artifactHref,
  validateWorkStories,
  workStoryHref
} from '../src/lib/work';
import {
  type LegacyRoutePolicy,
  archivedProjects,
  contentPostSlug,
  legacyRoutePolicy,
  projectSuccessors
} from '../src/lib/legacyRoutes';

function story(overrides: Partial<WorkStory> = {}): WorkStory {
  return {
    id: 'workStory-one',
    title: 'Example',
    descriptor: 'Example system',
    slug: 'example',
    kind: 'professional',
    status: 'lead',
    order: 1,
    service: 'digital-products',
    date: '2026-01-01',
    summary: 'Built a useful example system.',
    problem: 'The example needed a reliable implementation.',
    role: 'Solo engineer.',
    interventions: ['Designed the system boundary.'],
    result: 'The system works and the limits are documented.',
    graphic: { kind: 'brontehf', alt: 'An example system diagram.' },
    primaryArtifact: {
      id: 'report-one',
      type: 'report',
      title: 'Example report',
      slug: 'example-report'
    },
    supportingArtifacts: [],
    ...overrides
  };
}

test('validateWorkStories accepts a complete unique collection', () => {
  const second = story({
    id: 'workStory-two',
    slug: 'second',
    order: 2,
    primaryArtifact: {
      id: 'report-two',
      type: 'report',
      title: 'Second report',
      slug: 'second-report'
    }
  });

  assert.deepEqual(validateWorkStories([story(), second]), []);
});

test('validateWorkStories reports incomplete glance content and intervention bounds', () => {
  const invalid = story({
    summary: '',
    interventions: [],
    graphic: { kind: 'brontehf', alt: '' }
  });

  assert.deepEqual(validateWorkStories([invalid]), [
    'Example: summary is required',
    'Example: interventions must contain 1 to 3 items',
    'Example: graphic alt text is required'
  ]);
});

test('validateWorkStories requires every reflection answer from an independent project', () => {
  const missingAll = story({ kind: 'independent' });

  assert.deepEqual(validateWorkStories([missingAll]), [
    'Example: question (what was the question) is required for independent projects',
    'Example: built (what did I build) is required for independent projects',
    'Example: learned (what did I learn) is required for independent projects',
    'Example: differently (what would I do differently) is required for independent projects'
  ]);
});

test('validateWorkStories treats a blank reflection answer as missing', () => {
  const blankOne = story({
    kind: 'independent',
    question: 'Could a home server run inference for a group of friends?',
    built: '   ',
    learned: 'Trust boundaries cost more design time than the inference path.',
    differently: 'Start with the auth model instead of retrofitting it.'
  });

  assert.deepEqual(validateWorkStories([blankOne]), [
    'Example: built (what did I build) is required for independent projects'
  ]);
});

test('validateWorkStories accepts a complete independent project and ignores the fields for professional work', () => {
  const complete = story({
    kind: 'independent',
    question: 'Could a home server run inference for a group of friends?',
    built: 'A GPU-sharing service with per-user quotas.',
    learned: 'Trust boundaries cost more design time than the inference path.',
    differently: 'Start with the auth model instead of retrofitting it.'
  });

  // The professional default carries none of the four and must still validate.
  assert.deepEqual(validateWorkStories([complete]), []);
  assert.deepEqual(validateWorkStories([story()]), []);
});

test('validateWorkStories rejects duplicate order, slug, and artifact assignments', () => {
  const duplicate = story({ id: 'workStory-two' });
  duplicate.supportingArtifacts = [
    {
      id: 'report-one',
      type: 'report',
      title: 'Repeated report',
      slug: 'example-report'
    }
  ];

  assert.deepEqual(validateWorkStories([story(), duplicate]), [
    'Duplicate story order: 1',
    'Duplicate story slug: example',
    'Artifact report-one is assigned more than once'
  ]);
});

test('story and artifact URLs preserve their canonical route families', () => {
  assert.equal(workStoryHref('gpu-share'), '/work/gpu-share');
  assert.equal(artifactHref({ id: 'a', type: 'post', title: 'A', slug: 'a' }), '/posts/a');
  assert.equal(
    artifactHref({ id: 'gpu-post', type: 'post', title: 'GPUShare post', slug: 'gpu-share' }),
    '/posts/building-a-private-ai-server-for-friends'
  );
  assert.equal(artifactHref({ id: 'r', type: 'report', title: 'R', slug: 'r' }), '/reports/r');
});

test('canonical post aliases resolve to the original Sanity content slug', () => {
  assert.equal(contentPostSlug('building-a-private-ai-server-for-friends'), 'gpu-share');
  assert.equal(contentPostSlug('ordinary-post'), 'ordinary-post');
});

test('legacy work routes redirect successors, retire archives, and preserve source material', () => {
  assert.deepEqual(legacyRoutePolicy('project', 'brontehf'), {
    action: 'redirect',
    destination: '/work/brontehf'
  });
  assert.deepEqual(legacyRoutePolicy('post', 'gpu-share'), {
    action: 'redirect',
    destination: '/posts/building-a-private-ai-server-for-friends'
  });
  assert.deepEqual(legacyRoutePolicy('project', 'wiki-router'), { action: 'gone' });
  assert.deepEqual(
    legacyRoutePolicy('report', 'a-survey-of-nosql-databases-and-polyglot-persistence-patterns'),
    { action: 'gone' }
  );
  assert.deepEqual(legacyRoutePolicy('project', 'otto'), { action: 'gone' });
  assert.equal(legacyRoutePolicy('post', 'healthagent-apple-health-data-ingestion-and-insights'), null);
  assert.equal(legacyRoutePolicy('report', 'wildfire-analysis-with-pyspark'), null);
});

test('the retired unlisted action is no longer part of the policy union', () => {
  // F-024: `unlisted` was implemented by setting X-Robots-Tag from a prerendered
  // route, which is a no-op, so the page it guarded was always indexable. The
  // annotation below fails `astro check` if the variant is ever reinstated.
  type PolicyAction = NonNullable<LegacyRoutePolicy>['action'];
  const admitsUnlisted: 'unlisted' extends PolicyAction ? true : false = false;
  assert.equal(admitsUnlisted, false);

  const actions = ['brontehf', 'otto', 'wiki-router', 'unknown-slug'].map(
    (slug) => legacyRoutePolicy('project', slug)?.action ?? null
  );
  assert.deepEqual(actions, ['redirect', 'gone', 'gone', null]);
});

test('every retired project slug has a matching netlify.toml rule', () => {
  // The policy table and the redirect rules are mirrored by repo convention and
  // nothing else enforces it, so drift here is silent until a URL misbehaves.
  const netlifyToml = readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8');

  const rule = (from: string, to: string, status: number) =>
    `[[redirects]]\n  from = "${from}"\n  to = "${to}"\n  status = ${status}\n  force = true`;

  for (const [slug, destination] of Object.entries(projectSuccessors)) {
    if (!netlifyToml.includes(rule(`/projects/${slug}`, destination, 301))) {
      assert.fail(`netlify.toml is missing a 301 from /projects/${slug} to ${destination}`);
    }
  }

  for (const slug of archivedProjects) {
    if (!netlifyToml.includes(rule(`/projects/${slug}`, '/410.html', 410))) {
      assert.fail(`netlify.toml is missing a 410 for /projects/${slug}`);
    }
  }
});
