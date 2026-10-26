-- Batakati platform features upgrade. Run once in Supabase SQL Editor.
alter table public.landing_pages
  add column if not exists seo_title text not null default '',
  add column if not exists seo_description text not null default '',
  add column if not exists custom_domain text not null default '',
  add column if not exists sections jsonb not null default '[]'::jsonb;

-- Lightweight analytics for public page views and contact-link clicks.
create table if not exists public.landing_page_events (
  id bigint generated always as identity primary key,
  page_id uuid not null references public.landing_pages(id) on delete cascade,
  event_type text not null check (event_type in ('view', 'contact_click')),
  created_at timestamptz not null default now()
);
create index if not exists landing_page_events_page_time_idx
  on public.landing_page_events(page_id, created_at desc);
alter table public.landing_page_events enable row level security;
grant select on public.landing_page_events to authenticated;
grant insert on public.landing_page_events to anon, authenticated;

drop policy if exists "Owners can read events for their pages" on public.landing_page_events;
create policy "Owners can read events for their pages"
on public.landing_page_events for select to authenticated
using (exists (
  select 1 from public.landing_pages p
  where p.id = page_id and p.user_id = (select auth.uid())
));

drop policy if exists "Visitors can log events on published pages" on public.landing_page_events;
create policy "Visitors can log events on published pages"
on public.landing_page_events for insert to anon, authenticated
with check (
  event_type in ('view', 'contact_click')
  and exists (
    select 1 from public.landing_pages p
    where p.id = page_id and p.is_published = true
  )
);

-- Order foundation; storefront checkout/UI will be added in a later phase.
create table if not exists public.store_orders (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.landing_pages(id) on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  customer_address text not null default '',
  items jsonb not null default '[]'::jsonb,
  total_amount numeric(12,2),
  status text not null default 'new' check (status in ('new','confirmed','shipped','completed','cancelled')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.store_orders enable row level security;
grant select, insert, update on public.store_orders to authenticated, anon;
drop policy if exists "Store owners manage their orders" on public.store_orders;
create policy "Store owners manage their orders"
on public.store_orders for all to authenticated
using (exists (
  select 1 from public.landing_pages p
  where p.id = page_id and p.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.landing_pages p
  where p.id = page_id and p.user_id = (select auth.uid())
));
-- Do not expose anonymous order creation until the public checkout form is implemented
-- with server-side validation and spam protection.
