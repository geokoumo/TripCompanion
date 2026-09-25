-- F-04: list_trips()'s date range must match the app-wide "trip range = min/
-- max over legs, flights, and stays" convention (see getTripDateRange, and
-- the Phase 4.1 change that folded stays into it) — this function was left
-- on the older legs-only convention, so the Home list could show a
-- different, narrower range than the trip detail screen for a trip whose
-- range is actually defined by a flight or stay outside the leg span.
--
-- IMPORTANT: per the CRITICAL FIX in 20260913020000_fix_full_trip_regression.sql,
-- `create or replace function` has no memory of the version it replaces — this
-- is the complete 20260916000000_trip_cover_photo.sql version of list_trips()
-- (which already carries coverPhotoPath forward) with only the date-range
-- computation changed; nothing else differs.
create or replace function public.list_trips()
returns jsonb
language sql
stable
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', t.id,
    'title', t.title,
    'archived', t.archived,
    'startDate', least(
      (select min(l.start_date) from public.legs l where l.trip_id = t.id),
      (select min(f.dep_date) from public.flights f where f.trip_id = t.id),
      (select min(s.checkin_date) from public.stays s where s.trip_id = t.id)
    ),
    'endDate', greatest(
      (select max(l.end_date) from public.legs l where l.trip_id = t.id),
      (select max(f.arr_date) from public.flights f where f.trip_id = t.id),
      (select max(s.checkout_date) from public.stays s where s.trip_id = t.id)
    ),
    'cities', (select coalesce(jsonb_agg(l.city order by l.start_date), '[]'::jsonb)
               from public.legs l where l.trip_id = t.id),
    'travelers', (select coalesce(jsonb_agg(jsonb_build_object(
                    'name', tr.name, 'avatarColor', tr.avatar_color
                  )), '[]'::jsonb)
                  from public.travelers tr where tr.trip_id = t.id),
    'coverPhotoPath', t.cover_photo_path
  ) order by t.created_at desc), '[]'::jsonb)
  from public.trips t
  where t.user_id = auth.uid();
$$;

revoke all on function public.list_trips() from public;
grant execute on function public.list_trips() to authenticated;
