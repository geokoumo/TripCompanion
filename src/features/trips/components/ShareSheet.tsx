import { useState } from 'react';
import { useToast } from '../../../app/providers/ToastProvider';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { generateId } from '../../../shared/lib/id';
import { TRIP_TABS, type Trip, type TripTab } from '../types';
import styles from './ShareSheet.module.css';

const TAB_LABELS: Record<TripTab, string> = {
  overview: 'Επισκόπηση',
  flights: 'Πτήσεις',
  stays: 'Διαμονή',
  itinerary: 'Πρόγραμμα',
  budget: 'Budget',
  checklist: 'Βαλίτσα',
};

interface ShareSheetProps {
  trip: Trip;
  onClose: () => void;
  onSave: (updated: Trip) => void;
}

export function ShareSheet({ trip, onClose, onSave }: ShareSheetProps) {
  const { showToast } = useToast();
  const [selected, setSelected] = useState<Set<TripTab>>(new Set(trip.shareSettings.includedTabs.length ? trip.shareSettings.includedTabs : ['overview']));
  const [shareToken, setShareToken] = useState(trip.shareSettings.shareToken);

  const toggle = (tab: TripTab) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tab)) next.delete(tab);
      else next.add(tab);
      return next;
    });
  };

  const generateLink = () => {
    const token = generateId();
    setShareToken(token);
    onSave({
      ...trip,
      shareSettings: { enabled: true, includedTabs: [...selected], shareToken: token },
    });
  };

  const shareUrl = shareToken ? `${window.location.origin}${window.location.pathname}#/shared/${trip.id}` : null;

  return (
    <Modal title="Κοινή χρήση" onClose={onClose}>
      <p className={styles.intro}>Διάλεξε τι θα βλέπει ο παραλήπτης. Ο σύνδεσμος είναι μόνο για ανάγνωση.</p>
      <div className={styles.chips}>
        {TRIP_TABS.map((tab) => (
          <button key={tab} type="button" className={styles.chip} data-active={selected.has(tab)} onClick={() => toggle(tab)}>
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {shareUrl && (
        <div className={styles.linkPanel}>
          <div className={styles.linkKicker}>Σύνδεσμος έτοιμος</div>
          <div className={styles.linkUrl}>{shareUrl}</div>
          <div className={styles.linkActions}>
            <Button
              variant="secondary"
              onClick={() => {
                void navigator.clipboard?.writeText(shareUrl);
                showToast('Ο σύνδεσμος αντιγράφηκε.');
              }}
            >
              Αντιγραφή
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                window.location.hash = `#/shared/${trip.id}`;
              }}
            >
              Προβολή
            </Button>
          </div>
        </div>
      )}

      <Button variant="primary" onClick={generateLink} disabled={selected.size === 0}>
        {shareUrl ? 'Νέος σύνδεσμος' : 'Δημιουργία συνδέσμου'}
      </Button>
    </Modal>
  );
}
