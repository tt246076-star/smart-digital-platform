-- Align Storage capacity with the admin-configurable gallery image maximum.
-- The app enforces per-user gallery size and separate fixed caps for other images.
UPDATE storage.buckets
SET file_size_limit = 20971520
WHERE id IN ('landing-logos-staging', 'landing-logos');

DO $$
BEGIN
  IF (SELECT count(*) FROM storage.buckets WHERE id IN ('landing-logos-staging', 'landing-logos') AND file_size_limit = 20971520) <> 2 THEN
    RAISE EXCEPTION 'Expected landing image buckets are missing or could not be updated';
  END IF;
END $$;
