import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Missing config must never silently blank the screen — it should still be
 * possible to use the app in local-only mode. So we log loudly per missing
 * variable and leave `supabase` null; every caller (AuthProvider,
 * SupabaseTripRepository) treats null as "account features unavailable"
 * rather than throwing during module init.
 */
function checkEnv(): boolean {
  let ok = true;
  if (!url) {
    console.error(
      '[Supabase] Missing VITE_SUPABASE_URL. Set it in .env (see .env.example) — Supabase dashboard → Project Settings → API. Falling back to local-only mode.',
    );
    ok = false;
  }
  if (!anonKey) {
    console.error(
      '[Supabase] Missing VITE_SUPABASE_ANON_KEY. Set it in .env (see .env.example) — Supabase dashboard → Project Settings → API. Falling back to local-only mode.',
    );
    ok = false;
  }
  return ok;
}

export const supabase: SupabaseClient | null = checkEnv() ? createClient(url, anonKey) : null;
