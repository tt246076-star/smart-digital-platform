create or replace function public.is_admin_auth_session_active(p_session_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from auth.sessions
    where id = p_session_id
  );
$function$;

revoke all on function public.is_admin_auth_session_active(uuid) from public, anon, authenticated;
grant execute on function public.is_admin_auth_session_active(uuid) to service_role;
