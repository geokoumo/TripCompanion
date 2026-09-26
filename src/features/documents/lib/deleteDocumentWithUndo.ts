import { deleteTripFile, isLocalDataUrl } from '../../../data/storage/tripFilesBucket';
import { removeDocument } from '../../../data/repository/documentRepository';
import { assertExists, UpdateAbortedError } from '../../../shared/lib/updateTripAbort';
import type { Trip } from '../../trips/types';
import type { Document } from '../types';

/**
 * Matches ToastProvider's DEFAULT_DURATIONS.neutral — the undo toast's own
 * auto-dismiss timing, so the Storage cleanup below never fires while Undo
 * is still visibly clickable.
 */
const UNDO_WINDOW_MS = 5000;

// Module-level, not component state: a pending cleanup must survive the
// screen that triggered the delete (AttachmentsField, DocumentDetailSheet)
// being closed or unmounted before the undo window elapses.
const pendingCleanup = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Deletes a document with the same "remove now, Undo restores it" pattern
 * every other delete in the app uses (see shared/lib/deleteWithUndo.ts) —
 * but (F-09) the underlying Storage file is never touched until the undo
 * window has genuinely passed. Deleting it immediately, as this used to
 * work, meant clicking Undo could restore a document record pointing at a
 * file that no longer existed. A `data:` URL (guest/local mode) has no
 * external file to defer — nothing to clean up either way, and it's never
 * scheduled for one.
 *
 * Resolves `true` on a successful delete, `false` if the save itself failed
 * (matching the existing retry-in-place behavior callers relied on before
 * this helper existed) — no toast is shown and nothing is scheduled in that case.
 */
export async function deleteDocumentWithUndo(
  doc: Document,
  updateTrip: (updater: (t: Trip) => Trip) => Promise<{ ok: boolean } | void>,
  showToast: (text: string, options?: { variant?: 'neutral' | 'warn' | 'error'; action?: { label: string; onClick: () => void } }) => void,
): Promise<boolean> {
  let result: { ok: boolean } | void;
  try {
    result = await updateTrip((t) => {
      assertExists(t.documents, doc.id, 'This document was already deleted elsewhere.');
      return removeDocument(t, doc.id);
    });
  } catch {
    return false;
  }
  // A falsy/absent `.ok` (a test double resolving plain `undefined`) is
  // treated as success — only an explicit `{ ok: false }` aborts. The real
  // useTrip.updateTrip already showed a toast for this outcome (trip-deleted,
  // or the already-deleted-elsewhere one from assertExists above).
  if (result && !result.ok) return false;

  if (!isLocalDataUrl(doc.storagePath)) {
    const timer = setTimeout(() => {
      pendingCleanup.delete(doc.id);
      void deleteTripFile(doc.storagePath);
    }, UNDO_WINDOW_MS);
    pendingCleanup.set(doc.id, timer);
  }

  showToast('Deleted.', {
    variant: 'neutral',
    action: {
      label: 'Undo',
      onClick: () => {
        const timer = pendingCleanup.get(doc.id);
        if (timer) {
          clearTimeout(timer);
          pendingCleanup.delete(doc.id);
        }
        void updateTrip((t) => {
          if (t.documents.some((d) => d.id === doc.id)) {
            // Another session already re-added a document with this same id
            // while the undo toast was up — restoring the snapshot on top
            // would duplicate it. Runs against the fresh trip updateTrip
            // just handed us, never a stale array.
            throw new UpdateAbortedError("Couldn't undo — this item already exists.", 'neutral');
          }
          return { ...t, documents: [...t.documents, doc] };
        });
      },
    },
  });

  return true;
}
