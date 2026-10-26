-- Run this upgrade in Supabase SQL Editor after the original landing_pages.sql.
alter table public.landing_pages
  add column if not exists template text not null default 'aurora',
  add column if not exists theme text not null default 'violet';

-- Public bucket for landing page logos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('landing-logos', 'landing-logos', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif'];

drop policy if exists "Users upload their own landing logos" on storage.objects;
create policy "Users upload their own landing logos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'landing-logos'
  and (storage.foldername(name))[1] in (
    select id::text from public.landing_pages where user_id = auth.uid()
  )
);

drop policy if exists "Users update their own landing logos" on storage.objects;
create policy "Users update their own landing logos"
on storage.objects for update to authenticated
using (
  bucket_id = 'landing-logos'
  and (storage.foldername(name))[1] in (
    select id::text from public.landing_pages where user_id = auth.uid()
  )
)
with check (
  bucket_id = 'landing-logos'
  and (storage.foldername(name))[1] in (
    select id::text from public.landing_pages where user_id = auth.uid()
  )
);

drop policy if exists "Public can view landing logos" on storage.objects;
create policy "Public can view landing logos"
on storage.objects for select to public
using (bucket_id = 'landing-logos');
