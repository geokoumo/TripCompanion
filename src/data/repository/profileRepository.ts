import { supabase } from '../supabase/client';

export interface Profile {
  id: string;
  displayName: string | null;
}

/**
 * Reads the signed-in user's own profile row. RLS scopes this to `id =
 * auth.uid()` regardless of what's requested, so there's no id parameter
 * here to accidentally pass someone else's — this only ever reads "mine."
 */
export async function getOwnProfile(): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('profiles').select('id, display_name').single();
  if (error || !data) return null;
  return { id: data.id, displayName: data.display_name };
}
