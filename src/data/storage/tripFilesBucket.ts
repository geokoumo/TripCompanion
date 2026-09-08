import { supabase } from '../supabase/client';

const BUCKET = 'trip-files';

/**
 * The one shared private Storage bucket for every user-uploaded trip file —
 * documents today, and a future cover-photo feature belongs here too, not in
 * a second bucket. Path convention: {user_id}/{trip_id}/{timestamp}-{name},
 * matching the storage RLS policy that checks the leading folder against
 * auth.uid().
 */
export async function uploadTripFile(userId: string, tripId: string, file: File): Promise<string> {
  if (!supabase) throw new Error('Account sign-in is not configured.');
  const path = `${userId}/${tripId}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file);
  if (error) throw error;
  return path;
}

/** Signed URLs only — the bucket is private, there is no public URL. */
export async function getTripFileUrl(path: string): Promise<string> {
  if (!supabase) throw new Error('Account sign-in is not configured.');
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteTripFile(path: string): Promise<void> {
  if (!supabase) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

/** True for a local-only (signed-out) attachment, stored inline as a data: URL instead of in Storage. */
export function isLocalDataUrl(path: string): boolean {
  return path.startsWith('data:');
}

/** Reads a File into a data: URL — the signed-out fallback, since there's no Storage bucket without an account. */
export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

/** Reads total bytes for the signed-in user's own files — Settings' Storage usage display. */
export async function getStorageUsageBytes(userId: string): Promise<number> {
  if (!supabase) return 0;
  let total = 0;
  const stack = [''];
  while (stack.length > 0) {
    const prefix = stack.pop()!;
    const path = prefix ? `${userId}/${prefix}` : userId;
    const { data, error } = await supabase.storage.from(BUCKET).list(path, { limit: 1000 });
    if (error || !data) continue;
    for (const entry of data) {
      if (entry.id === null) {
        // A "folder" placeholder — recurse into it.
        stack.push(prefix ? `${prefix}/${entry.name}` : entry.name);
      } else {
        total += entry.metadata?.size ?? 0;
      }
    }
  }
  return total;
}
