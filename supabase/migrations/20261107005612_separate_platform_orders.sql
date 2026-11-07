create table if not exists public.platform_orders (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('homepage','catalog')),
  product_id uuid,
  customer_name text not null,
  customer_phone text not null,
  customer_address text not null default '',
  items jsonb not null default '[]'::jsonb,
  total_amount numeric,
  status text not null default 'new' check (status in ('new','confirmed','shipped','completed','cancelled')),
  notes text not null default '',
  idempotency_key uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists platform_orders_idempotency_key_uidx
  on public.platform_orders (idempotency_key)
  where idempotency_key is not null;
alter table public.platform_orders enable row level security;
revoke all on public.platform_orders from anon, authenticated;
grant all on public.platform_orders to service_role;
