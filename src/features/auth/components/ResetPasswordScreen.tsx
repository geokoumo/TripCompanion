import { useState } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { Button } from '../../../shared/components/Button';
import { TextField } from '../../../shared/components/Field';
import styles from './ResetPasswordScreen.module.css';

/** Rendered full-screen (not a modal) whenever a password-recovery link lands the user here. */
export function ResetPasswordScreen() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError(undefined);
    if (password.length < 6) {
      setError('Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.');
      return;
    }
    if (password !== confirm) {
      setError('Οι κωδικοί δεν ταιριάζουν.');
      return;
    }
    setSubmitting(true);
    const result = await updatePassword(password);
    setSubmitting(false);
    if (result) setError(result);
  };

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>Νέος κωδικός</h1>
      <p className={styles.subtitle}>Όρισε έναν νέο κωδικό για τον λογαριασμό σου.</p>
      <div className={styles.card}>
        {error && <div className={styles.error}>{error}</div>}
        <TextField label="Νέος κωδικός" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <TextField
          label="Επιβεβαίωση κωδικού"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <Button variant="primary" onClick={() => void submit()} disabled={submitting} style={{ flex: 'none', width: '100%', marginTop: 8 }}>
          Αποθήκευση κωδικού
        </Button>
      </div>
    </div>
  );
}
