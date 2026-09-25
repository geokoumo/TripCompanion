import { describe, expect, it } from 'vitest';
import { documentBelongsToSource, retagDocuments } from './relatedTo';
import type { Document } from '../types';

function makeDoc(overrides: Partial<Document> = {}): Document {
  return { id: 'd1', category: 'other', title: 'file.pdf', relatedTo: 'Hotel Roma', fileType: 'pdf', storagePath: 'p', uploadedAt: '2026-09-01', ...overrides };
}

describe('documentBelongsToSource (F-11)', () => {
  it('matches by stable sourceId when the document has one, regardless of its (possibly stale) relatedTo label', () => {
    const doc = makeDoc({ sourceType: 'stay', sourceId: 's1', relatedTo: 'Old Name' });
    expect(documentBelongsToSource(doc, 'stay', 's1', 'Completely Different Label')).toBe(true);
  });

  it('does not match a different sourceId even if the relatedTo label happens to collide', () => {
    const doc = makeDoc({ sourceType: 'stay', sourceId: 's1', relatedTo: 'Hotel Roma' });
    expect(documentBelongsToSource(doc, 'stay', 's2', 'Hotel Roma')).toBe(false);
  });

  it('does not match a different sourceType with the same id', () => {
    const doc = makeDoc({ sourceType: 'stay', sourceId: 'x1' });
    expect(documentBelongsToSource(doc, 'booking', 'x1', 'Hotel Roma')).toBe(false);
  });

  it('falls back to the relatedTo label match for a document with no sourceId (legacy or free-text-added)', () => {
    const doc = makeDoc({ sourceType: undefined, sourceId: undefined, relatedTo: 'Hotel Roma' });
    expect(documentBelongsToSource(doc, 'stay', 's1', 'Hotel Roma')).toBe(true);
    expect(documentBelongsToSource(doc, 'stay', 's1', 'Something Else')).toBe(false);
  });
});

describe('retagDocuments', () => {
  it('repoints every document matching the old label onto the new one (legacy, no sourceId)', () => {
    const docs = [makeDoc({ id: 'd1', relatedTo: 'Hotel Roma' }), makeDoc({ id: 'd2', relatedTo: 'Hotel Roma' })];
    const result = retagDocuments(docs, 'stay', 's1', 'Hotel Roma', 'Hotel Roma Centro');
    expect(result.map((d) => d.relatedTo)).toEqual(['Hotel Roma Centro', 'Hotel Roma Centro']);
  });

  it('leaves documents with a different relatedTo untouched', () => {
    const docs = [makeDoc({ id: 'd1', relatedTo: 'Hotel Roma' }), makeDoc({ id: 'd2', relatedTo: 'Some Other Stay' })];
    const result = retagDocuments(docs, 'stay', 's1', 'Hotel Roma', 'Hotel Roma Centro');
    expect(result.find((d) => d.id === 'd2')?.relatedTo).toBe('Some Other Stay');
  });

  it('is a no-op (same array reference) when the label has not changed', () => {
    const docs = [makeDoc({ relatedTo: 'Hotel Roma' })];
    expect(retagDocuments(docs, 'stay', 's1', 'Hotel Roma', 'Hotel Roma')).toBe(docs);
  });

  it('never deletes a document — only remaps its relatedTo field', () => {
    const docs = [makeDoc({ id: 'd1', relatedTo: 'Hotel Roma' })];
    const result = retagDocuments(docs, 'stay', 's1', 'Hotel Roma', 'Hotel Roma Centro');
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('d1');
  });

  // F-11: the actual bug being closed — a rename must never retag an
  // unrelated entity's document just because its OLD label collides.
  it('retags by sourceId even when a different, unrelated document shares the exact old label', () => {
    const mine = makeDoc({ id: 'd1', sourceType: 'stay', sourceId: 's1', relatedTo: 'Hotel Roma' });
    const someoneElses = makeDoc({ id: 'd2', sourceType: 'stay', sourceId: 's2', relatedTo: 'Hotel Roma' });
    const result = retagDocuments([mine, someoneElses], 'stay', 's1', 'Hotel Roma', 'Hotel Roma Centro');
    expect(result.find((d) => d.id === 'd1')?.relatedTo).toBe('Hotel Roma Centro');
    expect(result.find((d) => d.id === 'd2')?.relatedTo).toBe('Hotel Roma');
  });
});
