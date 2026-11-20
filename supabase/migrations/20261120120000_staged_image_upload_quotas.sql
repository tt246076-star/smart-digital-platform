-- Per-account quotas for private image staging.
-- Signed upload reservations expire after the maximum signed-upload lifetime (2 hours).
create table if not exists private.staged_image_upload_windows (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_started_at timestamptz not null,
  issued_count integer not null check (issued_count >= 0)
);

create table if not exists private.staged_image_upload_reservations (
  user_id uuid not null references auth.users(id) on delete cascade,
  object_path text not null,
  size_bytes integer not null check (size_bytes between 1 and 20971520),
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  primary key (user_id, object_path),
  check (pg_catalog.length(object_path) <= 160)
);

create index if not exists staged_image_upload_reservations_created_at_idx
  on private.staged_image_upload_reservations (created_at);

alter table private.staged_image_upload_windows enable row level security;
alter table private.staged_image_upload_reservations enable row level security;

revoke all on table private.staged_image_upload_windows from public, anon, authenticated, service_role;
revoke all on table private.staged_image_upload_reservations from public, anon, authenticated, service_role;

create or replace function public.reserve_staged_image_upload(
  p_user_id uuid,
  p_object_path text,
  p_size_bytes integer,
  p_max_pending_count integer,
  p_max_pending_bytes bigint,
  p_max_per_hour integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_window_started timestamptz;
  v_issued_count integer;
  v_pending_count bigint;
  v_pending_bytes bigint;
  v_rows integer;
begin
  if p_user_id is null
     or p_object_path is null
     or p_object_path !~ ('^' || p_user_id::text || '/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}[.]tmp$')
     or p_size_bytes is null or p_size_bytes < 1 or p_size_bytes > 20971520
     or p_max_pending_count is null or p_max_pending_count < 4 or p_max_pending_count > 104
     or p_max_pending_bytes is null or p_max_pending_bytes < 1 or p_max_pending_bytes > 2181038080
     or p_max_per_hour is null or p_max_per_hour < 10 or p_max_per_hour > 400 then
    raise exception 'Invalid staged image quota parameters' using errcode = '22023';
  end if;

  insert into private.staged_image_upload_windows (user_id, window_started_at, issued_count)
  values (p_user_id, v_now, 0)
  on conflict (user_id) do nothing;

  select w.window_started_at, w.issued_count
    into v_window_started, v_issued_count
  from private.staged_image_upload_windows as w
  where w.user_id = p_user_id
  for update;

  if v_window_started <= v_now - interval '1 hour' then
    v_window_started := v_now;
    v_issued_count := 0;
  end if;

  -- Release reservations for abandoned signed links after their 2-hour validity.
  delete from private.staged_image_upload_reservations
  where user_id = p_user_id
    and created_at <= v_now - interval '2 hours';

  -- Small global cleanup prevents inactive users' expired rows accumulating forever.
  delete from private.staged_image_upload_reservations
  where created_at <= v_now - interval '1 day';

  select count(*), coalesce(sum(r.size_bytes), 0)
    into v_pending_count, v_pending_bytes
  from private.staged_image_upload_reservations as r
  where r.user_id = p_user_id;

  if v_pending_count >= p_max_pending_count
     or v_pending_bytes + p_size_bytes > p_max_pending_bytes
     or v_issued_count >= p_max_per_hour then
    update private.staged_image_upload_windows
    set window_started_at = v_window_started,
        issued_count = v_issued_count
    where user_id = p_user_id;
    return false;
  end if;

  insert into private.staged_image_upload_reservations (user_id, object_path, size_bytes, created_at)
  values (p_user_id, p_object_path, p_size_bytes, v_now)
  on conflict (user_id, object_path) do nothing;

  get diagnostics v_rows = row_count;
  if v_rows <> 1 then
    return false;
  end if;

  update private.staged_image_upload_windows
  set window_started_at = v_window_started,
      issued_count = v_issued_count + 1
  where user_id = p_user_id;

  return true;
end;
$function$;

-- Atomically consume a reservation so a staged object can be previewed only once.
create or replace function public.claim_staged_image_upload(
  p_user_id uuid,
  p_object_path text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_rows integer;
begin
  if p_user_id is null
     or p_object_path is null
     or p_object_path !~ ('^' || p_user_id::text || '/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}[.]tmp$') then
    raise exception 'Invalid staged image reservation' using errcode = '22023';
  end if;

  delete from private.staged_image_upload_reservations
  where user_id = p_user_id
    and object_path = p_object_path;

  get diagnostics v_rows = row_count;
  return v_rows = 1;
end;
$function$;

create or replace function public.release_staged_image_upload(
  p_user_id uuid,
  p_object_path text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_rows integer;
begin
  if p_user_id is null or p_object_path is null or pg_catalog.length(p_object_path) > 160 then
    raise exception 'Invalid staged image reservation' using errcode = '22023';
  end if;

  delete from private.staged_image_upload_reservations
  where user_id = p_user_id
    and object_path = p_object_path;

  get diagnostics v_rows = row_count;
  return v_rows = 1;
end;
$function$;

revoke all on function public.reserve_staged_image_upload(uuid, text, integer, integer, bigint, integer) from public, anon, authenticated;
revoke all on function public.claim_staged_image_upload(uuid, text) from public, anon, authenticated;
revoke all on function public.release_staged_image_upload(uuid, text) from public, anon, authenticated;

grant execute on function public.reserve_staged_image_upload(uuid, text, integer, integer, bigint, integer) to service_role;
grant execute on function public.claim_staged_image_upload(uuid, text) to service_role;
grant execute on function public.release_staged_image_upload(uuid, text) to service_role;
