import { useAuth } from '../../../app/providers/AuthProvider';
import { Button } from '../../../shared/components/Button';
import { EmptyState } from '../../../shared/components/EmptyState';
import { useLocalTripsImportPrompt } from '../lib/localImportPrompt';
import { AuthForm } from './AuthForm';
import { LocalTripsImportPrompt } from './LocalTripsImportPrompt';
import styles from './AccountScreen.module.css';

export function AccountScreen() {
  const { user, enabled, signOut } = useAuth();
  const { localTrips, dismiss: dismissLocalTripsPrompt } = useLocalTripsImportPrompt(!!user);
  const displayName = typeof user?.user_metadata?.name === 'string' ? user.user_metadata.name : undefined;

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>Λογαριασμός</h1>

      {!enabled && <EmptyState headline="Μη διαθέσιμο" body="Η σύνδεση λογαριασμού δεν έχει ρυθμιστεί σε αυτό το build." />}

      {/* Signed out but accounts are configured: local-only mode is a legitimate
          ongoing choice (see the Welcome flow's "continue without an account"),
          not just a first-run skip — so signing in later is always reachable here. */}
      {enabled && !user && <AuthForm />}

      {user && (
        <div className={styles.card}>
          <span className={styles.email}>{displayName ?? user.email}</span>
          <Button variant="secondary" onClick={() => void signOut()}>
            Αποσύνδεση
          </Button>
        </div>
      )}

      {localTrips && <LocalTripsImportPrompt localTrips={localTrips} onClose={dismissLocalTripsPrompt} />}
    </div>
  );
}
