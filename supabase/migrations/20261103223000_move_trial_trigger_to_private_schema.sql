create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
alter function public.handle_new_user_access_plan() set schema private;
revoke all on function private.handle_new_user_access_plan() from public, anon, authenticated;