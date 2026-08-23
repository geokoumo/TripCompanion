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
}

/**
 * Deletes one item from a trip's array field and raises the standard undo
 * toast ("Διαγράφηκε." + Αναίρεση) that restores it on tap. The one pattern
 * behind every delete in the app — flights, stays, stops, expenses, the lot.
 */
export function deleteEntityWithUndo<K extends ArrayFieldKeys>({
  updateTrip,
  showToast,
  arrayKey,
  id,
  deletedMessage = 'Διαγράφηκε.',
}: DeleteWithUndoParams<K>): void {
  void (async () => {
    let snapshot: { id: string } | undefined;
    await updateTrip((t) => {
      const list = t[arrayKey] as unknown as { id: string }[];
      snapshot = list.find((item) => item.id === id);
      return { ...t, [arrayKey]: list.filter((item) => item.id !== id) };
    });

    showToast(deletedMessage, {
      variant: 'neutral',
      action: {
        label: 'Αναίρεση',
        onClick: () => {
          if (!snapshot) return;
          void updateTrip((t) => {
            const list = t[arrayKey] as unknown as { id: string }[];
            return { ...t, [arrayKey]: [...list, snapshot] };
          });
        },
      },
    });
  })();
}
