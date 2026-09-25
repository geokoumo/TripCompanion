import { describe, expect, it } from 'vitest';
import { retagDocuments } from './relatedTo';
import type { Document } from '../types';

function makeDoc(overrides: Partial<Document> = {}): Document {
  return { id: 'd1', category: 'other', title: 'file.pdf', relatedTo: 'Hotel Roma', fileType: 'pdf', storagePath: 'p', uploadedAt: '2026-09-01', ...overrides };
}

describe('retagDocuments', () => {
  it('repoints every document matching the old label onto the new one', () => {
    const docs = [makeDoc({ id: 'd1', relatedTo: 'Hotel Roma' }), makeDoc({ id: 'd2', relatedTo: 'Hotel Roma' })];
    const result = retagDocuments(docs, 'Hotel Roma', 'Hotel Roma Centro');
    expect(result.map((d) => d.relatedTo)).toEqual(['Hotel Roma Centro', 'Hotel Roma Centro']);
  });

  it('leaves documents with a different relatedTo untouched', () => {
    const docs = [makeDoc({ id: 'd1', relatedTo: 'Hotel Roma' }), makeDoc({ id: 'd2', relatedTo: 'Some Other Stay' })];
    const result = retagDocuments(docs, 'Hotel Roma', 'Hotel Roma Centro');
    expect(result.find((d) => d.id === 'd2')?.relatedTo).toBe('Some Other Stay');
  });

  it('is a no-op (same array reference) when the label has not changed', () => {
    const docs = [makeDoc({ relatedTo: 'Hotel Roma' })];
    expect(retagDocuments(docs, 'Hotel Roma', 'Hotel Roma')).toBe(docs);
  });

  it('never deletes a document — only remaps its relatedTo field', () => {
    const docs = [makeDoc({ id: 'd1', relatedTo: 'Hotel Roma' })];
    const result = retagDocuments(docs, 'Hotel Roma', 'Hotel Roma Centro');
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('d1');
  });
});
