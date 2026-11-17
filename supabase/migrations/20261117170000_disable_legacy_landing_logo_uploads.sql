-- Remove legacy direct-to-public-bucket upload permissions.
-- All current landing/VIP image upload UI uses the private staging flow.
-- Keep public SELECT access so already-published images remain visible.
begin;

drop policy if exists "Users upload their own landing logos" on storage.objects;
drop policy if exists "Users update their own landing logos" on storage.objects;

commit;
