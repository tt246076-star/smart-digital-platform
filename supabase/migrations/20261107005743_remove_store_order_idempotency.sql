drop index if exists public.store_orders_idempotency_key_uidx;
alter table public.store_orders drop column if exists idempotency_key;
