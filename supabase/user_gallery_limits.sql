-- Per-user gallery image limits. Run once in Supabase SQL Editor.
create table if not exists public.user_gallery_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  max_images integer not null default 2 check (max_images >= 0 and max_images <= 100),
  max_image_mb numeric(5,2) not null default 2 check (max_image_mb >= 0.1 and max_image_mb <= 20),
  updated_at timestamptz not null default now()
);
alter table public.user_gallery_limits enable row level security;
drop policy if exists "Users can read their own gallery limits" on public.user_gallery_limits;
create policy "Users can read their own gallery limits"
on public.user_gallery_limits for select to authenticated
using (user_id = (select auth.uid()));
