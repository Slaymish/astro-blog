import assert from 'node:assert/strict';
import test from 'node:test';
import {
  type WorkStory,
  artifactHref,
  validateWorkStories,
  workStoryHref
} from '../src/lib/work';
import { legacyRoutePolicy } from '../src/lib/legacyRoutes';

function story(overrides: Partial<WorkStory> = {}): WorkStory {
  return {
    id: 'workStory-one',
    title: 'Example',
    descriptor: 'Example system',
    slug: 'example',
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
    body: [],
    primaryArtifact: {
      id: 'project-one',
      type: 'project',
      title: 'Example project',
      slug: 'example-project'
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

test('validateWorkStories rejects duplicate order, slug, and artifact assignments', () => {
  const duplicate = story({ id: 'workStory-two' });
  duplicate.supportingArtifacts = [
    {
      id: 'project-one',
      type: 'project',
      title: 'Repeated project',
      slug: 'example-project'
    }
  ];

  assert.deepEqual(validateWorkStories([story(), duplicate]), [
    'Duplicate story order: 1',
    'Duplicate story slug: example',
    'Artifact project-one is assigned more than once'
  ]);
});

test('story and artifact URLs preserve their canonical route families', () => {
  assert.equal(workStoryHref('gpu-share'), '/work/gpu-share');
  assert.equal(artifactHref({ id: 'p', type: 'project', title: 'P', slug: 'p' }), '/projects/p');
  assert.equal(artifactHref({ id: 'a', type: 'post', title: 'A', slug: 'a' }), '/posts/a');
  assert.equal(artifactHref({ id: 'r', type: 'report', title: 'R', slug: 'r' }), '/reports/r');
});

test('legacy work routes redirect successors, retire archives, and preserve source material', () => {
  assert.deepEqual(legacyRoutePolicy('project', 'brontehf'), {
    action: 'redirect',
    destination: '/work/brontehf'
  });
  assert.deepEqual(legacyRoutePolicy('post', 'gpu-share'), {
    action: 'redirect',
    destination: '/work/gpu-share'
  });
  assert.deepEqual(legacyRoutePolicy('project', 'wiki-router'), { action: 'gone' });
  assert.deepEqual(
    legacyRoutePolicy('report', 'a-survey-of-nosql-databases-and-polyglot-persistence-patterns'),
    { action: 'gone' }
  );
  assert.deepEqual(legacyRoutePolicy('project', 'otto'), { action: 'unlisted' });
  assert.equal(legacyRoutePolicy('post', 'healthagent-apple-health-data-ingestion-and-insights'), null);
  assert.equal(legacyRoutePolicy('report', 'wildfire-analysis-with-pyspark'), null);
});
