import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteDocumentWithUndo } from './deleteDocumentWithUndo';
import type { Trip } from '../../trips/types';
import type { Document } from '../types';

const { deleteTripFile } = vi.hoisted(() => ({ deleteTripFile: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../../../data/storage/tripFilesBucket', () => ({
  deleteTripFile,
  isLocalDataUrl: (path: string) => path.startsWith('data:'),
}));

function makeTrip(documents: Document[]): Trip {
  return {
    id: 't1',
    title: 'Trip',
    homeCurrency: 'EUR',
    archived: false,
    travelers: [],
    legs: [],
    flights: [],
    stays: [],
    bookingItems: [],
    documents,
    itineraryStops: [],
    ideas: [],
    budgetCategories: [],
    rememberedLocations: [],
    expenses: [],
    checklistItems: [],
    shareSettings: { enabled: false, includedTabs: [] },
    schemaVersion: 2,
    createdAt: '2026-09-01',
  } as Trip;
}

function makeDoc(overrides: Partial<Document> = {}): Document {
  return { id: 'd1', category: 'other', title: 'file.pdf', relatedTo: 'Hotel Roma', fileType: 'pdf', storagePath: 'user/trip/file.pdf', uploadedAt: '2026-09-01', ...overrides };
}

beforeEach(() => {
  vi.useFakeTimers();
  deleteTripFile.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('deleteDocumentWithUndo (F-09)', () => {
  it('removes the document from the trip immediately', async () => {
    const doc = makeDoc();
    let trip = makeTrip([doc]);
    const updateTrip = vi.fn(async (updater: (t: Trip) => Trip) => {
      trip = updater(trip);
    });
    const showToast = vi.fn();

    await deleteDocumentWithUndo(doc, updateTrip, showToast);

    expect(trip.documents).toEqual([]);
  });

  it('does not delete the Storage file immediately — only after the undo window passes', async () => {
    const doc = makeDoc();
    let trip = makeTrip([doc]);
    const updateTrip = vi.fn(async (updater: (t: Trip) => Trip) => {
      trip = updater(trip);
    });
    const showToast = vi.fn();

    await deleteDocumentWithUndo(doc, updateTrip, showToast);
    expect(deleteTripFile).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(5000);
    expect(deleteTripFile).toHaveBeenCalledWith('user/trip/file.pdf');
  });

  it('shows a "Deleted." toast with an Undo action', async () => {
    const doc = makeDoc();
    let trip = makeTrip([doc]);
    const updateTrip = vi.fn(async (updater: (t: Trip) => Trip) => {
      trip = updater(trip);
    });
    const showToast = vi.fn();

    await deleteDocumentWithUndo(doc, updateTrip, showToast);

    expect(showToast).toHaveBeenCalledWith('Deleted.', expect.objectContaining({ variant: 'neutral', action: expect.objectContaining({ label: 'Undo' }) }));
  });

  it('Undo restores the document and cancels the pending Storage delete', async () => {
    const doc = makeDoc();
    let trip = makeTrip([doc]);
    const updateTrip = vi.fn(async (updater: (t: Trip) => Trip) => {
      trip = updater(trip);
    });
    const showToast = vi.fn();

    await deleteDocumentWithUndo(doc, updateTrip, showToast);
    expect(trip.documents).toEqual([]);

    const [, options] = showToast.mock.calls[0]!;
    options.action.onClick();
    await vi.waitFor(() => expect(trip.documents).toEqual([doc]));

    // The undo window fully elapsing afterward must not still delete the file.
    await vi.advanceTimersByTimeAsync(10000);
    expect(deleteTripFile).not.toHaveBeenCalled();
  });

  it('never schedules a Storage delete for a local data: URL attachment (guest mode)', async () => {
    const doc = makeDoc({ storagePath: 'data:application/pdf;base64,AAAA' });
    let trip = makeTrip([doc]);
    const updateTrip = vi.fn(async (updater: (t: Trip) => Trip) => {
      trip = updater(trip);
    });
    const showToast = vi.fn();

    await deleteDocumentWithUndo(doc, updateTrip, showToast);
    await vi.advanceTimersByTimeAsync(10000);

    expect(deleteTripFile).not.toHaveBeenCalled();
  });

  it('returns false and shows no toast when the save itself fails, leaving the caller to retry', async () => {
    const doc = makeDoc();
    const trip = makeTrip([doc]);
    const updateTrip = vi.fn().mockRejectedValue(new Error('save-failed'));
    const showToast = vi.fn();

    const result = await deleteDocumentWithUndo(doc, updateTrip, showToast);

    expect(result).toBe(false);
    expect(showToast).not.toHaveBeenCalled();
    expect(trip.documents).toEqual([doc]);
  });
});
