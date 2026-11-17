-- Private, rate-limited alert state. No user-facing role can read these tables.
create table if not exists private.security_alert_cooldowns (
  alert_key text primary key check (alert_key ~ '^[a-z0-9][a-z0-9:_-]{0,79}$'),
  last_sent_at timestamptz not null default '-infinity'::timestamptz,
  suppressed_count integer not null default 0 check (suppressed_count >= 0)
);

create table if not exists private.security_admin_signins (
  admin_user_id uuid primary key,
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  device_hash bytea check (device_hash is null or octet_length(device_hash) = 32),
  last_login_at timestamptz not null default pg_catalog.clock_timestamp()
);

create table if not exists private.security_signal_windows (
  signal_key text primary key check (signal_key in ('client-errors', 'order-volume')),
  window_started_at timestamptz not null,
  event_count integer not null check (event_count >= 0),
  last_alert_at timestamptz
);

alter table private.security_alert_cooldowns enable row level security;
alter table private.security_admin_signins enable row level security;
alter table private.security_signal_windows enable row level security;

revoke all on table private.security_alert_cooldowns from public, anon, authenticated, service_role;
revoke all on table private.security_admin_signins from public, anon, authenticated, service_role;
revoke all on table private.security_signal_windows from public, anon, authenticated, service_role;

create or replace function public.claim_security_alert(
  p_alert_key text,
  p_cooldown_seconds integer
)
returns table (should_send boolean, suppressed_count integer)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_last_sent timestamptz;
  v_suppressed integer;
begin
  if p_alert_key is null
     or p_alert_key !~ '^[a-z0-9][a-z0-9:_-]{0,79}$'
     or p_cooldown_seconds is null
     or p_cooldown_seconds < 30
     or p_cooldown_seconds > 86400 then
    raise exception 'Invalid security alert cooldown parameters'
      using errcode = '22023';
  end if;

  insert into private.security_alert_cooldowns (alert_key)
  values (p_alert_key)
  on conflict (alert_key) do nothing;

  select c.last_sent_at, c.suppressed_count
    into v_last_sent, v_suppressed
  from private.security_alert_cooldowns as c
  where c.alert_key = p_alert_key
  for update;

  if v_last_sent <= v_now - (p_cooldown_seconds * interval '1 second') then
    update private.security_alert_cooldowns as c
    set last_sent_at = v_now, suppressed_count = 0
    where c.alert_key = p_alert_key;
    return query select true, v_suppressed;
    return;
  end if;

  update private.security_alert_cooldowns as c
  set suppressed_count = c.suppressed_count + 1
  where c.alert_key = p_alert_key
  returning c.suppressed_count into v_suppressed;

  return query select false, v_suppressed;
end;
$function$;

create or replace function public.record_admin_security_signin(
  p_admin_user_id uuid,
  p_country_code text,
  p_device_hash text
)
returns table (is_new_country boolean, is_new_device boolean, is_baseline boolean)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_rows integer;
  v_old_country text;
  v_old_device bytea;
  v_device bytea;
  v_new_country boolean := false;
  v_new_device boolean := false;
begin
  if p_admin_user_id is null
     or p_country_code is not null and p_country_code !~ '^[A-Z]{2}$'
     or p_device_hash is null
     or p_device_hash !~ '^[0-9a-fA-F]{64}$' then
    raise exception 'Invalid admin sign-in fingerprint'
      using errcode = '22023';
  end if;

  v_device := pg_catalog.decode(p_device_hash, 'hex');

  insert into private.security_admin_signins (
    admin_user_id, country_code, device_hash, last_login_at
  )
  values (p_admin_user_id, p_country_code, v_device, pg_catalog.clock_timestamp())
  on conflict (admin_user_id) do nothing;

  get diagnostics v_rows = row_count;
  if v_rows = 1 then
    return query select false, false, true;
    return;
  end if;

  select s.country_code, s.device_hash
    into v_old_country, v_old_device
  from private.security_admin_signins as s
  where s.admin_user_id = p_admin_user_id
  for update;

  v_new_country := p_country_code is not null
    and v_old_country is not null
    and p_country_code <> v_old_country;

  v_new_device := v_old_device is not null and v_old_device <> v_device;

  update private.security_admin_signins as s
  set country_code = coalesce(p_country_code, s.country_code),
      device_hash = v_device,
      last_login_at = pg_catalog.clock_timestamp()
  where s.admin_user_id = p_admin_user_id;

  return query select v_new_country, v_new_device, false;
end;
$function$;

create or replace function public.record_security_signal(
  p_signal_key text,
  p_threshold integer,
  p_window_seconds integer,
  p_cooldown_seconds integer
)
returns table (should_alert boolean, event_count integer)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_started timestamptz;
  v_count integer;
  v_last_alert timestamptz;
  v_alert boolean := false;
begin
  if p_signal_key is null
     or p_signal_key not in ('client-errors', 'order-volume')
     or p_threshold is null or p_threshold < 3 or p_threshold > 500
     or p_window_seconds is null or p_window_seconds < 30 or p_window_seconds > 3600
     or p_cooldown_seconds is null or p_cooldown_seconds < 60 or p_cooldown_seconds > 86400 then
    raise exception 'Invalid security signal parameters'
      using errcode = '22023';
  end if;

  insert into private.security_signal_windows (
    signal_key, window_started_at, event_count, last_alert_at
  )
  values (p_signal_key, v_now, 0, null)
  on conflict (signal_key) do nothing;

  select sw.window_started_at, sw.event_count, sw.last_alert_at
    into v_started, v_count, v_last_alert
  from private.security_signal_windows as sw
  where sw.signal_key = p_signal_key
  for update;

  if v_started <= v_now - (p_window_seconds * interval '1 second') then
    v_started := v_now;
    v_count := 1;
  else
    v_count := v_count + 1;
  end if;

  if v_count >= p_threshold
     and (v_last_alert is null
       or v_last_alert <= v_now - (p_cooldown_seconds * interval '1 second')) then
    v_alert := true;
    v_last_alert := v_now;
  end if;

  update private.security_signal_windows as sw
  set window_started_at = v_started,
      event_count = v_count,
      last_alert_at = v_last_alert
  where sw.signal_key = p_signal_key;

  return query select v_alert, v_count;
end;
$function$;

revoke all on function public.claim_security_alert(text, integer) from public, anon, authenticated;
revoke all on function public.record_admin_security_signin(uuid, text, text) from public, anon, authenticated;
revoke all on function public.record_security_signal(text, integer, integer, integer) from public, anon, authenticated;

grant execute on function public.claim_security_alert(text, integer) to service_role;
grant execute on function public.record_admin_security_signin(uuid, text, text) to service_role;
grant execute on function public.record_security_signal(text, integer, integer, integer) to service_role;
