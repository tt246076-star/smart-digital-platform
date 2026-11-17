-- Reserve each authentication attempt atomically before calling Supabase Auth.
-- The existing private table stores keyed hashes only; raw email addresses and IPs
-- are never written to the database.
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
     or p_operation not in ('check', 'failure', 'request', 'success', 'attempt')
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

  if p_operation in ('failure', 'attempt') and p_action = 'recovery' then
    raise exception 'Invalid authentication rate limit operation'
      using errcode = '22023';
  end if;

  if p_operation = 'success' and p_action = 'recovery' then
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
    -- Undo this successful reservation, but preserve prior failed attempts.
    update private.auth_attempt_limits
    set
      attempt_count = attempt_count - 1,
      blocked_until = case when attempt_count - 1 < 5 then null else blocked_until end,
      updated_at = v_now
    where action = p_action
      and subject_type = 'ip'
      and subject_hash = v_ip_hash
      and attempt_count > 1;

    delete from private.auth_attempt_limits
    where action = p_action
      and subject_type = 'ip'
      and subject_hash = v_ip_hash
      and attempt_count = 1;

    update private.auth_attempt_limits
    set
      attempt_count = attempt_count - 1,
      blocked_until = case when attempt_count - 1 < 5 then null else blocked_until end,
      updated_at = v_now
    where action = p_action
      and subject_type = 'account'
      and subject_hash = v_account_hash
      and attempt_count > 1;

    delete from private.auth_attempt_limits
    where action = p_action
      and subject_type = 'account'
      and subject_hash = v_account_hash
      and attempt_count = 1;

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

  -- 'attempt' is reserved before the Auth request. This serializes concurrent
  -- sign-in/sign-up requests and blocks the next request once the fifth
  -- unfinished/failed attempt has reserved the threshold.
  -- 'request' counts every password-recovery request, regardless of account existence.
  -- 'failure' is retained for compatibility with older callers.
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
