import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fingerprint, planMigration, planRollback, patches, replaceBlock, replaceOnce, valueAt,
  validateManifest, type Document, type Manifest, type Backup } from '../scripts/copy-migration/core';
import { normalizeAboutPage, normalizeWritingPage } from '../src/lib/pageContentShape';
import { normalizeWorkStory, validateWorkStories, type WorkStory } from '../src/lib/work';

const bytes = readFileSync(new URL('../scripts/copy-migration/approved.json', import.meta.url), 'utf8');
const manifest = JSON.parse(bytes) as Manifest;
function originals(): Document[] {
  return manifest.documents.map(target => {
    const document: Document = { _id: target.id, _type: target.type, _rev: 'before' };
    for (const field of target.fields) if (field.before.exists) document[field.field] = structuredClone(field.before.value);
    for (const [field, value] of Object.entries(target.guard ?? {})) if (value.exists) document[field] = structuredClone(value.value);
    return document;
  });
}
function applied(documents: Document[]) {
  const result = structuredClone(documents);
  for (const change of planMigration(manifest, documents, true).changes) {
    const document = result.find(document => document._id === change.id)!;
    document._rev = 'after';
    for (const field of change.fields) {
      if (field.after.exists) document[field.field] = structuredClone(field.after.value);
      else delete document[field.field];
    }
  }
  return result;
}

test('all 86 approved findings have explicit coverage and frozen mutation targets', () => {
  validateManifest(manifest);
  assert.equal(manifest.findings.length, 86);
  assert.deepEqual(manifest.findings.map(finding => finding.id), Array.from({ length: 86 }, (_, index) => index + 1));
  for (const finding of manifest.findings) {
    assert.ok(['CMS', 'source', 'keep', 'factual-dependency'].includes(finding.disposition));
    assert.ok(finding.action && finding.targets.length);
    if (finding.disposition === 'CMS') assert.ok(manifest.documents.some(target => target.fields.some(field => field.findingIds.includes(finding.id))));
    if (finding.disposition === 'factual-dependency') assert.ok(!manifest.documents.some(target => target.fields.some(field => field.findingIds.includes(finding.id))));
  }
});

test('duplicate fields and cross-document About targets are rejected', () => {
  const duplicate = structuredClone(manifest);
  duplicate.documents[0].fields.push(duplicate.documents[0].fields[0]);
  assert.throws(() => validateManifest(duplicate));
  const crossTarget = structuredClone(manifest);
  const about = crossTarget.documents.find(document => document.id === 'aboutPage')!;
  crossTarget.documents.find(document => document.id === 'writingIndexPage')!.fields.push(about.fields.find(field => field.field === 'portrait')!);
  assert.throws(() => validateManifest(crossTarget));
  const writing = manifest.documents.find(document => document.id === 'writingIndexPage')!;
  assert.deepEqual(writing.fields.map(field => field.field), ['hero']);
  assert.equal(writing.fields[0].after.value.eyebrow, 'Writing');
  assert.ok(manifest.documents.find(document => document.id === 'aboutPage')!.fields.some(field => field.field === 'hero'));
});

test('exact originals plan, then repeat run does nothing', () => {
  const documents = originals();
  const first = planMigration(manifest, documents, true);
  assert.equal(first.changes.length, manifest.documents.length);
  assert.ok(first.records.every(record => record.status === 'ready'));
  const second = planMigration(manifest, applied(documents), true);
  assert.equal(second.changes.length, 0);
  assert.ok(second.records.every(record => record.status === 'already-applied'));
});

test('partial already-applied fields are skipped within a document', () => {
  const documents = originals();
  const target = manifest.documents.find(target => target.fields.length > 1)!;
  documents.find(document => document._id === target.id)![target.fields[0].field] = structuredClone(target.fields[0].after.value);
  const change = planMigration(manifest, documents, true).changes.find(change => change.id === target.id)!;
  assert.equal(change.fields.length, target.fields.length - 1);
});

test('changed original value conflicts whole document, unrelated fields are preserved', () => {
  const documents = originals();
  documents[0].unrelated = { editedLater: true };
  const plan = planMigration(manifest, documents, true);
  const mutation = patches(plan.changes).find(mutation => mutation.patch.id === documents[0]._id)!;
  assert.equal(mutation.patch.ifRevisionID, 'before');
  assert.ok(!Object.hasOwn(mutation.patch.set, 'unrelated'));
  assert.deepEqual(documents[0].unrelated, { editedLater: true });
  documents[0][manifest.documents[0].fields[0].field] = 'Editor changed this';
  assert.equal(planMigration(manifest, documents, true).records[0].status, 'conflict');
});

test('draft/release versions block published mutations and unauthenticated reads fail closed', () => {
  for (const id of ['drafts.', 'versions.release.']) {
    const documents = originals();
    documents.push({ ...documents[0], _id: id + documents[0]._id });
    assert.equal(planMigration(manifest, documents, true).records[0].status, 'conflict');
  }
  assert.equal(planMigration(manifest, originals(), false).changes.length, 0);
});

test('new narrative conflicts even when body edits are already applied', () => {
  const documents = applied(originals());
  const story = documents.find(document => document._type === 'workStory')!;
  story.narrative = [{ _key: 'later', text: 'Different public copy' }];
  assert.equal(planMigration(manifest, documents, true).records.find(record => record.id === story._id)?.status, 'conflict');
});

