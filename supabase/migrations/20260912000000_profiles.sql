-- Trip Companion — profiles
--
-- A normal, joinable, RLS-controllable table for user-facing profile data,
-- distinct from auth.users. auth.users.raw_user_meta_data (what signUp's
-- `options.data` writes today) is client-writable by design and lives in a
-- Supabase-managed schema that isn't meant for arbitrary joins or its own
-- RLS policies — fine for "the name I typed at signup," not a foundation to
-- build more profile fields on. This table is that foundation.
--
-- Populated automatically on signup via a trigger — never something the
-- client inserts directly — so every authenticated user always has exactly
-- one row, with no path for a client to create a profile for a different
-- user id.

create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "owner full access"
  on public.profiles for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Runs as the function owner (SECURITY DEFINER), not the new user, because
-- at the instant this fires the new row in auth.users isn't visible under
-- the new user's own session yet — this is the standard, narrow exception:
-- the function does exactly one insert of a row whose id is hard-pinned to
-- NEW.id, nothing a client ever calls directly, and it's not reachable any
-- other way (no execute grant to anon/authenticated).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill for any account created before this migration existed.
insert into public.profiles (id, display_name)
select u.id, u.raw_user_meta_data->>'name'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

create or replace function public.touch_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.touch_profile_updated_at();
