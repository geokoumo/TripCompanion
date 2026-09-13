import { supabase } from '../supabase/client';

const BUCKET = 'trip-files';

// Boarding passes, hotel confirmations, and ticket PDFs are all well under
// this — generous enough for a real document, small enough to keep Storage
// costs sane and to never blow past a signed-out user's ~5-10MB localStorage
// quota (attachments there are inlined as base64 data: URLs, which run ~33%
// larger than the original file).
export const MAX_TRIP_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPE_PREFIXES = ['image/'];
const ACCEPTED_TYPES = ['application/pdf'];

/**
 * Client-side gate before a file ever reaches uploadTripFile/readAsDataUrl.
 * This is a UX guard, not a security boundary — the private bucket + signed
 * URLs are what actually keep a file safe, and nothing here is re-checked
 * server-side, so a user could still push an arbitrary file straight at the
 * Storage API with their own credentials. What this DOES prevent is the
 * ordinary case: an accidental huge attachment either eating Storage quota
 * or overflowing localStorage in signed-out mode, and a wildly wrong file
 * type getting attached at all.
 */
export function validateTripFile(file: File): string | null {
  if (file.size > MAX_TRIP_FILE_BYTES) {
    return `That file is too large (max ${Math.round(MAX_TRIP_FILE_BYTES / (1024 * 1024))}MB).`;
  }
  const okType = ACCEPTED_TYPES.includes(file.type) || ACCEPTED_TYPE_PREFIXES.some((p) => file.type.startsWith(p));
  if (!okType) {
    return 'Only PDF and image files can be attached.';
  }
  return null;
}

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
