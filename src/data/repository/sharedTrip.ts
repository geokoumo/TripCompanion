import { supabase } from '../supabase/client';
import { SharedTripSchema, type SharedTrip } from '../../features/trips/types';

/**
 * Resolves a share link's token via the anonymous get_shared_trip(token) RPC
 * — the only server-side access path for a signed-out (or signed-in-as-
 * someone-else) visitor to see a shared trip. Deliberately NOT part of
 * TripRepository/useTrip: those are always owner-scoped (local storage or
 * get_full_trip), and reusing them for a share link would either look the
 * token up in the visitor's own browser storage or run an owner-only query
 * that returns nothing for anyone but the trip's own owner.
 */
export async function getSharedTrip(token: string): Promise<SharedTrip | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('get_shared_trip', { _token: token });
  if (error || !data) return null;
  const parsed = SharedTripSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}
