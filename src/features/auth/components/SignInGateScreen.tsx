import { AuthForm } from './AuthForm';
import styles from './SignInGateScreen.module.css';

/** Rendered instead of the whole app when accounts are configured (enabled) but no one is signed in — signing in is required to see anything else. */
export function SignInGateScreen() {
  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>Trip Companion</h1>
      <p className={styles.subtitle}>Συνδέσου για να δεις τα ταξίδια σου.</p>
      <AuthForm />
    </div>
  );
}
