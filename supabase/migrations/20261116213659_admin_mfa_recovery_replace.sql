create or replace function public.replace_admin_mfa_recovery_codes(
  p_user_id uuid,
  p_code_hashes text[]
)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  inserted_count integer;
begin
  if p_user_id is null
     or p_code_hashes is null
     or pg_catalog.cardinality(p_code_hashes) < 1
     or pg_catalog.cardinality(p_code_hashes) > 10
     or exists (
       select 1
       from pg_catalog.unnest(p_code_hashes) as item
       where item is null or item !~ '^[0-9a-f]{64}$'
     ) then
    raise exception 'Invalid recovery code set' using errcode = '22023';
  end if;

  delete from public.admin_mfa_recovery_codes
  where user_id = p_user_id;

  insert into public.admin_mfa_recovery_codes (user_id, code_hash)
  select p_user_id, item
  from pg_catalog.unnest(p_code_hashes) as item;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$function$;

revoke all on function public.replace_admin_mfa_recovery_codes(uuid, text[]) from public, anon, authenticated;
grant execute on function public.replace_admin_mfa_recovery_codes(uuid, text[]) to service_role;
