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

const SUBTITLES: Partial<Record<Mode, string>> = {
  signUp: 'Έτσι τα ταξίδια σου συγχρονίζονται σε κάθε συσκευή.',
};

const SUBMIT_LABELS: Record<Mode, string> = {
  signIn: 'Σύνδεση',
  signUp: 'Δημιουργία λογαριασμού',
  forgot: 'Αποστολή συνδέσμου',
};

const MIN_PASSWORD_LENGTH = 8;

interface AuthFormProps {
  /** Which form to open on — the Welcome screen's two buttons land here differently. */
  initialMode?: Mode;
  /** Shows a back chevron when reached from the Welcome flow; omitted for the Account tab's own use. */
  onBack?: () => void;
  /** Shows "continue without an account" when reached from the Welcome flow; omitted for the Account tab's own use. */
  onContinueLocally?: () => void;
}

/** Sign-in/sign-up/forgot-password form — used both as the Welcome flow's second step and as the Account tab's signed-out state. */
export function AuthForm({ initialMode = 'signIn', onBack, onContinueLocally }: AuthFormProps) {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState('');
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
    if (mode === 'signUp' && password.length < MIN_PASSWORD_LENGTH) {
      setError(`Ο κωδικός πρέπει να έχει τουλάχιστον ${MIN_PASSWORD_LENGTH} χαρακτήρες.`);
      return;
    }
    setSubmitting(true);
    const result = mode === 'signIn' ? await signIn(email.trim(), password) : await signUp(email.trim(), password, name);
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
    // useAuth() automatically — the caller re-renders into the signed-in
    // view on its own, no explicit navigation needed here.
  };

  return (
    <div className={styles.card}>
      {onBack && (
        <button type="button" className={styles.backLink} onClick={onBack} aria-label="Πίσω">
          ‹
        </button>
      )}
      <div className={styles.title}>{TITLES[mode]}</div>
      {SUBTITLES[mode] && <p className={styles.subtitle}>{SUBTITLES[mode]}</p>}

      {mode === 'signUp' && (
        <TextField label="Όνομα" autoComplete="name" placeholder="Πώς να σε λέμε;" value={name} onChange={(e) => setName(e.target.value)} />
      )}
      <TextField label="Email" type="email" autoComplete="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      {mode !== 'forgot' && (
        <TextField
          label="Κωδικός"
          type="password"
          autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          caption={mode === 'signUp' ? `Τουλάχιστον ${MIN_PASSWORD_LENGTH} χαρακτήρες.` : undefined}
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

      {onContinueLocally && mode !== 'forgot' && (
        <>
          <div className={styles.divider}>
            <span>ή</span>
          </div>
          <Button variant="secondary" onClick={onContinueLocally} style={{ flex: 'none', width: '100%' }}>
            Συνέχεια χωρίς λογαριασμό
          </Button>
          <p className={styles.caption}>Τα ταξίδια παραμένουν στη συσκευή. Ο λογαριασμός χρειάζεται μόνο για συγχρονισμό ανάμεσα σε συσκευές.</p>
        </>
      )}
    </div>
  );
}
