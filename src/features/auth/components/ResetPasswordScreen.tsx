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
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    const result = await updatePassword(password);
    setSubmitting(false);
    if (result) setError(result);
  };

  return (
    <form
      className={styles.screen}
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <h1 className={styles.title}>Choose new password</h1>
      <p className={styles.subtitle}>Create a secure, private password.</p>
      {error && <div className={styles.error}>{error}</div>}
      <TextField
        label="New password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={submitting}
      />
      <TextField
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        disabled={submitting}
      />
      <p className={styles.caption}>Password requirements: at least 8 characters long.</p>
      <Button type="submit" variant="primary" disabled={submitting} style={{ flex: 'none', width: '100%', marginTop: 8 }}>
        {submitting ? 'Saving…' : 'Save new password'}
      </Button>
    </form>
  );
}
