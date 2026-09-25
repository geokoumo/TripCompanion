import { documentBelongsToSource } from '../../features/documents/lib/relatedTo';
import type { DocumentSourceType } from '../../features/documents/types';
import type { Trip } from '../../features/trips/types';

type ArrayFieldKeys = {
  [K in keyof Trip]: Trip[K] extends { id: string }[] ? K : never;
}[keyof Trip];

interface DeleteWithUndoParams<K extends ArrayFieldKeys> {
  updateTrip: (updater: (t: Trip) => Trip) => Promise<void>;
  showToast: (text: string, options?: { variant?: 'neutral' | 'warn' | 'error'; action?: { label: string; onClick: () => void } }) => void;
  arrayKey: K;
  id: string;
  deletedMessage?: string;
  /**
   * The deleted entity's current documents.relatedTo label (see
   * documents/lib/relatedTo.ts) — pass this for entity types that can have
   * attachments (flights, stays, booking items). Any document still tagged
   * with this exact label is detached (relatedTo/sourceType/sourceId
   * cleared) rather than deleted, so the document is preserved and never
   * silently orphaned from the deleted record's now-gone View Details. Undo
   * re-attaches them.
   */
  clearDocumentsRelatedTo?: string;
  /**
   * The deleted entity's stable type/id (F-11) — when given, matching for
   * detach/restore prefers documentBelongsToSource over the relatedTo label
   * alone, so a delete+undo can never mismatch a document against a
   * different entity that happens to share the same label.
   */
  clearDocumentsSourceType?: DocumentSourceType;
  clearDocumentsSourceId?: string;
}

/**
 * Deletes one item from a trip's array field and raises the standard undo
 * toast ("Deleted." + Undo) that restores it on tap. The one pattern
 * behind every delete in the app — flights, stays, stops, expenses, the lot.
 */
export function deleteEntityWithUndo<K extends ArrayFieldKeys>({
  updateTrip,
  showToast,
  arrayKey,
  id,
  deletedMessage = 'Deleted.',
  clearDocumentsRelatedTo,
  clearDocumentsSourceType,
  clearDocumentsSourceId,
}: DeleteWithUndoParams<K>): void {
  const key = arrayKey as unknown as string;

  void (async () => {
    let snapshot: { id: string } | undefined;
    const detached: { id: string; sourceType?: DocumentSourceType; sourceId?: string }[] = [];
    await updateTrip((t) => {
      const record = t as unknown as Record<string, { id: string }[]>;
      const list = record[key]!;
      snapshot = list.find((item) => item.id === id);
      const documents = clearDocumentsRelatedTo
        ? t.documents.map((d) => {
            const matches =
              clearDocumentsSourceType && clearDocumentsSourceId
                ? documentBelongsToSource(d, clearDocumentsSourceType, clearDocumentsSourceId, clearDocumentsRelatedTo)
                : d.relatedTo === clearDocumentsRelatedTo;
            if (!matches) return d;
            detached.push({ id: d.id, sourceType: d.sourceType ?? undefined, sourceId: d.sourceId ?? undefined });
            return { ...d, relatedTo: undefined, sourceType: undefined, sourceId: undefined };
          })
        : t.documents;
      return { ...t, [key]: list.filter((item) => item.id !== id), documents };
    });

    showToast(deletedMessage, {
      variant: 'neutral',
      action: {
        label: 'Undo',
        onClick: () => {
          if (!snapshot) return;
          void updateTrip((t) => {
            const record = t as unknown as Record<string, { id: string }[]>;
            const list = record[key]!;
            const byId = new Map(detached.map((d) => [d.id, d]));
            const documents = detached.length
              ? t.documents.map((d) => {
                  const original = byId.get(d.id);
                  return original ? { ...d, relatedTo: clearDocumentsRelatedTo, sourceType: original.sourceType, sourceId: original.sourceId } : d;
                })
              : t.documents;
            return { ...t, [key]: [...list, snapshot], documents };
          });
        },
      },
    });
  })();
}
