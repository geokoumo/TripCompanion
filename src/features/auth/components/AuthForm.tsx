import { useState } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { Button } from '../../../shared/components/Button';
import { TextField } from '../../../shared/components/Field';
import styles from './AuthForm.module.css';

type Mode = 'signIn' | 'signUp' | 'forgot';

const TITLES: Record<Mode, string> = {
  signIn: 'Σύνδεση',
  signUp: 'Δημιουργία λογαριασμού',
  forgot: 'Επαναφορά κωδικού',
};

const SUBMIT_LABELS: Record<Mode, string> = {
  signIn: 'Σύνδεση',
  signUp: 'Εγγραφή',
  forgot: 'Αποστολή συνδέσμου',
};

/** Bare sign-in/sign-up/forgot-password form — the Account tab's signed-out state, no modal wrapper. */
export function AuthForm() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [info, setInfo] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const changeMode = (next: Mode) => {
    setMode(next);
    setError(undefined);
    setInfo(undefined);
  };

  const submit = async () => {
    setError(undefined);
    setInfo(undefined);

    if (mode === 'forgot') {
      if (!email.trim()) {
        setError('Συμπλήρωσε το email σου.');
        return;
      }
      setSubmitting(true);
      const result = await resetPassword(email.trim());
      setSubmitting(false);
      if (result) {
        setError(result);
        return;
      }
      setInfo('Ελέγξτε το email σας για σύνδεσμο επαναφοράς κωδικού.');
      return;
    }

    if (!email.trim() || !password) {
      setError('Συμπλήρωσε email και κωδικό.');
      return;
    }
    setSubmitting(true);
    const result = mode === 'signIn' ? await signIn(email.trim(), password) : await signUp(email.trim(), password);
    setSubmitting(false);
    if (result) {
      setError(result);
      return;
    }
    if (mode === 'signUp') {
      setInfo('Ελέγξτε το email σας για επιβεβαίωση, μετά συνδεθείτε.');
      changeMode('signIn');
    }
    // On a successful sign-in, AuthProvider's session update flows through
    // useAuth() automatically — the Account tab re-renders into the
    // signed-in view on its own, no explicit navigation needed here.
  };

  return (
    <div className={styles.card}>
      <div className={styles.title}>{TITLES[mode]}</div>
      <TextField label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      {mode !== 'forgot' && (
        <TextField
          label="Κωδικός"
          type="password"
          autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error}
        />
      )}
      {mode === 'forgot' && error && <p className={styles.error}>{error}</p>}
      {info && <p className={styles.info}>{info}</p>}

      <Button variant="primary" onClick={() => void submit()} disabled={submitting} style={{ flex: 'none', width: '100%', marginTop: 8 }}>
        {SUBMIT_LABELS[mode]}
      </Button>

      {mode === 'signIn' && (
        <button type="button" className={styles.link} onClick={() => changeMode('forgot')}>
          Ξέχασες τον κωδικό;
        </button>
      )}

      <button type="button" className={styles.link} onClick={() => changeMode(mode === 'signIn' ? 'signUp' : 'signIn')}>
        {mode === 'signUp' ? 'Έχεις ήδη λογαριασμό; Σύνδεση' : mode === 'forgot' ? 'Επιστροφή στη σύνδεση' : 'Δεν έχεις λογαριασμό; Εγγραφή'}
      </button>
    </div>
  );
}
