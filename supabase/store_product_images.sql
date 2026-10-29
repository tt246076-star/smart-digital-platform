-- Run once in Supabase SQL Editor to enable direct product image uploads.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('store-products', 'store-products', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif','image/avif'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','image/avif'];
