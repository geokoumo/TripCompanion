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
   * with this exact label is detached (relatedTo cleared) rather than
   * deleted, so the document is preserved and never silently orphaned from
   * the deleted record's now-gone View Details. Undo re-attaches them.
   */
  clearDocumentsRelatedTo?: string;
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
}: DeleteWithUndoParams<K>): void {
  const key = arrayKey as unknown as string;

  void (async () => {
    let snapshot: { id: string } | undefined;
    const detachedDocIds: string[] = [];
    await updateTrip((t) => {
      const record = t as unknown as Record<string, { id: string }[]>;
      const list = record[key]!;
      snapshot = list.find((item) => item.id === id);
      const documents = clearDocumentsRelatedTo
        ? t.documents.map((d) => {
            if (d.relatedTo !== clearDocumentsRelatedTo) return d;
            detachedDocIds.push(d.id);
            return { ...d, relatedTo: undefined };
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
            const documents = detachedDocIds.length
              ? t.documents.map((d) => (detachedDocIds.includes(d.id) ? { ...d, relatedTo: clearDocumentsRelatedTo } : d))
              : t.documents;
            return { ...t, [key]: [...list, snapshot], documents };
          });
        },
      },
    });
  })();
}
