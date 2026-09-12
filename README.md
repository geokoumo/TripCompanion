# Trip Companion

Personal, hands-on travel-planning app. Works fully offline with local-only data, and optionally syncs across devices via Supabase account sign-in.

## Develop

```bash
npm install
npm run dev
```

## Test

```bash
npm run test
```

## Build

```bash
npm run build   # outputs to dist/
npm run preview # serve the production build locally
```

## Deploy

The app is a static Vite build with no server component — any static host works.

**Vercel**: import the repo at [vercel.com/new](https://vercel.com/new); it auto-detects Vite (build command `npm run build`, output `dist`). No config needed.

**Netlify**: `netlify.toml` is already included (`netlify deploy --prod`, or import the repo at app.netlify.com).

Once deployed, open the URL on your phone — without a Supabase account configured, data is stored entirely in that browser's `localStorage`, so add the page to your home screen for quick access during the trip.

## Account sync (Supabase) — optional

The app works with zero configuration in local-only mode (no accounts, `localStorage` only). To enable account sign-in and cross-device sync:

### 1. Create a Supabase project

Create a project at [supabase.com](https://supabase.com), then grab its URL and anon/public key from **Project Settings → API**.

### 2. Set environment variables

Copy `.env.example` to `.env` and fill in both values:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

**Never commit `.env`** — it's already in `.gitignore`. Only the anon/public key is ever used client-side; the service role key must never be placed in this project's frontend code or any `VITE_`-prefixed variable (anything prefixed `VITE_` is bundled into the client build and publicly readable).

### 3. Run the database migrations

In the Supabase SQL Editor (or via the Supabase CLI), run every file under `supabase/migrations/` **in filename order** (they're timestamp-prefixed):

1. `20260826140000_initial_schema.sql` — core tables (`trips`, `travelers`, `flights`, `stays`, `itinerary_stops`, `ideas`, `budget_categories`, `expenses`, `checklist_items`), RLS policies scoping every row to its owning trip's `user_id = auth.uid()`, and trip-sharing support.
2. `20260830000000_full_trip_rpcs.sql` — `get_full_trip`/`upsert_full_trip`/`search_trips` RPCs the app uses instead of raw table access (see Security below).
3. `20260831000000_list_trips.sql` — the lightweight `list_trips` RPC backing the Home screen.
4. `20260903000000_description_and_search.sql` — adds the trip `description` column and search support.
5. `20260908000000_booking_items_and_documents.sql` — `booking_items`/`documents` tables, RLS, and the private `trip-files` Storage bucket + its path-scoped storage policy.
6. `20260912000000_profiles.sql` — `public.profiles` table (one row per user, auto-populated on sign-up via a trigger on `auth.users`), RLS, and `display_name` support.

Each migration is idempotent-safe to re-run only in the sense that it's written once per environment — run them once, in order, against a fresh project.

### 4. Auth settings

In **Authentication → URL Configuration**, set the Site URL (and any additional redirect URLs) to wherever the app is hosted — this is where Supabase sends the user after clicking a password-reset email link.

Email confirmation, password-reset emails, and session length are configured entirely in the Supabase dashboard under **Authentication → Providers/Settings**; the app doesn't hardcode any of that.

See `SECURITY.md` for the full data-access and RLS model, and a manual verification checklist for auth flows and database policies.
