import { useState } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { Button } from '../../../shared/components/Button';
import { TriangleIcon } from '../../../shared/components/icons';
import { TextField } from '../../../shared/components/Field';
import styles from './AuthForm.module.css';

type Mode = 'signIn' | 'signUp' | 'forgot';

const TITLES: Record<Mode, string> = {
  signIn: 'Sign in',
  signUp: 'Create an account',
  forgot: 'Reset your password',
};

const SUBTITLES: Record<Mode, string> = {
  signIn: 'Welcome back.',
  signUp: 'So your trips sync across every device.',
  forgot: "We'll email you a reset link.",
};

const SUBMIT_LABELS: Record<Mode, string> = {
  signIn: 'Sign in',
  signUp: 'Create account',
  forgot: 'Send reset link',
};

const MIN_PASSWORD_LENGTH = 8;

// AuthProvider's error strings are shared with ResetPasswordScreen, which is
// still Greek — rather than translating that shared function (and breaking
// that screen), this form translates the fixed, known set of messages it can
// come back with, locally.
const ERROR_TRANSLATIONS: Record<string, string> = {
  'Λάθος email ή κωδικός.': 'Incorrect email or password.',
  'Υπάρχει ήδη λογαριασμός με αυτό το email.': 'An account with this email already exists.',
  'Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.': 'Password must be at least 6 characters.',
  'Κάτι πήγε στραβά. Δοκίμασε ξανά.': 'Something went wrong. Please try again.',
  'Η σύνδεση λογαριασμού δεν έχει ρυθμιστεί.': "Account sign-in isn't set up.",
};

function translateAuthError(message: string): string {
  return ERROR_TRANSLATIONS[message] ?? message;
}

interface AuthFormProps {
  /** Which form to open on — the Welcome screen's two buttons land here differently. */
  initialMode?: Mode;
  /** Shows a back chevron when reached from a parent flow (Welcome, the Account sheet). */
  onBack?: () => void;
  /** Shows "continue without an account" when reached from the Welcome flow. */
  onContinueLocally?: () => void;
}

/** Sign-in/sign-up/forgot-password form — used by the Welcome flow and the Account sheet's signed-out state. */
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
        setError('Enter your email.');
        return;
      }
      setSubmitting(true);
      const result = await resetPassword(email.trim());
      setSubmitting(false);
      if (result) {
        setError(translateAuthError(result));
        return;
      }
      setInfo('Check your email for a reset link.');
      return;
    }

    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    if (mode === 'signUp' && password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    setSubmitting(true);
    const result = mode === 'signIn' ? await signIn(email.trim(), password) : await signUp(email.trim(), password, name);
    setSubmitting(false);
    if (result) {
      setError(translateAuthError(result));
      return;
    }
    if (mode === 'signUp') {
      setInfo('Check your email to confirm, then sign in.');
      changeMode('signIn');
    }
    // On a successful sign-in, AuthProvider's session update flows through
    // useAuth() automatically — the caller re-renders into the signed-in
    // view on its own, no explicit navigation needed here.
  };

  return (
    <div className={styles.card}>
      {onBack && (
        <button type="button" className={styles.backLink} onClick={onBack} aria-label="Back">
          ‹
        </button>
      )}
      <div className={styles.iconBadge}>
        <TriangleIcon size={22} />
      </div>
      <div className={styles.title}>{TITLES[mode]}</div>
      <p className={styles.subtitle}>{SUBTITLES[mode]}</p>

      {mode === 'signUp' && (
        <TextField label="Name" autoComplete="name" placeholder="What should we call you?" value={name} onChange={(e) => setName(e.target.value)} />
      )}
      <TextField label="Email" type="email" autoComplete="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      {mode !== 'forgot' && (
        <TextField
          label="Password"
          type="password"
          autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          caption={mode === 'signUp' ? `At least ${MIN_PASSWORD_LENGTH} characters.` : undefined}
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
          Forgot your password?
        </button>
      )}

      {onContinueLocally && mode !== 'forgot' && (
        <>
          <div className={styles.divider}>
            <span>or</span>
          </div>
          <Button variant="secondary" onClick={onContinueLocally} style={{ flex: 'none', width: '100%' }}>
            Continue without an account
          </Button>
          <p className={styles.caption}>Trips stay on this device. An account is only for syncing across devices.</p>
        </>
      )}

      <button type="button" className={styles.footerLink} onClick={() => changeMode(mode === 'signIn' ? 'signUp' : 'signIn')}>
        {mode === 'signUp' ? (
          <>
            <span>Already have an account? </span>
            <span className={styles.footerLinkAccent}>Sign in</span>
          </>
        ) : mode === 'forgot' ? (
          <span className={styles.footerLinkAccent}>Back to sign in</span>
        ) : (
          <>
            <span>Don't have an account? </span>
            <span className={styles.footerLinkAccent}>Create one</span>
          </>
        )}
      </button>
    </div>
  );
}
