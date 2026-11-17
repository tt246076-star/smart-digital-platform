-- Authentication attempt lockout, applied to the hosted database as version 20261117031233.
create table if not exists private.auth_attempt_limits (
  action text not null check (action in ('login', 'signup', 'recovery')),
  subject_type text not null check (subject_type in ('ip', 'account')),
  subject_hash bytea not null check (octet_length(subject_hash) = 32),
  window_started_at timestamptz not null,
  attempt_count integer not null check (attempt_count between 1 and 5),
  blocked_until timestamptz,
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  primary key (action, subject_type, subject_hash)
);

alter table private.auth_attempt_limits enable row level security;
revoke all on table private.auth_attempt_limits from public, anon, authenticated, service_role;

create or replace function public.manage_auth_attempt_limit(
  p_action text,
  p_ip_hash text,
  p_account_hash text,
  p_operation text default 'check'
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_ip_hash bytea;
  v_account_hash bytea;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_retry integer;
  v_ip_lock bigint;
  v_account_lock bigint;
begin
  if p_action is null
     or p_action not in ('login', 'signup', 'recovery')
     or p_operation is null
     or p_operation not in ('check', 'failure', 'request', 'success')
     or p_ip_hash is null
     or p_ip_hash !~ '^[0-9a-fA-F]{64}$'
     or p_account_hash is null
     or p_account_hash !~ '^[0-9a-fA-F]{64}$' then
    raise exception 'Invalid authentication rate limit parameters'
      using errcode = '22023';
  end if;

  if p_operation = 'request' and p_action <> 'recovery' then
    raise exception 'Invalid authentication rate limit operation'
      using errcode = '22023';
  end if;

  if p_operation = 'failure' and p_action = 'recovery' then
    raise exception 'Invalid authentication rate limit operation'
      using errcode = '22023';
  end if;

  v_ip_hash := pg_catalog.decode(p_ip_hash, 'hex');
  v_account_hash := pg_catalog.decode(p_account_hash, 'hex');

  v_ip_lock := pg_catalog.hashtextextended(p_action || ':ip:' || p_ip_hash, 0);
  v_account_lock := pg_catalog.hashtextextended(p_action || ':account:' || p_account_hash, 0);
  perform pg_catalog.pg_advisory_xact_lock(v_ip_lock);
  perform pg_catalog.pg_advisory_xact_lock(v_account_lock);

  if p_operation = 'success' then
    delete from private.auth_attempt_limits
    where action = p_action
      and subject_type = 'account'
      and subject_hash = v_account_hash;
    return query select true, 0;
    return;
  end if;

  select pg_catalog.max(pg_catalog.ceil(extract(epoch from blocked_until - v_now))::integer)
    into v_retry
  from private.auth_attempt_limits
  where action = p_action
    and blocked_until > v_now
    and (
      (subject_type = 'ip' and subject_hash = v_ip_hash)
      or
      (subject_type = 'account' and subject_hash = v_account_hash)
    );

  if v_retry is not null then
    return query select false, case when v_retry < 1 then 1 else v_retry end;
    return;
  end if;

  if p_operation = 'check' then
    return query select true, 0;
    return;
  end if;

  insert into private.auth_attempt_limits as current_limit (
    action, subject_type, subject_hash, window_started_at,
    attempt_count, blocked_until, updated_at
  )
  values (p_action, 'ip', v_ip_hash, v_now, 1, null, v_now)
  on conflict (action, subject_type, subject_hash) do update
  set
    window_started_at = case
      when current_limit.window_started_at <= v_now - interval '15 minutes'
        then v_now else current_limit.window_started_at end,
    attempt_count = case
      when current_limit.window_started_at <= v_now - interval '15 minutes'
        then 1 else current_limit.attempt_count + 1 end,
    blocked_until = case
      when (
        case
          when current_limit.window_started_at <= v_now - interval '15 minutes'
            then 1 else current_limit.attempt_count + 1
        end
      ) >= 5 then v_now + interval '15 minutes'
      else null
    end,
    updated_at = v_now;

  insert into private.auth_attempt_limits as current_limit (
    action, subject_type, subject_hash, window_started_at,
    attempt_count, blocked_until, updated_at
  )
  values (p_action, 'account', v_account_hash, v_now, 1, null, v_now)
  on conflict (action, subject_type, subject_hash) do update
  set
    window_started_at = case
      when current_limit.window_started_at <= v_now - interval '15 minutes'
        then v_now else current_limit.window_started_at end,
    attempt_count = case
      when current_limit.window_started_at <= v_now - interval '15 minutes'
        then 1 else current_limit.attempt_count + 1 end,
    blocked_until = case
      when (
        case
          when current_limit.window_started_at <= v_now - interval '15 minutes'
            then 1 else current_limit.attempt_count + 1
        end
      ) >= 5 then v_now + interval '15 minutes'
      else null
    end,
    updated_at = v_now;

  if pg_catalog.random() < 0.02 then
    delete from private.auth_attempt_limits
    where updated_at < v_now - interval '2 days';
  end if;

  return query select true, 0;
end;
$function$;

revoke all on function public.manage_auth_attempt_limit(text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.manage_auth_attempt_limit(text, text, text, text)
  to service_role;
