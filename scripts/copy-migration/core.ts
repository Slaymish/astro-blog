import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

export type Document = Record<string, any> & { _id: string; _type: string; _rev: string };
export type Value = { exists: boolean; value?: any };
export type FieldChange = { field: string; before: Value; after: Value; findingIds: number[]; selectors?: string[] };
export type DocumentChange = { id: string; type: string; fields: FieldChange[]; guard?: Record<string, Value> };
export type Manifest = { version: number; projectId: string; dataset: string; findings: any[]; documents: DocumentChange[]; sourceChecks?: { path: string; sha256: string; findingIds: number[] }[] };
export type PlannedDocument = { id: string; revision: string; fields: FieldChange[] };

export const fingerprint = (bytes: string) => createHash('sha256').update(bytes).digest('hex');
export const valueAt = (document: Record<string, any>, field: string): Value =>
  Object.hasOwn(document, field) ? { exists: true, value: document[field] } : { exists: false };
export const equal = (first: unknown, second: unknown) => isDeepStrictEqual(first, second);

export function validateManifest(manifest: Manifest) {
  if (manifest.version !== 1 || manifest.findings.length !== 86 || new Set(manifest.findings.map(finding => finding.id)).size !== 86) {
    throw new Error('Manifest must cover all 86 unique findings');
  }
  if (new Set(manifest.documents.map(document => document.id)).size !== manifest.documents.length) throw new Error('Duplicate document targets');
  for (const document of manifest.documents) {
    if (document.id.startsWith('drafts.') || document.id.startsWith('versions.') ||
        new Set(document.fields.map(field => field.field)).size !== document.fields.length) throw new Error('Unsafe or duplicate field target');
    for (const field of document.fields) {
      if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(field.field) || !field.findingIds.length ||
          field.findingIds.some(id => !manifest.findings.some(finding => finding.id === id && finding.disposition === 'CMS' &&
            finding.targets.some((target: any) => target.documentId === document.id)))) throw new Error('Mutation is outside approved CMS finding targets');
    }
  }
}

export function replaceOnce(current: string, before: string, after: string): string {
  if (!before || current.split(before).length !== 2) throw new Error('Expected exactly one original text match');
  return current.replace(before, () => after);
}

export function replaceBlock(block: any, before: string, after: string): any {
  if (block._type !== 'block' || !Array.isArray(block.children) ||
      block.children.some((child: any) => child._type !== 'span') ||
      block.children.map((child: any) => child.text).join('') !== before) {
    throw new Error('Portable Text block differs from approved original');
  }
  const result = structuredClone(block);
  const anchors = result.children.filter((child: any) => child.marks?.length);
  let remainder = after;
  let childIndex = 0;
  for (const anchor of [...anchors, null]) {
    const position = anchor ? remainder.indexOf(anchor.text) : remainder.length;
    if (position < 0 || (anchor && remainder.indexOf(anchor.text, position + anchor.text.length) >= 0)) {
      throw new Error('Marked text must survive uniquely and in order');
    }
    const gap = remainder.slice(0, position);
    const unmarked = [];
    while (childIndex < result.children.length && !result.children[childIndex].marks?.length) {
      unmarked.push(result.children[childIndex++]);
    }
    if (!unmarked.length && gap) throw new Error('Cannot move text across a marked span');
    unmarked.forEach((child, index) => { child.text = index === 0 ? gap : ''; });
    if (anchor) {
      childIndex++;
      remainder = remainder.slice(position + anchor.text.length);
    }
  }
  return result;
}

export function planMigration(manifest: Manifest, documents: Document[], draftsVerified: boolean) {
  const changes: PlannedDocument[] = [];
  const records: { id: string; status: string; reason?: string; findingIds: number[] }[] = [];
  const byId = new Map(documents.map(document => [document._id, document]));
  for (const target of manifest.documents) {
    const findingIds = [...new Set(target.fields.flatMap(field => field.findingIds))];
    const document = byId.get(target.id);
    const versionExists = documents.some(candidate => candidate._id === `drafts.${target.id}` ||
      (candidate._id.startsWith('versions.') && candidate._id.endsWith(`.${target.id}`)));
    let reason = !document ? 'Published document missing' : document._type !== target.type ? 'Document type changed' :
      !document._rev ? 'Revision missing' : !draftsVerified ? 'Authenticated raw drafts/release read required' :
      versionExists ? 'Draft or release version exists; reconcile in Studio, never auto publish' : undefined;
    const fields: FieldChange[] = [];
    if (!reason && document) {
      for (const field of target.fields) {
        const current = valueAt(document, field.field);
        if (equal(current, field.after)) continue;
        if (!equal(current, field.before)) { reason = `Exact original guard failed: ${field.field}`; break; }
        fields.push(field);
      }
      if (!reason) {
        for (const [field, expected] of Object.entries(target.guard ?? {})) {
          if (!equal(valueAt(document, field), expected)) { reason = `Rendering/source guard failed: ${field}`; break; }
        }
      }
    }
    const status = reason ? 'conflict' : fields.length ? 'ready' : 'already-applied';
    records.push({ id: target.id, status, reason, findingIds });
    if (status === 'ready') changes.push({ id: target.id, revision: document!._rev, fields });
  }
  return { records, changes };
}

export function patches(changes: PlannedDocument[]) {
  return changes.map(change => {
    const set: Record<string, any> = {};
    const unset: string[] = [];
    for (const field of change.fields) {
      if (field.after.exists) set[field.field] = field.after.value;
      else unset.push(field.field);
    }
    return { patch: { id: change.id, ifRevisionID: change.revision, set, ...(unset.length ? { unset } : {}) } };
  });
}

export type Backup = {
  version: number; projectId: string; dataset: string; manifestHash: string; transactionId: string;
  state: 'prepared' | 'applied'; changes: PlannedDocument[]; postRevisions?: Record<string, string>;
};

export function planRollback(backup: Backup, documents: Document[], draftsVerified: boolean) {
  if (backup.state !== 'applied' || !backup.postRevisions) throw new Error('Backup has no confirmed apply receipt');
  const changes: PlannedDocument[] = [];
  const conflicts: string[] = [];
  for (const change of backup.changes) {
    const document = documents.find(candidate => candidate._id === change.id);
    const versionExists = documents.some(candidate => candidate._id === `drafts.${change.id}` ||
      (candidate._id.startsWith('versions.') && candidate._id.endsWith(`.${change.id}`)));
    if (!draftsVerified || versionExists || !document || document._rev !== backup.postRevisions[change.id] ||
        change.fields.some(field => !equal(valueAt(document, field.field), field.after))) {
      conflicts.push(change.id);
      continue;
    }
    changes.push({ id: change.id, revision: document._rev,
      fields: change.fields.map(field => ({ ...field, before: field.after, after: field.before })) });
  }
  return { changes, conflicts };
}
