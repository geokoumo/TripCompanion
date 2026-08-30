-- Trip Companion — Phase 1 Schema & RLS
-- Mirrors the TypeScript domain model in src/features/*/types.ts exactly, field for field.
-- Run in the Supabase SQL editor (or via a migration file) in a fresh project.

-- ============================================================================
-- A note on the sharing design, before the schema — read this first
-- ============================================================================
-- The obvious way to build "anyone with the link can read a shared trip" is a
-- straightforward RLS policy like:
--
--   create policy "anon can read shared trips"
--   on trips for select to anon
--   using (share_enabled = true);
--
-- This is a real vulnerability, not just imprecise: RLS filters rows, it
-- doesn't validate the *query itself*. That policy would let anyone with the
-- public anon key run `select * from trips` and get back EVERY user's shared
-- trip, not just the one they were actually given a link to — because the
-- token the visitor supposedly has isn't part of the policy condition at all.
--
-- Instead: no table gets a direct anon SELECT policy. Sharing works through a
-- single SECURITY DEFINER function, get_shared_trip(token), which is the only
-- thing granted to the anon role. It looks up the trip by token internally,
-- checks share_enabled, and returns only the tabs actually included — so
-- there is no "list shared trips" surface at all, only "resolve this exact
-- token to its one trip," which is what an unguessable token is for.

-- ============================================================================
-- Extensions
-- ============================================================================
create extension if not exists pgcrypto; -- gen_random_uuid()

-- ============================================================================
-- trips
-- ============================================================================
create table public.trips (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  title                text not null check (length(trim(title)) > 0),
  home_currency        text not null default 'EUR',
  archived             boolean not null default false,
  budget               numeric(10,2) check (budget is null or budget >= 0),
  remembered_locations text[] not null default '{}',
  schema_version       int not null default 2,
  created_at           timestamptz not null default now(),

  -- Sharing. share_token is only ever set when sharing is turned on, and is
  -- the sole credential get_shared_trip() accepts — never the trip's own id.
  share_enabled        boolean not null default false,
  share_token          text,
  share_included_tabs  text[] not null default '{}'
    check (share_included_tabs <@ array['overview','flights','stays','itinerary','budget','checklist']::text[])
);

create index trips_user_id_idx on public.trips(user_id);
-- Partial unique index: only enforced while a token is actually set, so
-- turning sharing off and clearing the token doesn't collide with anything.
create unique index trips_share_token_idx on public.trips(share_token) where share_token is not null;

-- ============================================================================
-- legs
-- ============================================================================
create table public.legs (
  id                     uuid primary key default gen_random_uuid(),
  trip_id                uuid not null references public.trips(id) on delete cascade,
  city                   text not null,
  country                text not null,
  start_date             date not null,
  end_date               date not null check (end_date >= start_date),
  currency               text not null,
  exchange_rate_to_home  numeric(12,6) check (exchange_rate_to_home is null or exchange_rate_to_home > 0)
);
create index legs_trip_id_idx on public.legs(trip_id);

-- ============================================================================
-- travelers
-- ============================================================================
create table public.travelers (
  id            uuid primary key default gen_random_uuid(),
  trip_id       uuid not null references public.trips(id) on delete cascade,
  name          text not null check (length(trim(name)) > 0),
  avatar_color  text not null check (avatar_color in ('avatar-1','avatar-2','avatar-3','avatar-4'))
);
create index travelers_trip_id_idx on public.travelers(trip_id);

-- ============================================================================
-- flights
-- ============================================================================
create table public.flights (
  id                       uuid primary key default gen_random_uuid(),
  trip_id                  uuid not null references public.trips(id) on delete cascade,
  leg_id                   uuid references public.legs(id) on delete set null,
  airline                  text not null,
  flight_number            text not null,
  dep_airport              text not null,
  dep_date                 date not null,
  dep_time                 time not null,
  arr_airport              text not null,
  arr_date                 date not null,
  arr_time                 time not null,
  status                   text not null default 'scheduled'
    check (status in ('scheduled','delayed','cancelled','landed')),
  terminal                 text,
  gate                     text,
  booking_ref              text,
  link                     text,
  -- Manual timezone override for airports not in the app's static table.
  dep_timezone_override    text,
  arr_timezone_override    text
  -- Real chronological ordering (dep before arr, timezone-aware) is validated
  -- app-side via lib/flightTime.ts — a plain SQL CHECK can't do IANA-aware
  -- comparisons, so this is intentionally not enforced at the DB level.
);
create index flights_trip_id_idx on public.flights(trip_id);

-- ============================================================================
-- stays
-- ============================================================================
create table public.stays (
  id             uuid primary key default gen_random_uuid(),
  trip_id        uuid not null references public.trips(id) on delete cascade,
  leg_id         uuid references public.legs(id) on delete set null,
  name           text not null,
  address        text not null,
  phone          text,
  checkin_date   date not null,
  checkin_time   time not null,
  checkout_date  date not null,
  checkout_time  time not null,
  booking_ref    text,
  notes          text,
  link           text,
  check ((checkout_date, checkout_time) >= (checkin_date, checkin_time))
);
create index stays_trip_id_idx on public.stays(trip_id);

-- ============================================================================
-- itinerary_stops
-- ============================================================================
create table public.itinerary_stops (
  id                uuid primary key default gen_random_uuid(),
  trip_id           uuid not null references public.trips(id) on delete cascade,
  leg_id            uuid references public.legs(id) on delete set null,
  date              date not null,
  time              time,                    -- null only when all_day = true
  all_day           boolean not null default false,
  duration_minutes  int check (duration_minutes is null or duration_minutes > 0),
  title             text not null,
  type              text not null check (type in ('food','sight','transport','shop','rest')),
  location          text,
  link              text,
  note              text,
  done              boolean not null default false,
  check (all_day or time is not null)
);
create index itinerary_stops_trip_id_idx on public.itinerary_stops(trip_id);
create index itinerary_stops_date_idx on public.itinerary_stops(trip_id, date);

-- Join table for a stop's travelerIds[]. No rows for a stop = applies to
-- everyone (matches the app's existing "empty array = all travelers" rule).
create table public.itinerary_stop_travelers (
  stop_id      uuid not null references public.itinerary_stops(id) on delete cascade,
  traveler_id  uuid not null references public.travelers(id) on delete cascade,
  primary key (stop_id, traveler_id)
);

-- ============================================================================
-- ideas (unscheduled itinerary backlog)
-- ============================================================================
create table public.ideas (
  id              uuid primary key default gen_random_uuid(),
  trip_id         uuid not null references public.trips(id) on delete cascade,
  title           text not null,
  type            text not null check (type in ('food','sight','transport','shop','rest')),
  location        text,
  link            text,
  note            text,
  suggested_date  date
);
create index ideas_trip_id_idx on public.ideas(trip_id);

-- ============================================================================
-- budget_categories
-- ============================================================================
create table public.budget_categories (
  id      uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name    text not null check (length(trim(name)) > 0),
  color   text not null check (color in ('rust','teal','brass','purple','gray'))
);
create index budget_categories_trip_id_idx on public.budget_categories(trip_id);

-- ============================================================================
-- expenses
-- ============================================================================
-- category_id/paid_by use ON DELETE RESTRICT deliberately: a category or a
-- traveler with real financial history attached shouldn't be silently
-- deletable out from under that history. The app should require reassigning
-- or clearing an expense's category/payer before letting a delete through,
-- rather than the database quietly orphaning money data.
create table public.expenses (
  id                     uuid primary key default gen_random_uuid(),
  trip_id                uuid not null references public.trips(id) on delete cascade,
  amount                 numeric(10,2) not null check (amount > 0),
  currency               text not null,
  exchange_rate_to_home  numeric(12,6) check (exchange_rate_to_home is null or exchange_rate_to_home > 0),
  category_id            uuid not null references public.budget_categories(id) on delete restrict,
  date                   date not null,
  note                   text,
  link                   text,
  paid_by                uuid not null references public.travelers(id) on delete restrict
);
create index expenses_trip_id_idx on public.expenses(trip_id);

-- Join table for splitAmong[]. Unlike checklist items, this is financial
-- history — see the note on expenses above re: on delete restrict.
create table public.expense_split (
  expense_id   uuid not null references public.expenses(id) on delete cascade,
  traveler_id  uuid not null references public.travelers(id) on delete restrict,
  primary key (expense_id, traveler_id)
);

-- ============================================================================
-- checklist_items
-- ============================================================================
-- traveler_id cascades here, unlike expenses/expense_split — a personal
-- packing item genuinely belongs to that person; if they're removed from the
-- trip, discarding their checklist is the right default (open question below).
create table public.checklist_items (
  id           uuid primary key default gen_random_uuid(),
  trip_id      uuid not null references public.trips(id) on delete cascade,
  traveler_id  uuid not null references public.travelers(id) on delete cascade,
  text         text not null,
  category     text not null,
  quantity     int not null default 1 check (quantity > 0),
  done         boolean not null default false,
  link         text
);
create index checklist_items_trip_id_idx on public.checklist_items(trip_id);

-- ============================================================================
-- Row Level Security — owner access
-- ============================================================================
-- One helper, reused by every child table's policies, instead of repeating
-- the same subquery everywhere.
create or replace function public.is_trip_owner(_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.trips
    where id = _trip_id and user_id = auth.uid()
  );
$$;

alter table public.trips enable row level security;
alter table public.legs enable row level security;
alter table public.travelers enable row level security;
alter table public.flights enable row level security;
alter table public.stays enable row level security;
alter table public.itinerary_stops enable row level security;
alter table public.itinerary_stop_travelers enable row level security;
alter table public.ideas enable row level security;
alter table public.budget_categories enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_split enable row level security;
alter table public.checklist_items enable row level security;

-- trips: owner has full access, full stop. No anon policy on this table —
-- see the note at the top of this file.
create policy "owner full access" on public.trips
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Every child table gets the identical shape: owner full access via the
-- parent trip, no anon policy at all.
create policy "owner full access" on public.legs
  for all to authenticated using (is_trip_owner(trip_id)) with check (is_trip_owner(trip_id));
create policy "owner full access" on public.travelers
  for all to authenticated using (is_trip_owner(trip_id)) with check (is_trip_owner(trip_id));
create policy "owner full access" on public.flights
  for all to authenticated using (is_trip_owner(trip_id)) with check (is_trip_owner(trip_id));
create policy "owner full access" on public.stays
  for all to authenticated using (is_trip_owner(trip_id)) with check (is_trip_owner(trip_id));
create policy "owner full access" on public.itinerary_stops
  for all to authenticated using (is_trip_owner(trip_id)) with check (is_trip_owner(trip_id));
create policy "owner full access" on public.ideas
  for all to authenticated using (is_trip_owner(trip_id)) with check (is_trip_owner(trip_id));
create policy "owner full access" on public.budget_categories
  for all to authenticated using (is_trip_owner(trip_id)) with check (is_trip_owner(trip_id));
create policy "owner full access" on public.expenses
  for all to authenticated using (is_trip_owner(trip_id)) with check (is_trip_owner(trip_id));
create policy "owner full access" on public.checklist_items
  for all to authenticated using (is_trip_owner(trip_id)) with check (is_trip_owner(trip_id));

-- Join tables check ownership via their parent row rather than a trip_id
-- column of their own.
create policy "owner full access" on public.itinerary_stop_travelers
  for all to authenticated
  using (exists (select 1 from public.itinerary_stops s where s.id = stop_id and is_trip_owner(s.trip_id)))
  with check (exists (select 1 from public.itinerary_stops s where s.id = stop_id and is_trip_owner(s.trip_id)));
create policy "owner full access" on public.expense_split
  for all to authenticated
  using (exists (select 1 from public.expenses e where e.id = expense_id and is_trip_owner(e.trip_id)))
  with check (exists (select 1 from public.expenses e where e.id = expense_id and is_trip_owner(e.trip_id)));

-- ============================================================================
-- Sharing — the only anonymous access path, via one function
-- ============================================================================
-- Returns a JSON object assembled server-side, containing only the tabs the
-- owner actually included when the link was generated. The frontend's shared
-- view renders directly from this — it never queries the tables above with
-- the anon key.
create or replace function public.get_shared_trip(_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  _trip record;
  _result jsonb;
begin
  select * into _trip from public.trips
    where share_token = _token and share_enabled = true;

  if not found then
    return null;
  end if;

  _result := jsonb_build_object(
    'id', _trip.id,
    'title', _trip.title,
    'homeCurrency', _trip.home_currency,
    'includedTabs', _trip.share_included_tabs,
    'legs', (select coalesce(jsonb_agg(l), '[]'::jsonb) from public.legs l where l.trip_id = _trip.id),
    'travelers', (select coalesce(jsonb_agg(t), '[]'::jsonb) from public.travelers t where t.trip_id = _trip.id)
  );

  if 'flights' = any(_trip.share_included_tabs) then
    _result := _result || jsonb_build_object('flights',
      (select coalesce(jsonb_agg(f), '[]'::jsonb) from public.flights f where f.trip_id = _trip.id));
  end if;

  if 'stays' = any(_trip.share_included_tabs) then
    _result := _result || jsonb_build_object('stays',
      (select coalesce(jsonb_agg(s), '[]'::jsonb) from public.stays s where s.trip_id = _trip.id));
  end if;

  if 'itinerary' = any(_trip.share_included_tabs) then
    _result := _result || jsonb_build_object('itineraryStops',
      (select coalesce(jsonb_agg(i), '[]'::jsonb) from public.itinerary_stops i where i.trip_id = _trip.id));
  end if;

  if 'budget' = any(_trip.share_included_tabs) then
    _result := _result || jsonb_build_object(
      'budgetCategories', (select coalesce(jsonb_agg(c), '[]'::jsonb) from public.budget_categories c where c.trip_id = _trip.id),
      'expenses', (select coalesce(jsonb_agg(e), '[]'::jsonb) from public.expenses e where e.trip_id = _trip.id)
    );
  end if;

  if 'checklist' = any(_trip.share_included_tabs) then
    _result := _result || jsonb_build_object('checklistItems',
      (select coalesce(jsonb_agg(ci), '[]'::jsonb) from public.checklist_items ci where ci.trip_id = _trip.id));
  end if;

  return _result;
end;
$$;

revoke all on function public.get_shared_trip(text) from public;
grant execute on function public.get_shared_trip(text) to anon, authenticated;
