import { useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { useToast } from '../../../app/providers/ToastProvider';
import { TRIP_TABS, type Trip, type TripTab } from '../types';

const TAB_LABELS: Record<TripTab, string> = {
  overview: 'Επισκόπηση',
  flights: 'Πτήσεις',
  stays: 'Διαμονή',
  itinerary: 'Πρόγραμμα',
  budget: 'Budget',
  checklist: 'Βαλίτσα',
};

export function ShareSheet({ onClose }: { trip: Trip; onClose: () => void }) {
  const { showToast } = useToast();
  const [selected, setSelected] = useState<Set<TripTab>>(new Set(['overview']));

  const toggle = (tab: TripTab) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tab)) next.delete(tab);
      else next.add(tab);
      return next;
    });
  };

  return (
    <Modal
      title="Κοινή χρήση"
      onClose={onClose}
      footer={
        <Button
          variant="primary"
          onClick={() => {
            showToast('Η κοινή χρήση θα ενεργοποιηθεί σύντομα', 'info');
            onClose();
          }}
        >
          Δημιουργία συνδέσμου
        </Button>
      }
    >
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 12 }}>
        Επίλεξε ποιες ενότητες θα βλέπει όποιος έχει τον σύνδεσμο.
      </p>
      {TRIP_TABS.map((tab) => (
        <label key={tab} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', cursor: 'pointer' }}>
          <input type="checkbox" checked={selected.has(tab)} onChange={() => toggle(tab)} />
          {TAB_LABELS[tab]}
        </label>
      ))}
    </Modal>
  );
}
