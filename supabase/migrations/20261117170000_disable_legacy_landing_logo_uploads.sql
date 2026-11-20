-- Remove every legacy direct-to-public-bucket upload/update policy.
-- Current landing/VIP image UI uses the private staged upload flow.
-- Keep public SELECT access so already-published images remain visible.
begin;

drop policy if exists "Users upload their own landing logos" on storage.objects;
drop policy if exists "Users upload landing page images" on storage.objects;
drop policy if exists "Users update their own landing logos" on storage.objects;

commit;
