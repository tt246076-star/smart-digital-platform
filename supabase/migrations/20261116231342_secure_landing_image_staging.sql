-- Private staging bucket for uploaded landing-page/VIP images.
-- Existing published images remain in the public landing-logos bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'landing-logos-staging',
  'landing-logos-staging',
  false,
  5242880,
  array['image/jpeg','image/png','image/webp','image/gif','image/avif']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload own private landing image staging" on storage.objects;
create policy "Users upload own private landing image staging"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'landing-logos-staging'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users read own private landing image staging" on storage.objects;
create policy "Users read own private landing image staging"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'landing-logos-staging'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users delete own private landing image staging" on storage.objects;
create policy "Users delete own private landing image staging"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'landing-logos-staging'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
