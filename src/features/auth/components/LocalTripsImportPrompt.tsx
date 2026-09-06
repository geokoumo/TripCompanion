import { useState } from 'react';
import { useTripsContext } from '../../../app/providers/TripsProvider';
import { useToast } from '../../../app/providers/ToastProvider';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { generateId } from '../../../shared/lib/id';
import type { Trip } from '../../trips/types';

interface LocalTripsImportPromptProps {
  localTrips: Trip[];
  onClose: () => void;
}

/**
 * Imports each local trip through the same "fresh id" path a JSON file
 * import already uses (see lib/tripFile.ts's parseImportedTrip) — now
 * writing to whichever repository is currently active (Supabase, since this
 * only ever shows while signed in). Local storage itself is left untouched;
 * cleaning it up is a separate, later decision.
 */
export function LocalTripsImportPrompt({ localTrips, onClose }: LocalTripsImportPromptProps) {
  const { saveTrip } = useTripsContext();
  const { showToast } = useToast();
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    setImporting(true);
    let succeeded = 0;
    for (const trip of localTrips) {
      try {
        // eslint-disable-next-line no-await-in-loop -- sequential on purpose, see TripsProvider.saveTrip's optimistic-rollback note
        await saveTrip({ ...trip, id: generateId() });
        succeeded++;
      } catch {
        // saveTrip already surfaced its own error toast
      }
    }
    setImporting(false);
    onClose();
    showToast(
      succeeded === localTrips.length
        ? `Added ${succeeded} trips to your account.`
        : `Added ${succeeded} of ${localTrips.length} trips.`,
    );
  };

  return (
    <Modal
      title="Local trips"
      onClose={onClose}
      footer={
        <Button variant="primary" onClick={() => void handleImport()} disabled={importing}>
          Add to account
        </Button>
      }
    >
      <p style={{ color: 'var(--color-text)' }}>
        Found {localTrips.length} local {localTrips.length === 1 ? 'trip' : 'trips'}. Want to add them to your account?
      </p>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--fs-meta)' }}>
        Local trips won't be deleted — they'll stay on this device too.
      </p>
    </Modal>
  );
}
