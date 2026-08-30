-- list_trips: lightweight data for the Home screen list — avoids calling
-- get_full_trip() (which assembles every nested table) once per trip just
-- to render a card. Derives the date range from legs' min/max, same
-- convention as the app's own "trip dates come from legs" rule.
create or replace function public.list_trips()
returns jsonb
language sql
stable
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', t.id,
    'title', t.title,
    'archived', t.archived,
    'startDate', (select min(l.start_date) from public.legs l where l.trip_id = t.id),
    'endDate', (select max(l.end_date) from public.legs l where l.trip_id = t.id),
    'cities', (select coalesce(jsonb_agg(l.city order by l.start_date), '[]'::jsonb)
               from public.legs l where l.trip_id = t.id),
    'travelers', (select coalesce(jsonb_agg(jsonb_build_object(
                    'name', tr.name, 'avatarColor', tr.avatar_color
                  )), '[]'::jsonb)
                  from public.travelers tr where tr.trip_id = t.id)
  ) order by t.created_at desc), '[]'::jsonb)
  from public.trips t
  where t.user_id = auth.uid();
$$;

revoke all on function public.list_trips() from public;
grant execute on function public.list_trips() to authenticated;
