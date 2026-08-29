import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Auth-only integration: trip data itself stays in localStorage
 * (see data/repository/LocalStorageTripRepository). This client backs
 * account sign-in/sign-up only.
 */
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
