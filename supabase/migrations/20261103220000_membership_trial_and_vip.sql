-- Membership lifecycle: three customer types, automatic 3-day trial on signup.
alter table public.user_access_plans
  drop constraint if exists user_access_plans_plan_type_check;

update public.user_access_plans
set plan_type = 'vip',
    max_pages = greatest(max_pages, 100),
    advanced_features = true,
    updated_at = now()
where plan_type = 'special';

alter table public.user_access_plans
  add constraint user_access_plans_plan_type_check
  check (plan_type in ('trial', 'customer', 'vip'));

-- New accounts receive a 3-day trial with one normal page and one VIP page.
create or replace function public.handle_new_user_access_plan()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_access_plans
    (user_id, plan_type, expires_at, max_pages, advanced_features)
  values
    (new.id, 'trial', now() + interval '3 days', 2, true)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user_access_plan() from public;

drop trigger if exists on_auth_user_created_access_plan on auth.users;
create trigger on_auth_user_created_access_plan
  after insert on auth.users
  for each row execute function public.handle_new_user_access_plan();
