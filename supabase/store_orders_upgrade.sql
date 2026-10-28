-- Customer orders for storefront / restaurant pages.
-- Run once in Supabase SQL Editor. Public order creation goes through /api/orders
-- using the server-only service-role key; do not add an anon INSERT policy.
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

alter table public.store_orders alter column page_id drop not null;

create index if not exists store_orders_page_created_idx
  on public.store_orders(page_id, created_at desc);
create index if not exists store_orders_status_created_idx
  on public.store_orders(status, created_at desc);

alter table public.store_orders enable row level security;
revoke all on public.store_orders from anon;
grant select, update on public.store_orders to authenticated;

drop policy if exists "Store owners manage their orders" on public.store_orders;
drop policy if exists "Store owners read their orders" on public.store_orders;
drop policy if exists "Store owners update their orders" on public.store_orders;

create policy "Store owners read their orders"
on public.store_orders for select to authenticated
using (exists (
  select 1 from public.landing_pages p
  where p.id = page_id and p.user_id = (select auth.uid())
));

create policy "Store owners update their orders"
on public.store_orders for update to authenticated
using (exists (
  select 1 from public.landing_pages p
  where p.id = page_id and p.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.landing_pages p
  where p.id = page_id and p.user_id = (select auth.uid())
));
