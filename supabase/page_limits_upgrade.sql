-- Per-user landing page limits. Run once in Supabase SQL Editor.
create table if not exists public.user_page_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  max_pages integer not null default 1 check (max_pages >= 1 and max_pages <= 100)
);

alter table public.user_page_limits enable row level security;
-- Users may read only their own limit. No client insert/update/delete policies:
-- only the project owner/admin should change limits through Supabase SQL Editor.
drop policy if exists "Users can read their own page limit" on public.user_page_limits;
create policy "Users can read their own page limit"
on public.user_page_limits for select to authenticated
using (user_id = (select auth.uid()));

create or replace function public.enforce_landing_page_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed_pages integer;
  current_pages integer;
begin
  select coalesce((
    select upl.max_pages from public.user_page_limits upl where upl.user_id = new.user_id
  ), 1) into allowed_pages;

  select count(*)::integer into current_pages
  from public.landing_pages lp
  where lp.user_id = new.user_id;

  if current_pages >= allowed_pages then
    raise exception 'LANDING_PAGE_LIMIT_REACHED'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists landing_page_limit_guard on public.landing_pages;
create trigger landing_page_limit_guard
before insert on public.landing_pages
for each row execute function public.enforce_landing_page_limit();

-- Grant a user 2 or 3 pages from Supabase SQL Editor with:
-- insert into public.user_page_limits (user_id, max_pages)
-- values ('AUTH_USER_UUID_HERE', 2)
-- on conflict (user_id) do update set max_pages = excluded.max_pages;
