-- Homepage storefront products managed from /admin/store.
create table if not exists public.storefront_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price numeric(12,2) not null default 0 check (price >= 0),
  image_url text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.storefront_products enable row level security;
revoke all on public.storefront_products from anon, authenticated;
create index if not exists storefront_products_active_sort_idx
  on public.storefront_products(is_active, sort_order, created_at desc);
