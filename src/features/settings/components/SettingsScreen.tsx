import { useEffect, useState } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useToast } from '../../../app/providers/ToastProvider';
import { AuthForm } from '../../auth/components/AuthForm';
import { Button } from '../../../shared/components/Button';
import { TextField } from '../../../shared/components/Field';
import { Modal } from '../../../shared/components/Modal';
import { Switch } from '../../../shared/components/Switch';
import { EmptyState } from '../../../shared/components/EmptyState';
import { getStorageUsageBytes } from '../../../data/storage/tripFilesBucket';
import {
  getDefaultCurrency,
  getLanguage,
  getNotificationPref,
  getResolvedAppearance,
  setDefaultCurrency,
  setNotificationPref,
  type NotificationPrefKey,
} from '../lib/preferences';
import { StaticPage, STATIC_PAGE_CONTENT } from './StaticPage';
import styles from './SettingsScreen.module.css';

interface SettingsScreenProps {
  onClose: () => void;
}

type View = 'menu' | 'signIn' | 'signUp' | 'changePassword' | keyof typeof STATIC_PAGE_CONTENT;

const STORAGE_PLAN_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB — matches the mockup's display; Supabase's own plan limits aren't queryable from the client SDK.

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 1024 * 1024 * 1024 ? 2 : 0)} MB`.replace('.00 MB', ' MB');
}

export function SettingsScreen({ onClose }: SettingsScreenProps) {
  const { user, enabled, signOut, updatePassword } = useAuth();
  const { showToast } = useToast();
  const [view, setView] = useState<View>('menu');
  const [currency, setCurrency] = useState(getDefaultCurrency());
  const [tripReminders, setTripReminders] = useState(getNotificationPref('tripReminders'));
  const [sharingUpdates, setSharingUpdates] = useState(getNotificationPref('sharingUpdates'));
  const [storageBytes, setStorageBytes] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  const displayName = typeof user?.user_metadata?.name === 'string' ? user.user_metadata.name : undefined;
  const language = getLanguage();
  const appearance = getResolvedAppearance();

  useEffect(() => {
    if (user) void getStorageUsageBytes(user.id).then(setStorageBytes);
  }, [user]);

  const toggleNotif = (key: NotificationPrefKey, value: boolean) => {
    setNotificationPref(key, value);
    if (key === 'tripReminders') setTripReminders(value);
    else setSharingUpdates(value);
  };

  const saveCurrency = (value: string) => {
    const trimmed = value.trim().toUpperCase();
    setCurrency(trimmed);
    setDefaultCurrency(trimmed || 'EUR');
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters.', { variant: 'error' });
      return;
    }
    setPasswordSaving(true);
    const result = await updatePassword(newPassword);
    setPasswordSaving(false);
    if (result) {
      showToast(result, { variant: 'error' });
      return;
    }
    showToast('Password updated.');
    setNewPassword('');
    setView('menu');
  };

  if (view === 'signIn' || view === 'signUp') {
    return (
      <Modal title="" onClose={onClose}>
        <AuthForm initialMode={view} onBack={() => setView('menu')} />
      </Modal>
    );
  }

  if (view === 'changePassword') {
    return (
      <Modal
        title="Change password"
        onClose={onClose}
        footer={
          <Button variant="primary" disabled={passwordSaving} onClick={() => void handleChangePassword()}>
            Save
          </Button>
        }
      >
        <button type="button" className={styles.backLink} onClick={() => setView('menu')}>
          ‹ Back
        </button>
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          caption="At least 8 characters."
        />
      </Modal>
    );
  }

  if (view === 'help' || view === 'privacy' || view === 'terms') {
    return (
      <Modal title={STATIC_PAGE_CONTENT[view].title} onClose={onClose}>
        <button type="button" className={styles.backLink} onClick={() => setView('menu')}>
          ‹ Back
        </button>
        <StaticPage page={view} />
      </Modal>
    );
  }

  return (
    <Modal title="Settings" onClose={onClose}>
      {user && (
        <div className={styles.profileRow}>
          <div className={styles.avatar}>{(displayName ?? user.email ?? '?').charAt(0).toUpperCase()}</div>
          <div>
            <div className={styles.profileName}>{displayName ?? user.email}</div>
            <div className={styles.profileEmail}>{user.email}</div>
          </div>
        </div>
      )}

      {!enabled && (
        <div style={{ marginBottom: 20 }}>
          <EmptyState headline="Account sign-in unavailable" body="This build isn't configured for account sync — your trips stay on this device." />
        </div>
      )}

      {enabled && (
        <>
          <div className={styles.sectionHeader}>Account</div>
          <div className={styles.group}>
            {user ? (
              <>
                <div className={styles.row} style={{ cursor: 'default' }}>
                  Email
                  <span className={styles.rowValue}>{user.email}</span>
                </div>
                <button type="button" className={styles.row} onClick={() => setView('changePassword')}>
                  Password
                  <span className={styles.rowValue}>••••••••  ›</span>
                </button>
              </>
            ) : (
              <>
                <button type="button" className={styles.row} onClick={() => setView('signIn')}>
                  Sign in
                </button>
                <button type="button" className={styles.row} onClick={() => setView('signUp')}>
                  Create an account
                </button>
              </>
            )}
          </div>
        </>
      )}

      <div className={styles.sectionHeader}>Preferences</div>
      <div className={styles.group}>
        <div className={styles.row} style={{ cursor: 'default' }}>
          Home Currency
          <input
            className={styles.rowValue}
            style={{ border: 'none', background: 'none', textAlign: 'right', font: 'inherit', color: 'inherit', width: 70 }}
            value={currency}
            maxLength={3}
            onChange={(e) => saveCurrency(e.target.value)}
          />
        </div>
        <div className={styles.row} style={{ cursor: 'default' }}>
          Language
          <span className={styles.rowValue}>{language === 'en' ? 'English' : language}</span>
        </div>
        <div className={styles.row} style={{ cursor: 'default' }}>
          Appearance
          <span className={styles.rowValue}>Follows system ({appearance})</span>
        </div>
      </div>

      <div className={styles.sectionHeader}>Notifications</div>
      <div className={styles.group}>
        <div className={styles.row} style={{ cursor: 'default' }}>
          <Switch checked={tripReminders} onChange={(v) => toggleNotif('tripReminders', v)} label="Trip reminders" />
        </div>
        <div className={styles.row} style={{ cursor: 'default' }}>
          <Switch checked={sharingUpdates} onChange={(v) => toggleNotif('sharingUpdates', v)} label="Sharing updates" />
        </div>
      </div>
      <p style={{ color: 'var(--color-text-faint)', fontSize: 12, marginTop: 6, marginBottom: 0 }}>
        These are saved on this device — push notifications aren't wired up to a backend yet.
      </p>

      {user && (
        <>
          <div className={styles.sectionHeader}>Storage</div>
          <div className={styles.storageBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Used space</span>
              <span>{storageBytes === null ? 'Loading…' : `${formatBytes(storageBytes)} of 5 GB`}</span>
            </div>
            <div className={styles.storageBar}>
              <div
                className={styles.storageFill}
                style={{ width: `${storageBytes === null ? 0 : Math.min(100, (storageBytes / STORAGE_PLAN_BYTES) * 100)}%` }}
              />
            </div>
          </div>
        </>
      )}

      <div className={styles.sectionHeader} style={{ marginTop: 24 }} />
      <div className={styles.staticRows}>
        <button type="button" className={styles.row} onClick={() => setView('help')}>
          Help & Support <span className={styles.rowValue}>›</span>
        </button>
        <button type="button" className={styles.row} onClick={() => setView('privacy')}>
          Privacy Policy <span className={styles.rowValue}>›</span>
        </button>
        <button type="button" className={styles.row} onClick={() => setView('terms')}>
          Terms of Service <span className={styles.rowValue}>›</span>
        </button>
      </div>

      {user && (
        <button type="button" className={styles.logout} onClick={() => void signOut()}>
          Log out
        </button>
      )}
    </Modal>
  );
}