test('Portable Text preserves Alphero link, block/span keys, marks and all unrelated metadata', () => {
  const field = manifest.documents.find(target => target.id === 'aboutPage')!.fields.find(field => field.field === 'largeCopy')!;
  const block = field.before.value[0];
  const row = manifest.findings.find(finding => finding.id === 8);
  const output = replaceBlock(block, row.original, row.replacement);
  assert.equal(output._key, block._key);
  assert.deepEqual(output.markDefs, block.markDefs);
  assert.deepEqual(output.children.map((span: any) => [span._key, span.marks]), block.children.map((span: any) => [span._key, span.marks]));
  assert.equal(output.children.find((span: any) => span.marks.length).text, 'Alphero');
  assert.equal(output.children.map((span: any) => span.text).join(''), row.replacement);
});

test('marked span removal, duplication and reorder are refused', () => {
  const block = { _key: 'block', _type: 'block', markDefs: [], children: [
    { _key: 'start', _type: 'span', text: 'before ', marks: [] },
    { _key: 'alpha', _type: 'span', text: 'alpha', marks: ['code'] },
    { _key: 'middle', _type: 'span', text: ' then ', marks: [] },
    { _key: 'beta', _type: 'span', text: 'beta', marks: ['code'] },
    { _key: 'end', _type: 'span', text: ' after', marks: [] }
  ] };
  for (const replacement of ['before alpha after', 'beta then alpha', 'alpha alpha then beta']) {
    assert.throws(() => replaceBlock(block, 'before alpha then beta after', replacement));
  }
  assert.throws(() => replaceOnce('twice twice', 'twice', 'one'));
});

test('backup receipt rollback only restores changed fields at exact post revisions', () => {
  const documents = originals();
  const changes = planMigration(manifest, documents, true).changes;
  const after = applied(documents);
  const receipt: Backup = { version: 1, projectId: manifest.projectId, dataset: manifest.dataset,
    manifestHash: fingerprint(bytes), transactionId: 'transaction', state: 'applied', changes,
    postRevisions: Object.fromEntries(after.map(document => [document._id, document._rev])) };
  const rollback = planRollback(receipt, after, true);
  assert.equal(rollback.changes.length, changes.length);
  assert.deepEqual(rollback.conflicts, []);
  assert.equal(patches(rollback.changes)[0].patch.ifRevisionID, 'after');
  for (const change of rollback.changes) for (const field of change.fields) {
    assert.deepEqual(field.after, changes.find(candidate => candidate.id === change.id)!.fields.find(candidate => candidate.field === field.field)!.before);
  }
  after[0]._rev = 'editor-after';
  assert.ok(planRollback(receipt, after, true).conflicts.includes(after[0]._id));
  assert.throws(() => planRollback({ ...receipt, state: 'prepared' }, after, true));
  assert.equal(planRollback(receipt, after, false).changes.length, 0);
});

test('absent field differs from null and rollback preserves absent fields through unset', () => {
  assert.notDeepEqual(valueAt({}, 'missing'), valueAt({ missing: null }, 'missing'));
  const change = { id: 'doc', revision: 'post', fields: [{ field: 'added', before: { exists: true, value: 'text' }, after: { exists: false }, findingIds: [7] }] };
  assert.deepEqual(patches([change])[0].patch.unset, ['added']);
});

test('page adapters preserve CMS precedence and do not invent missing core content', () => {
  const document = { intro: 'Flat intro', portraitAlt: 'Existing portrait', largeCopy: [{}], seo: { title: 'About', description: 'Description' }, background: { paragraphs: ['Existing background'] } };
  assert.equal(normalizeAboutPage(document).hero.intro, 'Flat intro');
  assert.equal(normalizeAboutPage({ ...document, hero: { intro: 'CMS canonical intro' } }).hero.intro, 'CMS canonical intro');
  assert.throws(() => normalizeAboutPage({}));
  assert.equal(normalizeWritingPage({ hero: { intro: 'Existing intro', headlineLines: ['Writing'] } }).filterLabel, 'Filter by tag');
  assert.throws(() => normalizeWritingPage({}));
});

test('The City adapter uses its own cover and existing headings, retaining duplicate-order validation', () => {
  const raw = { id: 'workStory-the-city', slug: 'the-city', title: 'The City', order: 0, summary: 'Existing summary',
    kind: 'independent', cover: { alt: 'Existing City image', imageUrl: 'https://cdn.sanity.io/images/qnuj1c4o/production/city.png' },
    body: [{ style: 'h2', children: [{ text: 'Existing technical decision' }] }], supportingArtifacts: [] } as unknown as WorkStory;
  const normalized = normalizeWorkStory(raw);
  assert.equal(normalized.graphic.kind, 'the-city');
  assert.deepEqual(normalized.interventions, ['Existing technical decision']);
  assert.deepEqual(validateWorkStories([normalized]), []);
  assert.ok(validateWorkStories([normalized, { ...normalized, id: 'other', slug: 'other' }]).includes('Duplicate story order: 0'));
  assert.ok(validateWorkStories([{ ...normalized, graphic: { kind: 'the-city', alt: 'City' } }]).some(message => message.includes('cover image')));
});
