create table if not exists private.order_rate_limits (
  client_hash bytea primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 1),
  updated_at timestamptz not null default now()
);

create table if not exists private.order_rate_limit_secret (
  id boolean primary key default true check (id = true),
  secret bytea not null check (octet_length(secret) = 32)
);

insert into private.order_rate_limit_secret (id, secret)
values (true, extensions.gen_random_bytes(32))
on conflict (id) do nothing;

alter table private.order_rate_limits enable row level security;
alter table private.order_rate_limit_secret enable row level security;

revoke all on private.order_rate_limits from public, anon, authenticated, service_role;
revoke all on private.order_rate_limit_secret from public, anon, authenticated, service_role;

create or replace function public.consume_order_rate_limit(
  p_client_ip text,
  p_limit integer default 10,
  p_window_seconds integer default 600
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_client_hash bytea;
  v_count integer;
  v_now timestamptz := pg_catalog.clock_timestamp();
begin
  if p_client_ip is null or pg_catalog.length(p_client_ip) < 2
     or pg_catalog.length(p_client_ip) > 64
     or p_limit < 1 or p_limit > 100
     or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'Invalid rate limit parameters' using errcode = '22023';
  end if;

  select extensions.hmac(
    pg_catalog.convert_to(p_client_ip, 'UTF8'),
    secret,
    'sha256'
  )
  into v_client_hash
  from private.order_rate_limit_secret
  where id = true;

  if v_client_hash is null then
    raise exception 'Rate limit secret is unavailable';
  end if;

  insert into private.order_rate_limits as current_limit (
    client_hash, window_started_at, request_count, updated_at
  )
  values (v_client_hash, v_now, 1, v_now)
  on conflict (client_hash) do update
  set
    window_started_at = case
      when current_limit.window_started_at <= v_now - pg_catalog.make_interval(secs => p_window_seconds)
        then v_now
      else current_limit.window_started_at
    end,
    request_count = case
      when current_limit.window_started_at <= v_now - pg_catalog.make_interval(secs => p_window_seconds)
        then 1
      else current_limit.request_count + 1
    end,
    updated_at = v_now
  returning request_count into v_count;

  if pg_catalog.random() < 0.01 then
    delete from private.order_rate_limits
    where updated_at < v_now - pg_catalog.make_interval(days => 7);
  end if;

  return v_count <= p_limit;
end;
$function$;

revoke all on function public.consume_order_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_order_rate_limit(text, integer, integer) to service_role;
