import { generateId } from '../../../shared/lib/id';
import { TripSchema, type Trip } from '../types';

function slugify(text: string): string {
  const slug = text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'trip';
}

/** Triggers a browser download of the trip as a standalone JSON file. */
export function downloadTripAsJson(trip: Trip): void {
  const blob = new Blob([JSON.stringify(trip, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${slugify(trip.title)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Parses and validates an exported trip file's contents. Always assigns a
 * fresh id — an import must never be able to silently overwrite an existing
 * trip by reusing the id from the file, and re-importing the same file twice
 * should just produce two independent trips.
 */
export function parseImportedTrip(fileContents: string): Trip {
  const raw: unknown = JSON.parse(fileContents);
  const parsed = TripSchema.parse(raw);
  return { ...parsed, id: generateId() };
}
