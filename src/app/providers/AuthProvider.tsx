import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../../data/supabase/client';

interface AuthContextValue {
  user: User | null;
  /** True while the initial session is still being resolved on app load. */
  loading: boolean;
  /** True once a Supabase project is configured via env vars. */
  enabled: boolean;
  /** True after landing on a password-recovery link, until the new password is set. */
  recoveryMode: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<string | null>;
  updatePassword: (password: string) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function authErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) {
    return 'Incorrect email or password.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Check your email and confirm your address before signing in.';
  }
  if (lower.includes('already registered')) {
    return 'An account with this email already exists.';
  }
  if (lower.includes('password')) {
    return 'Password must be at least 8 characters.';
  }
  // supabase-js wraps a failed fetch (offline, DNS, a blocked/unreachable
  // host) as an AuthRetryableFetchError whose message is the raw fetch
  // failure text ("Failed to fetch", "NetworkError when attempting to
  // fetch resource", ...) — worth naming specifically instead of the
  // generic fallback, since "something went wrong" reads like a mistake
  // the user made rather than a connectivity problem.
  if (lower.includes('fetch') || lower.includes('network')) {
    return "Can't reach the server. Check your connection and try again.";
  }
  return 'Something went wrong. Try again.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true);
      }
      setSession(next);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name?: string) => {
    if (!supabase) return 'Account sign-in is not configured.';
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: name?.trim() ? { data: { name: name.trim() } } : undefined,
    });
    return error ? authErrorMessage(error.message) : null;
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) return 'Account sign-in is not configured.';
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? authErrorMessage(error.message) : null;
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setRecoveryMode(false);
  };

  const resetPassword = async (email: string) => {
    if (!supabase) return 'Account sign-in is not configured.';
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${window.location.pathname}`,
    });
    return error ? authErrorMessage(error.message) : null;
  };

  const updatePassword = async (password: string) => {
    if (!supabase) return 'Account sign-in is not configured.';
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return authErrorMessage(error.message);
    setRecoveryMode(false);
    return null;
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        loading,
        enabled: supabase !== null,
        recoveryMode,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
