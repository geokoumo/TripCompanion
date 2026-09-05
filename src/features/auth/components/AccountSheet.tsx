import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Modal } from '../../../shared/components/Modal';
import { AuthForm } from './AuthForm';
import styles from './AccountSheet.module.css';

type View = 'menu' | 'signIn' | 'signUp';

interface AccountSheetProps {
  onClose: () => void;
}

/** Account access as a bottom sheet, reachable from the app shell's bottom nav — replaces the old dedicated Account screen. */
export function AccountSheet({ onClose }: AccountSheetProps) {
  const { user, enabled, signOut } = useAuth();
  const [view, setView] = useState<View>('menu');
  const displayName = typeof user?.user_metadata?.name === 'string' ? user.user_metadata.name : undefined;

  // Once sign-in actually succeeds mid-flow, the sheet has done its job —
  // dismiss it rather than leaving the visitor staring at their own menu.
  const wasSignedIn = useRef(!!user);
  useEffect(() => {
    if (user && !wasSignedIn.current && view !== 'menu') {
      onClose();
    }
    wasSignedIn.current = !!user;
  }, [user, view, onClose]);

  if (!enabled) {
    return (
      <Modal title="Account" onClose={onClose}>
        <EmptyState headline="Not available" body="Account sign-in isn't set up in this build." />
      </Modal>
    );
  }

  if (view === 'signIn' || view === 'signUp') {
    return (
      <Modal title="" onClose={onClose}>
        <AuthForm initialMode={view} onBack={() => setView('menu')} />
      </Modal>
    );
  }

  return (
    <Modal title="Account" onClose={onClose}>
      <div className={styles.identityRow}>
        <div className={styles.avatar}>{user ? (displayName ?? user.email ?? '?').charAt(0).toUpperCase() : '?'}</div>
        <div>
          <div className={styles.primaryLine}>{user ? (displayName ?? user.email) : 'No account'}</div>
          <div className={styles.secondaryLine}>{user ? 'Signed in' : 'Signed in as a guest'}</div>
        </div>
      </div>

      <div className={styles.rows}>
        {!user && (
          <button type="button" className={styles.row} onClick={() => setView('signIn')}>
            Sign in
          </button>
        )}
        {!user && (
          <button type="button" className={styles.row} onClick={() => setView('signUp')}>
            Create an account
          </button>
        )}
        {user && (
          <button type="button" className={styles.row} onClick={() => void signOut()}>
            Sign out
          </button>
        )}
      </div>

      <button type="button" className={styles.closeButton} onClick={onClose}>
        Close
      </button>
    </Modal>
  );
}
