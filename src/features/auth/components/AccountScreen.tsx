import { useAuth } from '../../../app/providers/AuthProvider';
import { Button } from '../../../shared/components/Button';
import { EmptyState } from '../../../shared/components/EmptyState';
import { useLocalTripsImportPrompt } from '../lib/localImportPrompt';
import { LocalTripsImportPrompt } from './LocalTripsImportPrompt';
import styles from './AccountScreen.module.css';

// Reached either signed in (enabled) or in local-only mode (!enabled) —
// the app-level gate (SignInGateScreen) already handles "enabled but signed
// out", so that combination never reaches here.
export function AccountScreen() {
  const { user, enabled, signOut } = useAuth();
  const { localTrips, dismiss: dismissLocalTripsPrompt } = useLocalTripsImportPrompt(!!user);

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>Λογαριασμός</h1>

      {!enabled && <EmptyState headline="Μη διαθέσιμο" body="Η σύνδεση λογαριασμού δεν έχει ρυθμιστεί σε αυτό το build." />}

      {user && (
        <div className={styles.card}>
          <span className={styles.email}>{user.email}</span>
          <Button variant="secondary" onClick={() => void signOut()}>
            Αποσύνδεση
          </Button>
        </div>
      )}

      {localTrips && <LocalTripsImportPrompt localTrips={localTrips} onClose={dismissLocalTripsPrompt} />}
    </div>
  );
}
