create table if not exists public.admin_mfa_recovery_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code_hash text not null check (code_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default pg_catalog.now(),
  unique (user_id, code_hash)
);

create table if not exists public.admin_mfa_recovery_attempts (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  succeeded boolean not null default false,
  created_at timestamptz not null default pg_catalog.now()
);

alter table public.admin_mfa_recovery_codes enable row level security;
alter table public.admin_mfa_recovery_attempts enable row level security;

drop policy if exists "Service role manages admin MFA recovery codes" on public.admin_mfa_recovery_codes;
create policy "Service role manages admin MFA recovery codes"
on public.admin_mfa_recovery_codes
for all to service_role
using (true) with check (true);

drop policy if exists "Service role manages admin MFA recovery attempts" on public.admin_mfa_recovery_attempts;
create policy "Service role manages admin MFA recovery attempts"
on public.admin_mfa_recovery_attempts
for all to service_role
using (true) with check (true);

revoke all on table public.admin_mfa_recovery_codes from public, anon, authenticated;
revoke all on table public.admin_mfa_recovery_attempts from public, anon, authenticated;
grant all on table public.admin_mfa_recovery_codes to service_role;
grant all on table public.admin_mfa_recovery_attempts to service_role;

create or replace function public.consume_admin_mfa_recovery_code(
  p_user_id uuid,
  p_code_hash text
)
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  failed_attempts integer;
  consumed_id uuid;
begin
  if p_user_id is null or p_code_hash is null or p_code_hash !~ '^[0-9a-f]{64}$' then
    return 'invalid';
  end if;

  delete from public.admin_mfa_recovery_attempts
  where created_at < pg_catalog.now() - interval '1 day';

  select count(*)::integer
  into failed_attempts
  from public.admin_mfa_recovery_attempts
  where user_id = p_user_id
    and succeeded = false
    and created_at >= pg_catalog.now() - interval '15 minutes';

  if failed_attempts >= 5 then
    return 'locked';
  end if;

  delete from public.admin_mfa_recovery_codes
  where user_id = p_user_id
    and code_hash = p_code_hash
  returning id into consumed_id;

  insert into public.admin_mfa_recovery_attempts (user_id, succeeded)
  values (p_user_id, consumed_id is not null);

  if consumed_id is not null then
    return 'ok';
  end if;

  return 'invalid';
end;
$function$;

revoke all on function public.consume_admin_mfa_recovery_code(uuid, text) from public, anon, authenticated;
grant execute on function public.consume_admin_mfa_recovery_code(uuid, text) to service_role;
