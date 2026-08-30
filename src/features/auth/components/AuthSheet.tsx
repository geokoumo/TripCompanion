import { useState } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { Button } from '../../../shared/components/Button';
import { TextField } from '../../../shared/components/Field';
import { Modal } from '../../../shared/components/Modal';

interface AuthSheetProps {
  onClose: () => void;
}

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

export function AuthSheet({ onClose }: AuthSheetProps) {
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
      return;
    }
    onClose();
  };

  return (
    <Modal
      title={TITLES[mode]}
      onClose={onClose}
      footer={
        <Button variant="primary" onClick={() => void submit()} disabled={submitting}>
          {SUBMIT_LABELS[mode]}
        </Button>
      }
    >
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
      {mode === 'forgot' && error && <p style={{ color: 'var(--color-danger)', fontSize: 'var(--fs-meta)' }}>{error}</p>}
      {info && <p style={{ color: 'var(--color-teal)', fontSize: 'var(--fs-meta)' }}>{info}</p>}

      {mode === 'signIn' && (
        <button type="button" onClick={() => changeMode('forgot')} style={linkStyle}>
          Ξέχασες τον κωδικό;
        </button>
      )}

      <button type="button" onClick={() => changeMode(mode === 'signIn' ? 'signUp' : 'signIn')} style={linkStyle}>
        {mode === 'signUp' ? 'Έχεις ήδη λογαριασμό; Σύνδεση' : mode === 'forgot' ? 'Επιστροφή στη σύνδεση' : 'Δεν έχεις λογαριασμό; Εγγραφή'}
      </button>
    </Modal>
  );
}

const linkStyle = {
  display: 'block',
  background: 'none',
  border: 'none',
  color: 'var(--color-rust)',
  fontSize: 'var(--fs-meta)',
  padding: '8px 0',
  cursor: 'pointer',
} as const;
