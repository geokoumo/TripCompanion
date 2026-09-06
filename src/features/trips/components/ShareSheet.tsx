import { useState } from 'react';
import { useToast } from '../../../app/providers/ToastProvider';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { generateId } from '../../../shared/lib/id';
import { TRIP_TABS, type Trip, type TripTab } from '../types';
import styles from './ShareSheet.module.css';

const TAB_LABELS: Record<TripTab, string> = {
  overview: 'Overview',
  flights: 'Flights',
  stays: 'Stays',
  itinerary: 'Itinerary',
  budget: 'Budget',
  checklist: 'Packing',
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
    <Modal title="Share" onClose={onClose}>
      <p className={styles.intro}>Choose what the recipient can see. The link is read-only.</p>
      <div className={styles.chips}>
        {TRIP_TABS.map((tab) => (
          <button key={tab} type="button" className={styles.chip} data-active={selected.has(tab)} onClick={() => toggle(tab)}>
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {shareUrl && (
        <div className={styles.linkPanel}>
          <div className={styles.linkKicker}>Link ready</div>
          <div className={styles.linkUrl}>{shareUrl}</div>
          <div className={styles.linkActions}>
            <Button
              variant="secondary"
              onClick={() => {
                void navigator.clipboard?.writeText(shareUrl);
                showToast('Link copied.');
              }}
            >
              Copy
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                window.location.hash = `#/shared/${trip.id}`;
              }}
            >
              Preview
            </Button>
          </div>
        </div>
      )}

      <Button variant="primary" onClick={generateLink} disabled={selected.size === 0}>
        {shareUrl ? 'New link' : 'Create link'}
      </Button>
    </Modal>
  );
}
