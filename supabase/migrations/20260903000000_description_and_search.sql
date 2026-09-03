-- ============================================================================
-- PROVISIONAL MIGRATION — not the tested add_description_and_search.sql
-- ============================================================================
-- Round 9's prompt described this file as already written and tested against
-- a real database, to be copied in verbatim. It wasn't actually included
-- with the prompt this was implemented from, so — consistent with this
-- project's rule of never fabricating SQL and presenting it as tested —
-- this file was authored from scratch instead, modeled closely on the
-- conventions already established in the other three migrations (same
-- column-naming, same jsonb_build_object shape, same auth.uid() ownership
-- scoping as list_trips()). It has NOT been run against a real database.
--
-- Before applying: if the real, tested add_description_and_search.sql is
-- available, use that file instead of this one. If you do apply this one,
-- treat it as a first draft — review it (especially search_trips, which
-- reads across four tables) the same way you would any other untested
-- migration, and swap it out with a corrected `create or replace` migration
-- if anything here turns out to be wrong, rather than editing this file in
-- place after it's been applied anywhere.
-- ============================================================================

alter table public.trips add column if not exists description text;

-- get_full_trip: superseded via create or replace (schema.sql /
-- full_trip_rpcs.sql are not edited directly) — identical to the version in
-- full_trip_rpcs.sql, with 'description' added.
create or replace function public.get_full_trip(_trip_id uuid)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'id', t.id,
    'title', t.title,
    'homeCurrency', t.home_currency,
    'archived', t.archived,
    'budget', t.budget,
    'description', t.description,
    'rememberedLocations', t.remembered_locations,
    'schemaVersion', t.schema_version,
    'createdAt', t.created_at,
    'shareSettings', jsonb_build_object(
      'enabled', t.share_enabled,
      'includedTabs', t.share_included_tabs,
      'shareToken', t.share_token
    ),
    'legs', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', l.id, 'city', l.city, 'country', l.country,
        'startDate', l.start_date, 'endDate', l.end_date,
        'currency', l.currency, 'exchangeRateToHome', l.exchange_rate_to_home
      )), '[]'::jsonb) from public.legs l where l.trip_id = t.id),
    'travelers', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', tr.id, 'name', tr.name, 'avatarColor', tr.avatar_color
      )), '[]'::jsonb) from public.travelers tr where tr.trip_id = t.id),
    'flights', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', f.id, 'legId', f.leg_id, 'airline', f.airline, 'flightNumber', f.flight_number,
        'depAirport', f.dep_airport, 'depDate', f.dep_date, 'depTime', f.dep_time,
        'arrAirport', f.arr_airport, 'arrDate', f.arr_date, 'arrTime', f.arr_time,
        'status', f.status, 'terminal', f.terminal, 'gate', f.gate,
        'bookingRef', f.booking_ref, 'link', f.link,
        'depTimezoneOverride', f.dep_timezone_override, 'arrTimezoneOverride', f.arr_timezone_override
      )), '[]'::jsonb) from public.flights f where f.trip_id = t.id),
    'stays', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', s.id, 'legId', s.leg_id, 'name', s.name, 'address', s.address, 'phone', s.phone,
        'checkinDate', s.checkin_date, 'checkinTime', s.checkin_time,
        'checkoutDate', s.checkout_date, 'checkoutTime', s.checkout_time,
        'bookingRef', s.booking_ref, 'notes', s.notes, 'link', s.link
      )), '[]'::jsonb) from public.stays s where s.trip_id = t.id),
    'itineraryStops', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', i.id, 'legId', i.leg_id, 'date', i.date, 'time', i.time, 'allDay', i.all_day,
        'durationMinutes', i.duration_minutes, 'title', i.title, 'type', i.type,
        'location', i.location, 'link', i.link, 'note', i.note, 'done', i.done,
        'travelerIds', (select coalesce(jsonb_agg(st.traveler_id), '[]'::jsonb)
                         from public.itinerary_stop_travelers st where st.stop_id = i.id)
      )), '[]'::jsonb) from public.itinerary_stops i where i.trip_id = t.id),
    'ideas', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', idea.id, 'title', idea.title, 'type', idea.type, 'location', idea.location,
        'link', idea.link, 'note', idea.note, 'suggestedDate', idea.suggested_date
      )), '[]'::jsonb) from public.ideas idea where idea.trip_id = t.id),
    'budgetCategories', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', c.id, 'name', c.name, 'color', c.color
      )), '[]'::jsonb) from public.budget_categories c where c.trip_id = t.id),
    'expenses', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', e.id, 'amount', e.amount, 'currency', e.currency,
        'exchangeRateToHome', e.exchange_rate_to_home, 'categoryId', e.category_id,
        'date', e.date, 'note', e.note, 'link', e.link, 'paidBy', e.paid_by,
        'splitAmong', (select coalesce(jsonb_agg(es.traveler_id), '[]'::jsonb)
                       from public.expense_split es where es.expense_id = e.id)
      )), '[]'::jsonb) from public.expenses e where e.trip_id = t.id),
    'checklistItems', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', ci.id, 'travelerId', ci.traveler_id, 'text', ci.text, 'category', ci.category,
        'quantity', ci.quantity, 'done', ci.done, 'link', ci.link
      )), '[]'::jsonb) from public.checklist_items ci where ci.trip_id = t.id)
  )
  from public.trips t
  where t.id = _trip_id and t.user_id = auth.uid();
