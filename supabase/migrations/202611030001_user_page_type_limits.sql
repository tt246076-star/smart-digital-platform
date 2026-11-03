-- Separate per-user creation limits for regular and VIP cards.
create table if not exists public.user_page_type_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  normal_max_pages integer not null default 1 check (normal_max_pages between 0 and 100),
  vip_max_pages integer not null default 0 check (vip_max_pages between 0 and 100),
  updated_at timestamptz not null default now()
);

alter table public.user_page_type_limits enable row level security;

drop policy if exists "Users can read their own page type limits" on public.user_page_type_limits;
create policy "Users can read their own page type limits"
  on public.user_page_type_limits
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Only the service role/admin should write quota rows. No user write policy is created.
