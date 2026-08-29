import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** True once a Supabase project is configured via env vars. */
  enabled: boolean;
  signInWithPassword: (email: string, password: string) => Promise<string | null>;
  signUpWithPassword: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function authErrorMessage(message: string): string {
  if (message.toLowerCase().includes('invalid login credentials')) {
    return 'Λάθος email ή κωδικός.';
  }
  if (message.toLowerCase().includes('already registered')) {
    return 'Υπάρχει ήδη λογαριασμός με αυτό το email.';
  }
  if (message.toLowerCase().includes('password')) {
    return 'Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.';
  }
  return 'Κάτι πήγε στραβά. Δοκίμασε ξανά.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const signInWithPassword = async (email: string, password: string) => {
    if (!supabase) return 'Η σύνδεση λογαριασμού δεν έχει ρυθμιστεί.';
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? authErrorMessage(error.message) : null;
  };

  const signUpWithPassword = async (email: string, password: string) => {
    if (!supabase) return 'Η σύνδεση λογαριασμού δεν έχει ρυθμιστεί.';
    const { error } = await supabase.auth.signUp({ email, password });
    return error ? authErrorMessage(error.message) : null;
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user: session?.user ?? null, loading, enabled: supabase !== null, signInWithPassword, signUpWithPassword, signOut }}
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
