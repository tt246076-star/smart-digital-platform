-- Access plans for the Batqati platform.
-- New signups get a 3-day read-only trial automatically.
create table if not exists public.user_access_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_type text not null default 'trial' check (plan_type in ('trial', 'customer', 'special')),
  expires_at timestamptz,
  max_pages integer not null default 0 check (max_pages >= 0 and max_pages <= 100),
  advanced_features boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_access_plans enable row level security;
drop policy if exists "Users can read their own access plan" on public.user_access_plans;
create policy "Users can read their own access plan"
on public.user_access_plans for select to authenticated
using (user_id = (select auth.uid()));

-- Ensure users cannot assign themselves paid plans: no client write policies.
create or replace function public.create_default_access_plan()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.user_access_plans (user_id, plan_type, expires_at, max_pages, advanced_features)
  values (new.id, 'trial', now() + interval '3 days', 0, false)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists create_default_access_plan_after_signup on auth.users;
create trigger create_default_access_plan_after_signup
after insert on auth.users
for each row execute function public.create_default_access_plan();

-- Backfill existing users as read-only trials for 3 days from migration time.
-- Existing customers/admins can then be upgraded manually below.
insert into public.user_access_plans (user_id, plan_type, expires_at, max_pages, advanced_features)
select u.id, 'trial', now() + interval '3 days', 0, false
from auth.users u
on conflict (user_id) do nothing;

-- Keep the page-limit table in sync with the access-plan allowance.
insert into public.user_page_limits (user_id, max_pages)
select user_id, max_pages from public.user_access_plans
on conflict (user_id) do update set max_pages = excluded.max_pages;

create or replace function public.sync_access_plan_page_limit()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.user_page_limits (user_id, max_pages)
  values (new.user_id, new.max_pages)
  on conflict (user_id) do update set max_pages = excluded.max_pages;
  return new;
end;
$$;

drop trigger if exists sync_access_plan_page_limit_trigger on public.user_access_plans;
create trigger sync_access_plan_page_limit_trigger
after insert or update of max_pages on public.user_access_plans
for each row execute function public.sync_access_plan_page_limit();

-- ADMIN: customer purchased plan (1 page, no expiry).
-- update public.user_access_plans set plan_type='customer', expires_at=null, max_pages=1,
--   advanced_features=false, updated_at=now() where user_id='USER_UUID_HERE';
--
-- ADMIN: special customer (5 pages + advanced features, no expiry).
-- update public.user_access_plans set plan_type='special', expires_at=null, max_pages=5,
--   advanced_features=true, updated_at=now() where user_id='USER_UUID_HERE';