$$;

-- upsert_full_trip: superseded via create or replace — identical to the
-- version in full_trip_rpcs.sql, persisting 'description' on insert/update.
create or replace function public.upsert_full_trip(_trip jsonb)
returns uuid
language plpgsql
as $$
declare
  _trip_id uuid := (_trip->>'id')::uuid;
  _owner uuid := auth.uid();
begin
  insert into public.trips (id, user_id, title, home_currency, archived, budget, description,
    remembered_locations, schema_version, created_at,
    share_enabled, share_token, share_included_tabs)
  values (
    _trip_id, _owner, _trip->>'title', coalesce(_trip->>'homeCurrency', 'EUR'),
    coalesce((_trip->>'archived')::boolean, false),
    nullif(_trip->>'budget', '')::numeric,
    nullif(_trip->>'description', ''),
    coalesce((select array_agg(x) from jsonb_array_elements_text(_trip->'rememberedLocations') x), '{}'),
    coalesce((_trip->>'schemaVersion')::int, 2),
    coalesce((_trip->>'createdAt')::timestamptz, now()),
    coalesce((_trip->'shareSettings'->>'enabled')::boolean, false),
    _trip->'shareSettings'->>'shareToken',
    coalesce((select array_agg(x) from jsonb_array_elements_text(_trip->'shareSettings'->'includedTabs') x), '{}')
  )
  on conflict (id) do update set
    user_id = _owner, -- no-op if already owner; RLS already prevents anyone else reaching this row
    title = excluded.title, home_currency = excluded.home_currency, archived = excluded.archived,
    budget = excluded.budget, description = excluded.description,
    remembered_locations = excluded.remembered_locations,
    schema_version = excluded.schema_version,
    share_enabled = excluded.share_enabled, share_token = excluded.share_token,
    share_included_tabs = excluded.share_included_tabs;

  -- Deletion order matters: expenses/checklist_items reference travelers and
  -- budget_categories (some RESTRICT, deliberately, per Phase 1's data-
  -- protection design) so they must be cleared FIRST, or those constraints
  -- block this very function from doing a legitimate update.
  delete from public.itinerary_stops where trip_id = _trip_id; -- cascades to itinerary_stop_travelers
  delete from public.expenses where trip_id = _trip_id; -- cascades to expense_split
  delete from public.checklist_items where trip_id = _trip_id;
  delete from public.budget_categories where trip_id = _trip_id;
  delete from public.travelers where trip_id = _trip_id;
  delete from public.legs where trip_id = _trip_id;
  delete from public.flights where trip_id = _trip_id;
  delete from public.stays where trip_id = _trip_id;
  delete from public.ideas where trip_id = _trip_id;

  insert into public.legs (id, trip_id, city, country, start_date, end_date, currency, exchange_rate_to_home)
  select (x->>'id')::uuid, _trip_id, x->>'city', x->>'country', (x->>'startDate')::date, (x->>'endDate')::date,
         x->>'currency', nullif(x->>'exchangeRateToHome','')::numeric
  from jsonb_array_elements(coalesce(_trip->'legs', '[]'::jsonb)) x;

  insert into public.travelers (id, trip_id, name, avatar_color)
  select (x->>'id')::uuid, _trip_id, x->>'name', x->>'avatarColor'
  from jsonb_array_elements(coalesce(_trip->'travelers', '[]'::jsonb)) x;

  insert into public.flights (id, trip_id, leg_id, airline, flight_number, dep_airport, dep_date, dep_time,
    arr_airport, arr_date, arr_time, status, terminal, gate, booking_ref, link,
    dep_timezone_override, arr_timezone_override)
  select (x->>'id')::uuid, _trip_id, nullif(x->>'legId','')::uuid, x->>'airline', x->>'flightNumber',
    x->>'depAirport', (x->>'depDate')::date, (x->>'depTime')::time,
    x->>'arrAirport', (x->>'arrDate')::date, (x->>'arrTime')::time,
    coalesce(x->>'status','scheduled'), x->>'terminal', x->>'gate', x->>'bookingRef', x->>'link',
    x->>'depTimezoneOverride', x->>'arrTimezoneOverride'
  from jsonb_array_elements(coalesce(_trip->'flights', '[]'::jsonb)) x;

  insert into public.stays (id, trip_id, leg_id, name, address, phone,
    checkin_date, checkin_time, checkout_date, checkout_time, booking_ref, notes, link)
  select (x->>'id')::uuid, _trip_id, nullif(x->>'legId','')::uuid, x->>'name', x->>'address', x->>'phone',
    (x->>'checkinDate')::date, (x->>'checkinTime')::time, (x->>'checkoutDate')::date, (x->>'checkoutTime')::time,
    x->>'bookingRef', x->>'notes', x->>'link'
  from jsonb_array_elements(coalesce(_trip->'stays', '[]'::jsonb)) x;

  insert into public.itinerary_stops (id, trip_id, leg_id, date, time, all_day, duration_minutes,
    title, type, location, link, note, done)
  select (x->>'id')::uuid, _trip_id, nullif(x->>'legId','')::uuid, (x->>'date')::date,
    nullif(x->>'time','')::time, coalesce((x->>'allDay')::boolean, false),
    nullif(x->>'durationMinutes','')::int, x->>'title', x->>'type', x->>'location', x->>'link', x->>'note',
    coalesce((x->>'done')::boolean, false)
  from jsonb_array_elements(coalesce(_trip->'itineraryStops', '[]'::jsonb)) x;

  insert into public.itinerary_stop_travelers (stop_id, traveler_id)
  select (x->>'id')::uuid, (tid.value)::uuid
  from jsonb_array_elements(coalesce(_trip->'itineraryStops', '[]'::jsonb)) x,
       jsonb_array_elements_text(coalesce(x->'travelerIds', '[]'::jsonb)) tid;

  insert into public.ideas (id, trip_id, title, type, location, link, note, suggested_date)
  select (x->>'id')::uuid, _trip_id, x->>'title', x->>'type', x->>'location', x->>'link', x->>'note',
    nullif(x->>'suggestedDate','')::date
  from jsonb_array_elements(coalesce(_trip->'ideas', '[]'::jsonb)) x;

  insert into public.budget_categories (id, trip_id, name, color)
  select (x->>'id')::uuid, _trip_id, x->>'name', x->>'color'
  from jsonb_array_elements(coalesce(_trip->'budgetCategories', '[]'::jsonb)) x;

  insert into public.expenses (id, trip_id, amount, currency, exchange_rate_to_home, category_id,
    date, note, link, paid_by)
  select (x->>'id')::uuid, _trip_id, (x->>'amount')::numeric, x->>'currency',
    nullif(x->>'exchangeRateToHome','')::numeric, (x->>'categoryId')::uuid, (x->>'date')::date,
    x->>'note', x->>'link', (x->>'paidBy')::uuid
  from jsonb_array_elements(coalesce(_trip->'expenses', '[]'::jsonb)) x;

  insert into public.expense_split (expense_id, traveler_id)
  select (x->>'id')::uuid, (tid.value)::uuid
  from jsonb_array_elements(coalesce(_trip->'expenses', '[]'::jsonb)) x,
       jsonb_array_elements_text(coalesce(x->'splitAmong', '[]'::jsonb)) tid;

  insert into public.checklist_items (id, trip_id, traveler_id, text, category, quantity, done, link)
  select (x->>'id')::uuid, _trip_id, (x->>'travelerId')::uuid, x->>'text', x->>'category',
    coalesce((x->>'quantity')::int, 1), coalesce((x->>'done')::boolean, false), x->>'link'
  from jsonb_array_elements(coalesce(_trip->'checklistItems', '[]'::jsonb)) x;

  return _trip_id;
