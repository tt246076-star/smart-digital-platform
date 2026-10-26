-- Run this file in Supabase SQL Editor.
create table if not exists public.landing_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  business_name text not null,
  headline text not null default '',
  description text not null default '',
  phone text not null default '',
  whatsapp text not null default '',
  logo_url text not null default '',
  instagram_url text not null default '',
  facebook_url text not null default '',
  tiktok_url text not null default '',
  youtube_url text not null default '',
  custom_links jsonb not null default '[]'::jsonb,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.landing_pages enable row level security;
grant select, insert, update, delete on public.landing_pages to authenticated;
grant select on public.landing_pages to anon;

drop policy if exists "Owners can view their landing pages" on public.landing_pages;
create policy "Owners can view their landing pages"
on public.landing_pages for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Anyone can view published landing pages" on public.landing_pages;
create policy "Anyone can view published landing pages"
on public.landing_pages for select to anon, authenticated
using (is_published = true);

drop policy if exists "Owners can create landing pages" on public.landing_pages;
create policy "Owners can create landing pages"
on public.landing_pages for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Owners can update landing pages" on public.landing_pages;
create policy "Owners can update landing pages"
on public.landing_pages for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Owners can delete landing pages" on public.landing_pages;
create policy "Owners can delete landing pages"
on public.landing_pages for delete to authenticated
using ((select auth.uid()) = user_id);
