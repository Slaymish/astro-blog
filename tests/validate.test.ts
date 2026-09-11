import assert from 'node:assert/strict';
import test from 'node:test';
import { validatePosts, validateReports, validateWorkStories } from '../src/content/validate';
import type { Post, Report, WorkStory } from '../src/content/types';

const asset = {
  _id: 'image-a',
  url: 'https://cdn.sanity.io/images/p/d/a-100x100.png',
  width: 100,
  height: 100,
};

const story = (overrides: Partial<WorkStory> = {}): WorkStory =>
  ({
    _id: 'story-1',
    title: 'A story',
    descriptor: 'A thing',
    slug: 'a-story',
    kind: 'independent',
    order: 1,
    date: '2026-01-01',
    summary: 'A summary',
    introduction: 'An introduction',
    role: 'A role',
    body: [],
    result: 'A result',
    links: [],
    cover: { kind: 'image', alt: 'Alt text', image: { asset } },
    evidence: [],
    artifacts: [],
    related: [],
    ...overrides,
  }) as WorkStory;

test('a complete set of stories produces no errors', () => {
  assert.deepEqual(validateWorkStories([story(), story({ _id: 's2', slug: 'b', order: 2 })]), []);
});

test('duplicate orders and slugs are both reported', () => {
  const errors = validateWorkStories([story(), story({ _id: 's2' })]);
  assert(errors.includes('duplicate order 1'));
  assert(errors.includes('duplicate slug "a-story"'));
});

test('each required prose field is named when it is empty', () => {
  for (const field of ['introduction', 'summary', 'result', 'role'] as const) {
    const errors = validateWorkStories([story({ [field]: '   ' } as Partial<WorkStory>)]);
    assert(errors.includes(`a-story: ${field} is empty`), `${field} not reported`);
  }
});

test('a missing cover, empty alt, assetless image and incomplete figure are each reported', () => {
  assert(validateWorkStories([story({ cover: undefined as never })]).includes('a-story: cover is missing'));
  assert(
    validateWorkStories([story({ cover: { kind: 'image', alt: '', image: { asset } } })]).includes(
      'a-story: cover.alt is empty',
    ),
  );
  assert(
    validateWorkStories([story({ cover: { kind: 'image', alt: 'Alt', image: undefined as never } })]).includes(
      'a-story: image cover has no asset',
    ),
  );
  const figureErrors = validateWorkStories([
    story({ cover: { kind: 'figure', alt: 'Alt', figure: { title: '', facts: [] } } as never }),
  ]);
  assert(figureErrors.includes('a-story: figure cover has no title'));
  assert(figureErrors.includes('a-story: figure cover has no facts'));
});

test('a link missing its parts, or external without the flag, is reported', () => {
  assert(
    validateWorkStories([story({ links: [{ label: '', href: '/a' }] })]).includes(
      'a-story: a link is missing its label or href',
    ),
  );
  assert(
    validateWorkStories([story({ links: [{ label: 'Site', href: 'https://example.com' }] })]).includes(
      'a-story: link "Site" is external but not marked external',
    ),
  );
  assert.deepEqual(
    validateWorkStories([story({ links: [{ label: 'Site', href: 'https://example.com', external: true }] })]),
    [],
  );
});

test('evidence needs both an asset and alt text', () => {
  const errors = validateWorkStories([
    story({ evidence: [{ image: undefined as never, alt: '' }] }),
  ]);
  assert(errors.includes('a-story: an evidence item has no asset'));
  assert(errors.includes('a-story: an evidence item has no alt text'));
});

const post = (overrides: Partial<Post> = {}): Post =>
  ({
    _id: 'post-1',
    title: 'A post',
    slug: 'a-post',
    publishedAt: '2026-01-01',
    excerpt: 'An excerpt',
    tags: [],
    markdownBody: 'Body',
    related: [],
    ...overrides,
  }) as Post;

test('posts need an excerpt, a body, unique slugs and alt text on any cover', () => {
  assert.deepEqual(validatePosts([post()]), []);
  assert(validatePosts([post({ excerpt: '' })]).includes('a-post: excerpt is empty'));
  assert(validatePosts([post({ markdownBody: '' })]).includes('a-post: markdownBody is empty'));
  assert(validatePosts([post(), post({ _id: 'p2' })]).includes('duplicate slug "a-post"'));
  assert(
    validatePosts([post({ coverImage: { asset } })]).includes('a-post: cover image has no alt text'),
  );
  assert.deepEqual(validatePosts([post({ coverImage: { asset, alt: 'Alt' } })]), []);
});

const report = (overrides: Partial<Report> = {}): Report =>
  ({
    _id: 'report-1',
    title: 'A report',
    slug: 'a-report',
    publishedAt: '2026-01-01',
    description: 'A description',
    tags: [],
    pdfUrl: 'https://cdn.sanity.io/files/p/d/a.pdf',
    pdfBytes: 1000,
    related: [],
    ...overrides,
  }) as Report;

test('reports need a description and a resolvable PDF', () => {
  assert.deepEqual(validateReports([report()]), []);
  assert(validateReports([report({ description: '' })]).includes('a-report: description is empty'));
  assert(validateReports([report({ pdfUrl: '' })]).includes('a-report: pdfUrl is empty'));
});