end;
$$;

-- search_trips: across the signed-in user's own trips only (t.user_id =
-- auth.uid() on every branch, same ownership scoping as list_trips()) —
-- flight number/airline, stay name, itinerary stop title, expense note.
-- Grouped by trip so the client can render "which trip this matched in".
-- A blank query returns no rows rather than every trip.
create or replace function public.search_trips(_query text)
returns jsonb
language plpgsql
stable
as $$
declare
  _needle text := trim(coalesce(_query, ''));
  _result jsonb;
begin
  if _needle = '' then
    return '[]'::jsonb;
  end if;

  with matches as (
    select f.trip_id, 'flight'::text as type, f.id,
      (f.airline || ' ' || f.flight_number || ' · ' || f.dep_airport || ' → ' || f.arr_airport) as label,
      'flights'::text as tab
    from public.flights f
    join public.trips t on t.id = f.trip_id
    where t.user_id = auth.uid()
      and (f.flight_number ilike '%' || _needle || '%' or f.airline ilike '%' || _needle || '%')

    union all

    select s.trip_id, 'stay', s.id, s.name, 'stays'
    from public.stays s
    join public.trips t on t.id = s.trip_id
    where t.user_id = auth.uid() and s.name ilike '%' || _needle || '%'

    union all

    select i.trip_id, 'stop', i.id, i.title, 'itinerary'
    from public.itinerary_stops i
    join public.trips t on t.id = i.trip_id
    where t.user_id = auth.uid() and i.title ilike '%' || _needle || '%'

    union all

    select e.trip_id, 'expense', e.id, coalesce(e.note, ''), 'budget'
    from public.expenses e
    join public.trips t on t.id = e.trip_id
    where t.user_id = auth.uid() and e.note ilike '%' || _needle || '%'
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'tripId', grp.trip_id,
    'tripTitle', tr.title,
    'matches', grp.matches
  )), '[]'::jsonb)
  into _result
  from (
    select trip_id, jsonb_agg(jsonb_build_object('type', type, 'id', id, 'label', label, 'tab', tab)) as matches
    from matches
    group by trip_id
  ) grp
  join public.trips tr on tr.id = grp.trip_id;

  return _result;
end;
$$;

revoke all on function public.search_trips(text) from public;
grant execute on function public.search_trips(text) to authenticated;
