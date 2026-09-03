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

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>Λογαριασμός</h1>

      {!enabled && <EmptyState headline="Μη διαθέσιμο" body="Η σύνδεση λογαριασμού δεν έχει ρυθμιστεί σε αυτό το build." />}

      {enabled && !user && <AuthForm />}

      {enabled && user && (
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
