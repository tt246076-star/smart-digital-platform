-- Prevent duplicate order creation when a client retries the same submission.
-- Nullable to preserve all existing orders; unique index allows multiple NULL values.
alter table public.store_orders add column if not exists idempotency_key uuid;
create unique index if not exists store_orders_idempotency_key_uidx
  on public.store_orders (idempotency_key);
