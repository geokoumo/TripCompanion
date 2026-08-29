import { useState } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { Button } from '../../../shared/components/Button';
import { TextField } from '../../../shared/components/Field';
import { Modal } from '../../../shared/components/Modal';

interface AuthSheetProps {
  onClose: () => void;
}

export function AuthSheet({ onClose }: AuthSheetProps) {
  const { signInWithPassword, signUpWithPassword } = useAuth();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [info, setInfo] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError(undefined);
    setInfo(undefined);
    if (!email.trim() || !password) {
      setError('Συμπλήρωσε email και κωδικό.');
      return;
    }
    setSubmitting(true);
    const result = mode === 'signIn' ? await signInWithPassword(email.trim(), password) : await signUpWithPassword(email.trim(), password);
    setSubmitting(false);
    if (result) {
      setError(result);
      return;
    }
    if (mode === 'signUp') {
      setInfo('Ελέγξτε το email σας για επιβεβαίωση, μετά συνδεθείτε.');
      setMode('signIn');
      return;
    }
    onClose();
  };

  return (
    <Modal
      title={mode === 'signIn' ? 'Σύνδεση' : 'Δημιουργία λογαριασμού'}
      onClose={onClose}
      footer={
        <Button variant="primary" onClick={() => void submit()} disabled={submitting}>
          {mode === 'signIn' ? 'Σύνδεση' : 'Εγγραφή'}
        </Button>
      }
    >
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        label="Κωδικός"
        type="password"
        autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={error}
      />
      {info && <p style={{ color: 'var(--color-teal)', fontSize: 'var(--fs-meta)' }}>{info}</p>}
      <button
        type="button"
        onClick={() => {
          setMode(mode === 'signIn' ? 'signUp' : 'signIn');
          setError(undefined);
          setInfo(undefined);
        }}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--color-rust)',
          fontSize: 'var(--fs-meta)',
          padding: '8px 0',
          cursor: 'pointer',
        }}
      >
        {mode === 'signIn' ? 'Δεν έχεις λογαριασμό; Εγγραφή' : 'Έχεις ήδη λογαριασμό; Σύνδεση'}
      </button>
    </Modal>
  );
}
