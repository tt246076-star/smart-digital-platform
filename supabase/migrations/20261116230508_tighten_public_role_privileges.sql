-- Restrict public-schema API privileges to the operations used by Bitaqati.
-- RLS policies continue to enforce row ownership and published-page visibility.

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Public published content; anonymous analytics insertion only.
GRANT SELECT ON public.cards, public.links, public.landing_pages TO anon;
GRANT INSERT ON public.landing_page_events TO anon;

-- Signed-in users manage their own cards, links, and landing pages via RLS.
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.cards, public.links, public.landing_pages
  TO authenticated;
GRANT SELECT, INSERT ON public.landing_page_events TO authenticated;

-- Account/profile data and user-specific limits.
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON
  public.user_access_plans,
  public.user_gallery_limits,
  public.user_page_limits,
  public.user_page_type_limits,
  public.user_product_limits
  TO authenticated;

-- Store owners read/update orders belonging to their own landing pages.
GRANT SELECT, UPDATE ON public.store_orders TO authenticated;

-- Serial key used when anonymous/authenticated visitors record page events.
GRANT USAGE ON SEQUENCE public.landing_page_events_id_seq TO anon, authenticated;

-- Profiles are read only by the authenticated owner.
DROP POLICY IF EXISTS profiles_select_all ON public.profiles;
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
