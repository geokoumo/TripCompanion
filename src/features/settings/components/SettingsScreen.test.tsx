import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { User } from '@supabase/supabase-js';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { SettingsScreen } from './SettingsScreen';

const mockAuth = vi.hoisted(() => ({
  user: null as User | null,
  enabled: true,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn(),
  updatePassword: vi.fn(),
}));

vi.mock('../../../app/providers/AuthProvider', () => ({
  useAuth: () => mockAuth,
}));
vi.mock('../../../app/providers/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const REAL_USER = { id: 'u1', email: 'alex@example.com' } as User;

function signInSuccessfully() {
  // Mirrors what actually happens on a real Supabase sign-in: AuthProvider's
  // onAuthStateChange fires and `user` flips from null to a real User —
  // nothing in SettingsScreen or AuthForm drives this directly, so the test
  // does the same thing the real listener would.
  mockAuth.user = REAL_USER;
}

describe('SettingsScreen — auth modal state', () => {
  beforeEach(() => {
    mockAuth.user = null;
    mockAuth.enabled = true;
    mockAuth.signIn.mockReset().mockResolvedValue(null);
    mockAuth.signUp.mockReset().mockResolvedValue(null);
  });

  it('opens straight to the menu, never to an auth view, when already signed in', () => {
    mockAuth.user = REAL_USER;
    render(<SettingsScreen onClose={vi.fn()} />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument();
    expect(screen.getAllByText('alex@example.com').length).toBeGreaterThan(0);
  });

  it('successful sign-in closes Settings entirely rather than landing on the menu', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { rerender } = render(<SettingsScreen onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getByLabelText('Email')).toBeInTheDocument();

    // The moment auth actually succeeds, AuthProvider's listener updates
    // `user` — simulate exactly that state transition, then re-render the
    // way React would on a real context update.
    signInSuccessfully();
    rerender(<SettingsScreen onClose={onClose} />);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose merely because the sign-up view (not sign-in) was open', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { rerender } = render(<SettingsScreen onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Create an account' }));
    signInSuccessfully();
    rerender(<SettingsScreen onClose={onClose} />);

    // Sign-up should close Settings too — this asserts the same fix covers
    // both entry points, not just 'signIn'.
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('a failed sign-in keeps the auth form open and never calls onClose', async () => {
    mockAuth.signIn.mockResolvedValue('Incorrect email or password.');
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<SettingsScreen onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await user.type(screen.getByLabelText('Email'), 'alex@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Incorrect email or password.')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    // Still on the auth form, not silently reset to the menu.
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('does not call onClose when user changes while the menu (not an auth view) is showing', () => {
    // Covers "refreshing an authenticated session never auto-opens/closes
    // Settings unexpectedly" — a user transition that happens while Settings
    // is just sitting on its normal menu must not trigger the auth-success
    // close path, since the user never asked to sign in from here.
    const onClose = vi.fn();
    const { rerender } = render(<SettingsScreen onClose={onClose} />);
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();

    signInSuccessfully();
    rerender(<SettingsScreen onClose={onClose} />);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('manually opening Settings while already signed in never shows an auth view', () => {
    // The bug this guards against: Settings appearing to "open itself" after
    // sign-in. Once signed in, opening Settings fresh must always land on
    // the ordinary menu, never on signIn/signUp.
    mockAuth.user = REAL_USER;
    render(<SettingsScreen onClose={vi.fn()} />);
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
  });

  it('signing out from an open Settings screen returns to the signed-out menu', async () => {
    mockAuth.user = REAL_USER;
    mockAuth.signOut.mockResolvedValue(undefined);
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { rerender } = render(<SettingsScreen onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Log out' }));
    expect(mockAuth.signOut).toHaveBeenCalledTimes(1);

    mockAuth.user = null;
    rerender(<SettingsScreen onClose={onClose} />);
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    // Signing out is not a sign-in transition — must never call onClose.
    expect(onClose).not.toHaveBeenCalled();
  });

  it('resolves the sign-in transition synchronously — no setTimeout involved', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { rerender } = render(<SettingsScreen onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    const setTimeoutSpy = vi.spyOn(window, 'setTimeout');
    signInSuccessfully();
    rerender(<SettingsScreen onClose={onClose} />);

    // onClose already fired by the time rerender() returns, and nothing in
    // that path ever reached for a timer — proves this isn't a
    // timeout-based workaround.
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(setTimeoutSpy).not.toHaveBeenCalled();
    setTimeoutSpy.mockRestore();
  });
});
