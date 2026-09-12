import { describe, expect, it } from 'vitest';
import { addDocument, removeDocument, replaceDocumentFile } from './documentRepository';
import type { Trip } from '../../features/trips/types';
import type { Document } from '../../features/documents/types';

function makeTrip(): Trip {
  return {
    id: 'trip1',
    title: 'Test Trip',
    homeCurrency: 'EUR',
    archived: false,
    description: null,
    travelers: [],
    legs: [],
    flights: [],
    stays: [],
    bookingItems: [],
    documents: [],
    itineraryStops: [],
    ideas: [],
    budgetCategories: [],
    budget: null,
    rememberedLocations: [],
    expenses: [],
    checklistItems: [],
    shareSettings: { enabled: false, includedTabs: [] },
    schemaVersion: 2,
    createdAt: '2026-09-01',
  };
}

function makeDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: 'd1',
    category: 'other',
    title: 'Passport',
    fileType: 'pdf',
    storagePath: 'user1/trip1/original.pdf',
    uploadedAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('addDocument', () => {
  it('appends the document to the trip', () => {
    const trip = makeTrip();
    const doc = makeDocument();
    const result = addDocument(trip, doc);
    expect(result.documents).toEqual([doc]);
    expect(trip.documents).toEqual([]);
  });
});

describe('replaceDocumentFile', () => {
  it('swaps only the storage path and uploadedAt for the matching document', () => {
    const trip = { ...makeTrip(), documents: [makeDocument({ id: 'd1' }), makeDocument({ id: 'd2' })] };
    const result = replaceDocumentFile(trip, 'd1', 'user1/trip1/new.pdf', '2026-09-10T00:00:00.000Z');
    expect(result.documents).toEqual([
      makeDocument({ id: 'd1', storagePath: 'user1/trip1/new.pdf', uploadedAt: '2026-09-10T00:00:00.000Z' }),
      makeDocument({ id: 'd2' }),
    ]);
  });

  it('leaves category, title, and relatedTo untouched', () => {
    const trip = { ...makeTrip(), documents: [makeDocument({ id: 'd1', category: 'insurance', title: 'Travel Insurance', relatedTo: 'Japan trip' })] };
    const result = replaceDocumentFile(trip, 'd1', 'user1/trip1/new.pdf', '2026-09-10T00:00:00.000Z');
    expect(result.documents[0]).toMatchObject({ category: 'insurance', title: 'Travel Insurance', relatedTo: 'Japan trip' });
  });
});

describe('removeDocument', () => {
  it('removes only the document with the matching id', () => {
    const trip = { ...makeTrip(), documents: [makeDocument({ id: 'd1' }), makeDocument({ id: 'd2' })] };
    const result = removeDocument(trip, 'd1');
    expect(result.documents).toEqual([makeDocument({ id: 'd2' })]);
  });
});
