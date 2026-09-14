/**
 * The canonical application URL used for Supabase auth email redirects
 * (signUp's emailRedirectTo, resetPasswordForEmail's redirectTo).
 *
 * In production, VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY alone say nothing
 * about which domain the app itself is served from — Supabase has no way to
 * know that on its own, so every redirect falls back to whatever "Site URL"
 * is configured in the Supabase Dashboard unless the app tells it otherwise
 * on each call. Reading window.location.origin at call time mostly works,
 * but breaks the moment the app is reachable from more than one hostname
 * (a Vercel preview URL, a custom domain added later, a proxy) — a reset
 * link sent from a preview deploy would point back at that preview, not the
 * canonical app. VITE_SITE_URL pins this explicitly for production; local
 * development (where it's normally unset) falls back to the current origin.
 */
export function getSiteUrl(): string {
  const configured = import.meta.env.VITE_SITE_URL as string | undefined;
  const trimmed = configured?.trim().replace(/\/+$/, '');
  return trimmed || window.location.origin;
}
