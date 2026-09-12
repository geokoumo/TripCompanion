import type { Trip } from '../../features/trips/types';
import type { Document } from '../../features/documents/types';

/** Pure entity-level operations on a trip's documents — see expenseRepository.ts for why these are Trip -> Trip functions rather than direct Supabase calls. */

export function addDocument(trip: Trip, doc: Document): Trip {
  return { ...trip, documents: [...trip.documents, doc] };
}

/** Swaps a document's underlying file without touching its category/title/relatedTo metadata. */
export function replaceDocumentFile(trip: Trip, docId: string, newStoragePath: string, uploadedAt: string): Trip {
  return {
    ...trip,
    documents: trip.documents.map((d) => (d.id === docId ? { ...d, storagePath: newStoragePath, uploadedAt } : d)),
  };
}

export function removeDocument(trip: Trip, docId: string): Trip {
  return { ...trip, documents: trip.documents.filter((d) => d.id !== docId) };
}
