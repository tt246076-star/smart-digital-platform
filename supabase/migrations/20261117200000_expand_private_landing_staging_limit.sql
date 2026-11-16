-- The VIP gallery plan can allow images up to 20 MB.
-- Keep the private staging bucket ceiling aligned with that maximum.
UPDATE storage.buckets
SET file_size_limit = 20971520
WHERE id = 'landing-logos-staging'
  AND public = false;
