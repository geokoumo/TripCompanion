-- Trip Companion — Round 11: multi-type bookings + documents
-- New tables only; get_full_trip/upsert_full_trip/search_trips are superseded
-- via create or replace (never edit the earlier migration files directly).

-- ============================================================================
-- booking_items — Sights, Restaurants, Bars, Transport, Tickets, Activities,
-- Other. Flights and Stays keep their own dedicated tables (untouched) — the
-- PDF spec treats those as their own thing throughout, separate icons and
-- list screens, and this table is deliberately not a fourth home for them.
-- ============================================================================
create table public.booking_items (
  id                uuid primary key default gen_random_uuid(),
  trip_id           uuid not null references public.trips(id) on delete cascade,
  leg_id            uuid references public.legs(id) on delete set null,
  type              text not null check (type in ('sight','restaurant','bar','transport','ticket','activity','other')),
  name              text not null check (length(trim(name)) > 0),
  location          text,
  address           text,
  date              date,
  start_time        time,
  end_time          time check (end_time is null or start_time is null or end_time >= start_time),
  price             numeric(10,2) check (price is null or price >= 0),
  currency          text,
  booking_reference text,
  notes             text,
  party_size        int check (party_size is null or party_size > 0),
  -- Category-specific fields that only make sense for one type (cuisine type
  -- and price range for a restaurant, car/seat/platform for transport, the
  -- sub-category picker for a sight, ...) — a flexible bag rather than a
  -- rigid column per type, per the round's spec.
  details           jsonb not null default '{}'::jsonb
);
create index booking_items_trip_id_idx on public.booking_items(trip_id);
create index booking_items_type_idx on public.booking_items(trip_id, type);

alter table public.booking_items enable row level security;
create policy "owner full access" on public.booking_items
  for all to authenticated using (is_trip_owner(trip_id)) with check (is_trip_owner(trip_id));

-- ============================================================================
-- documents — boarding passes, hotel confirmations, tickets, insurance, etc.
-- storage_path points into the shared "trip-files" Storage bucket created
-- below (also intended for a future cover-photo feature — one bucket, not a
-- second separately-configured one).
-- ============================================================================
create table public.documents (
  id           uuid primary key default gen_random_uuid(),
  trip_id      uuid not null references public.trips(id) on delete cascade,
  category     text not null check (category in ('boarding_pass','hotel_confirmation','ticket','insurance','other')),
  title        text not null check (length(trim(title)) > 0),
  -- Free text describing what this document is attached to (e.g. "ATH → NRT
  -- flight"), set by the caller when uploading from a specific flight/stay/
  -- booking-item form. Not a foreign key — the PDF spec calls this out as
  -- "optional free text or a reference", and the source record can be any of
  -- four different tables, so a plain label is simpler than a polymorphic FK.
  related_to   text,
  file_type    text not null check (file_type in ('pdf','image','qr')),
  storage_path text not null,
  uploaded_at  timestamptz not null default now()
);
create index documents_trip_id_idx on public.documents(trip_id);
create index documents_category_idx on public.documents(trip_id, category);

alter table public.documents enable row level security;
create policy "owner full access" on public.documents
  for all to authenticated using (is_trip_owner(trip_id)) with check (is_trip_owner(trip_id));

-- ============================================================================
-- Storage — one shared private bucket for all user-uploaded trip files
-- (documents today; a future cover-photo feature belongs in this same
-- bucket, not a second one). Path convention: {user_id}/{trip_id}/{filename}
-- — RLS checks the leading folder against auth.uid(), same ownership shape
-- as every table above.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('trip-files', 'trip-files', false)
on conflict (id) do nothing;

create policy "owner full access to own trip-files"
  on storage.objects for all to authenticated
  using (bucket_id = 'trip-files' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'trip-files' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================================
-- get_full_trip / upsert_full_trip — superseded via create or replace,
-- identical to the 20260903000000 version with bookingItems + documents added.
-- ============================================================================
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
    'bookingItems', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', b.id, 'legId', b.leg_id, 'type', b.type, 'name', b.name, 'location', b.location,
        'address', b.address, 'date', b.date, 'startTime', b.start_time, 'endTime', b.end_time,
        'price', b.price, 'currency', b.currency, 'bookingReference', b.booking_reference,
        'notes', b.notes, 'partySize', b.party_size, 'details', b.details
      )), '[]'::jsonb) from public.booking_items b where b.trip_id = t.id),
    'documents', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', d.id, 'category', d.category, 'title', d.title, 'relatedTo', d.related_to,
        'fileType', d.file_type, 'storagePath', d.storage_path, 'uploadedAt', d.uploaded_at
      )), '[]'::jsonb) from public.documents d where d.trip_id = t.id),
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
  delete from public.booking_items where trip_id = _trip_id;
  delete from public.documents where trip_id = _trip_id;

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

  insert into public.booking_items (id, trip_id, leg_id, type, name, location, address, date,
    start_time, end_time, price, currency, booking_reference, notes, party_size, details)
  select (x->>'id')::uuid, _trip_id, nullif(x->>'legId','')::uuid, x->>'type', x->>'name',
    x->>'location', x->>'address', nullif(x->>'date','')::date,
    nullif(x->>'startTime','')::time, nullif(x->>'endTime','')::time,
    nullif(x->>'price','')::numeric, x->>'currency', x->>'bookingReference', x->>'notes',
    nullif(x->>'partySize','')::int, coalesce(x->'details', '{}'::jsonb)
  from jsonb_array_elements(coalesce(_trip->'bookingItems', '[]'::jsonb)) x;

  insert into public.documents (id, trip_id, category, title, related_to, file_type, storage_path, uploaded_at)
  select (x->>'id')::uuid, _trip_id, x->>'category', x->>'title', x->>'relatedTo', x->>'fileType',
    x->>'storagePath', coalesce((x->>'uploadedAt')::timestamptz, now())
  from jsonb_array_elements(coalesce(_trip->'documents', '[]'::jsonb)) x;

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

-- search_trips: superseded via create or replace, adding booking_items as a
-- fifth matched entity type alongside flights/stays/itinerary/expenses.
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

    union all

    -- Tab is 'flights' (not a new tab id) — the Bookings screen's specific
    -- sub-view (Sights/Restaurants/...) is client-side UI state, not part of
    -- the route, so a booking-item match lands on the Bookings tab's default
    -- view rather than deep-linking into one exact sub-type.
    select b.trip_id, 'booking', b.id, b.name, 'flights'
    from public.booking_items b
    join public.trips t on t.id = b.trip_id
    where t.user_id = auth.uid() and b.name ilike '%' || _needle || '%'
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

revoke all on function public.get_full_trip(uuid) from public;
grant execute on function public.get_full_trip(uuid) to authenticated;
revoke all on function public.upsert_full_trip(jsonb) from public;
grant execute on function public.upsert_full_trip(jsonb) to authenticated;
revoke all on function public.search_trips(text) from public;
grant execute on function public.search_trips(text) to authenticated;
