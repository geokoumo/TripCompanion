# Security & data-access model

This documents the authentication, authorization, and data-access architecture, the security audit performed against it, and a manual checklist for verifying auth flows and RLS policies against a real Supabase project (this repo's sandbox environment cannot reach `*.supabase.co`, so none of this can be exercised live from here).

## Auth

- **Provider**: Supabase Auth (email/password), wired through `src/app/providers/AuthProvider.tsx`.
- **Sign up / sign in / sign out**: `signUp`, `signIn`, `signOut` wrap `supabase.auth.signUp/signInWithPassword/signOut`.
- **Forgot / reset password**: `resetPassword` calls `resetPasswordForEmail` with `redirectTo` pinned to `window.location.origin + pathname` (the app's own URL — never a client-supplied or query-string value, so this cannot be turned into an open redirect). `PASSWORD_RECOVERY` auth events flip `recoveryMode`, which gates the "set a new password" screen.
- **Persistent sessions / restoration**: `supabase.auth.getSession()` on mount plus `onAuthStateChange` keep `session` in sync; Supabase's client persists the session in local storage and refreshes tokens itself.
- **Protected / public routes**: `App.tsx` shows `LoadingScreen` while `loading`, the auth screen when `enabled && !user` (unless the user opts to continue with local-only data), and the main app otherwise. When no Supabase project is configured (`enabled === false`) the app runs entirely in local-only mode instead of blocking on auth.
- **Auth loading / error state**: `loading` drives the initial spinner; every auth action returns a human-readable error string (`authErrorMessage`) instead of throwing, shown via toast/inline caption.
- **Expired session handling**: `AuthProvider` distinguishes a user-initiated sign-out (`explicitSignOut` ref, set just before calling `signOut()`) from an unexpected `SIGNED_OUT` event on a previously-active session (expired/revoked token) and shows "Your session expired. Please sign in again." only for the latter.

## Data model

Tables (see `supabase/migrations/`, run in filename order): `profiles`, `trips`, `legs`, `travelers`, `flights`, `stays`, `itinerary_stops`, `itinerary_stop_travelers`, `ideas`, `budget_categories`, `expenses`, `expense_split`, `checklist_items`, `booking_items`, `documents`. All primary keys are `uuid` (`gen_random_uuid()` / client-generated UUIDs via `generateId()`).

Naming note versus the task's example list: `activities` = `itinerary_stops`, `bookings` = `booking_items`, `packing_items` = `checklist_items` — these already existed under those names before this change and were not renamed, to avoid an unrelated schema churn; the new repository functions (`activityRepository`, `bookingRepository`) use the requested naming at the code layer.

Every private table is tied to an authenticated user either directly (`profiles.id references auth.users(id)`, `trips.user_id`) or transitively through `trip_id -> trips.user_id` (every other table). `public.is_trip_owner(_trip_id)` centralizes that check for RLS policies.

## Row Level Security

Every table has RLS enabled with an "owner full access" policy (`using`/`with check` both `= auth.uid()` directly or via `is_trip_owner()`), so a user can only `SELECT`/`INSERT`/`UPDATE`/`DELETE` rows that resolve back to their own `auth.uid()` — never enforced only in the frontend. The one deliberate exception is `public.get_shared_trip(_token)`, a `SECURITY DEFINER` RPC that is the *only* anon-reachable read path for a trip's shared/read-only view; it looks the trip up by an unguessable share token rather than exposing a table-level anon `SELECT` policy (which would otherwise leak every user's shared trips to any authenticated anon key holder).

All RPCs (`get_full_trip`, `upsert_full_trip`, `search_trips`, `list_trips`) run as `SECURITY INVOKER` (the default — no `security definer` on any of them), so RLS still applies inside the function body; `upsert_full_trip` additionally stamps `_owner uuid := auth.uid()` server-side rather than trusting any client-submitted `user_id`/`trip.userId` field.

### Manual RLS verification checklist (run in Supabase SQL editor / two test accounts)

1. Create two users, A and B. Sign in as A, create a trip, note its id.
2. As A: `select * from trips where id = '<trip-id>';` → returns the row.
3. As B: same query → returns zero rows (not an error — RLS filters, doesn't 403).
4. As B: `select public.get_full_trip('<trip-id>');` → returns `null`/empty, not A's data.
5. As B: `update trips set title = 'pwned' where id = '<trip-id>';` → affects 0 rows.
6. As B: `insert into expenses (trip_id, ...) values ('<A-trip-id>', ...);` → rejected (no matching `is_trip_owner`).
7. Enable A's trip sharing, get the share token, then as an anon/unauthenticated client call `select public.get_shared_trip('<token>');` → returns only that trip's shared tabs, and `select * from trips;` as anon → returns zero rows.
8. In Storage, as B try to read/list a path under `<A's user id>/...` in the `trip-files` bucket → denied by the `(storage.foldername(name))[1] = auth.uid()::text` policy.

## Security audit findings

| Area | Finding |
|---|---|
| Exposed secrets | None found. No API keys, tokens, or credentials hardcoded anywhere in `src/`. |
| Service role key in frontend | Not present anywhere in the repo. Only `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are used client-side (`src/data/supabase/client.ts`), both meant to be public. |
| Unsafe environment variables | `.env` is gitignored and was never committed (verified via `git log -- .env`); `.env.example` holds only placeholder values. |
| Insecure API calls | All Supabase calls use the official `supabase-js` client over HTTPS; no hand-rolled `fetch`/XHR calls to Supabase REST/RPC endpoints. |
| Authorization gaps | None found — every table has an owner-scoped RLS policy; no anon-readable table-level policy exists. |
| IDOR-style access | Storage paths and RPC parameters (`userId`, `_trip_id`) are client-supplied, but every one of them is re-checked server-side against `auth.uid()` (RLS policy or `_owner := auth.uid()` in the RPC body) — a client sending someone else's id gets zero rows / a rejected write, not their data. |
| Trusting client-provided user IDs | `upsert_full_trip` ignores any client-submitted owner id and stamps `auth.uid()` itself; the Storage policy re-derives ownership from the authenticated JWT via `(storage.foldername(name))[1] = auth.uid()::text`, not from the path a client constructs. |
| Unsafe document access | Documents are served via `createSignedUrl` (1-hour expiry, `src/data/storage/tripFilesBucket.ts`), never a public URL; the bucket is private and RLS-scoped. |
| Unsafe redirects | The only `redirectTo` in the codebase (password reset) is built from `window.location.origin`, never from user/query input. |
| Unsafe HTML rendering | No `dangerouslySetInnerHTML`, `eval`, `new Function`, or `document.write` anywhere in `src/`. |

## Data access layer

Components don't perform arbitrary Supabase queries directly. Reads/writes go through:

- `TripRepository` (`LocalStorageTripRepository` / `SupabaseTripRepository`) — the whole-trip aggregate, backed by the atomic `get_full_trip`/`upsert_full_trip` RPCs (chosen deliberately: one transaction per save, delete-and-reinsert child rows, rather than N separate table writes that could partially fail).
- `profileRepository.getOwnProfile()` — reads the caller's own `profiles` row (RLS-scoped, no id parameter to misuse).
- `expenseRepository.upsertExpense`, `documentRepository.{addDocument,replaceDocumentFile,removeDocument}`, `activityRepository.upsertItineraryStop`, `bookingRepository.upsertBookingItem` — pure `Trip -> Trip` functions that centralize the per-entity update logic previously inlined in each screen (`ExpensesView`, `AddDocumentForm`/`DocumentDetailSheet`, `ItineraryTab`, `BookingItemsListScreen`). They compose with the existing `updateTrip` callback rather than issuing their own Supabase calls, so the app keeps its one-transaction-per-save model instead of fragmenting a trip's save into five independent network calls. Deletion for all entity arrays already went through the shared `deleteEntityWithUndo` helper and was left as-is.

Business logic (conflict detection, itinerary-stop linking, currency conversion, Trip Health scoring) lives in `features/*/lib/`, separate from both the UI and the repository/data layer.

## No AI

No AI/LLM integration was added as part of this work, per the request.
