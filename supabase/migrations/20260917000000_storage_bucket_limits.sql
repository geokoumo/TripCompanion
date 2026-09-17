-- Server-side enforcement to match the client-side limits already documented
-- in src/data/storage/tripFilesBucket.ts (MAX_TRIP_FILE_BYTES = 10MB,
-- image/* + application/pdf). That file is explicit that its own
-- validateTripFile() is "a UX guard, not a security boundary" — a user could
-- always call the Storage API directly with their own credentials, bypassing
-- client-side checks entirely. This closes that gap by setting the same
-- limits on the bucket itself, so Supabase Storage rejects an oversized or
-- wrong-type upload regardless of what the client sends. No product-facing
-- behavior changes: a legitimate upload that already passes the client check
-- continues to pass this one too.

update storage.buckets
set file_size_limit = 10485760, -- 10 * 1024 * 1024, matches MAX_TRIP_FILE_BYTES
    allowed_mime_types = array['application/pdf', 'image/*']
where id = 'trip-files';
