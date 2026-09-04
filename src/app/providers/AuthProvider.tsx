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
    return 'Λάθος email ή κωδικός.';
  }
  if (lower.includes('already registered')) {
    return 'Υπάρχει ήδη λογαριασμός με αυτό το email.';
  }
  if (lower.includes('password')) {
    return 'Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.';
  }
  return 'Κάτι πήγε στραβά. Δοκίμασε ξανά.';
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
    if (!supabase) return 'Η σύνδεση λογαριασμού δεν έχει ρυθμιστεί.';
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: name?.trim() ? { data: { name: name.trim() } } : undefined,
    });
    return error ? authErrorMessage(error.message) : null;
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) return 'Η σύνδεση λογαριασμού δεν έχει ρυθμιστεί.';
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? authErrorMessage(error.message) : null;
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setRecoveryMode(false);
  };

  const resetPassword = async (email: string) => {
    if (!supabase) return 'Η σύνδεση λογαριασμού δεν έχει ρυθμιστεί.';
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${window.location.pathname}`,
    });
    return error ? authErrorMessage(error.message) : null;
  };

  const updatePassword = async (password: string) => {
    if (!supabase) return 'Η σύνδεση λογαριασμού δεν έχει ρυθμιστεί.';
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
