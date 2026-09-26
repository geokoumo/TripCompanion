import { useState } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useTripsContext } from '../../../app/providers/TripsProvider';
import { useToast } from '../../../app/providers/ToastProvider';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { useSavingGuard } from '../../../shared/hooks/useSavingGuard';
import { generateShareToken } from '../../../shared/lib/id';
import { UpdateAbortedError } from '../../../shared/lib/updateTripAbort';
import { saveTripPatch } from '../lib/saveTripPatch';
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
  onSave: (updated: Trip) => void | Promise<void>;
}

export function ShareSheet({ trip, onClose, onSave }: ShareSheetProps) {
  const { user } = useAuth();
  const { getFullTripOrThrow } = useTripsContext();
  const { showToast } = useToast();
  const [selected, setSelected] = useState<Set<TripTab>>(new Set(trip.shareSettings.includedTabs.length ? trip.shareSettings.includedTabs : ['overview']));
  const [shareToken, setShareToken] = useState(trip.shareSettings.shareToken);
  const { saving, run } = useSavingGuard();

  // F-10: a guest/local-mode trip lives only in this browser's storage —
  // there is no Supabase row for the anonymous get_shared_trip RPC to ever
  // find, so generating a link here would look successful (the token saves
  // fine, "Link ready" would show) while being permanently unresolvable for
  // anyone, including the same person in another browser. Say so plainly
  // instead of producing a link that can never work.
  if (!user) {
    return (
      <Modal title="Share" onClose={onClose}>
        <p className={styles.intro}>Sign in to share this trip. Sharing creates a link backed by your account — a trip saved only on this device can&apos;t be shared yet.</p>
      </Modal>
    );
  }

  const toggle = (tab: TripTab) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tab)) next.delete(tab);
      else next.add(tab);
      return next;
    });
  };

  // Only reveals the "Link ready" panel once the share settings have
  // actually persisted — generating the token locally first (the old
  // behavior) could show a working link even if the save failed.
  const generateLink = () =>
    void run(async () => {
      const token = generateShareToken();
      try {
        await saveTripPatch(
          trip.id,
          { shareSettings: { enabled: true, includedTabs: [...selected], shareToken: token } },
          getFullTripOrThrow,
          onSave,
        );
        setShareToken(token);
      } catch (err) {
        if (err instanceof UpdateAbortedError) {
          showToast(err.message, { variant: err.variant });
          return;
        }
        showToast("Couldn't create the link. Try again.", { variant: 'error' });
      }
    });

  // Must be the token, not the trip's own id — a recipient viewing this link
  // is never signed in as the trip's owner (that's the whole point of
  // sharing), and the anonymous get_shared_trip RPC only ever accepts the
  // unguessable token, never a trip id.
  const shareUrl = shareToken ? `${window.location.origin}${window.location.pathname}#/shared/${shareToken}` : null;

  return (
    <Modal title="Share" onClose={onClose}>
      <p className={styles.intro}>Choose what the recipient can see. The link is read-only.</p>
      <div className={styles.chips} role="group" aria-label="Tabs to include in the shared link">
        {TRIP_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={styles.chip}
            data-active={selected.has(tab)}
            aria-pressed={selected.has(tab)}
            onClick={() => toggle(tab)}
          >
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
                window.location.hash = `#/shared/${shareToken}`;
              }}
            >
              Preview
            </Button>
          </div>
        </div>
      )}

      <Button variant="primary" onClick={generateLink} disabled={selected.size === 0 || saving}>
        {saving ? 'Creating…' : shareUrl ? 'New link' : 'Create link'}
      </Button>
    </Modal>
  );
}
