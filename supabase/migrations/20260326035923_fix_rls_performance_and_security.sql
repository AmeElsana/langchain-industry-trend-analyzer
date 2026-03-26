/*
  # Fix RLS Performance and Security Issues

  1. RLS Performance Fixes
    - Wrap all `auth.uid()` calls in `(select auth.uid())` to prevent per-row re-evaluation
    - Affects tables: housing_price_cache, profiles, saved_analyses

  2. Security Fixes - Always-True Policies
    - analysis_results: Remove open INSERT policy, restrict SELECT to authenticated users
    - chat_sessions: Remove open INSERT/UPDATE policies, restrict SELECT to authenticated users
    - raw_posts: Remove open INSERT policy, restrict SELECT to authenticated users
    - Edge functions use service_role key which bypasses RLS, so no write policies needed

  3. Unused Indexes Removed
    - idx_analysis_sector_created on analysis_results
    - idx_analysis_expires on analysis_results
    - idx_raw_posts_analysis on raw_posts
    - idx_raw_posts_source on raw_posts
    - idx_chat_sessions_analysis on chat_sessions
    - idx_housing_cache_series on housing_price_cache
    - idx_profiles_email on profiles
    - idx_saved_analyses_user on saved_analyses

  4. Function Security
    - Set immutable search_path on handle_new_user function to prevent search_path manipulation
*/

-- ============================================================
-- 1. Fix housing_price_cache RLS policies (select auth.uid())
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can view housing data" ON housing_price_cache;
CREATE POLICY "Authenticated users can view housing data"
  ON housing_price_cache FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert housing data" ON housing_price_cache;
CREATE POLICY "Authenticated users can insert housing data"
  ON housing_price_cache FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update housing data" ON housing_price_cache;
CREATE POLICY "Authenticated users can update housing data"
  ON housing_price_cache FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- 2. Fix profiles RLS policies (select auth.uid())
-- ============================================================

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

-- ============================================================
-- 3. Fix saved_analyses RLS policies (select auth.uid())
-- ============================================================

DROP POLICY IF EXISTS "Users can view own analyses" ON saved_analyses;
CREATE POLICY "Users can view own analyses"
  ON saved_analyses FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own analyses" ON saved_analyses;
CREATE POLICY "Users can insert own analyses"
  ON saved_analyses FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own analyses" ON saved_analyses;
CREATE POLICY "Users can delete own analyses"
  ON saved_analyses FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================
-- 4. Fix always-true policies on analysis_results
-- ============================================================

DROP POLICY IF EXISTS "Anyone can insert analysis results" ON analysis_results;
DROP POLICY IF EXISTS "Anyone can view analysis results" ON analysis_results;

CREATE POLICY "Authenticated users can view analysis results"
  ON analysis_results FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- 5. Fix always-true policies on chat_sessions
-- ============================================================

DROP POLICY IF EXISTS "Anyone can insert chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Anyone can update chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Anyone can view chat sessions" ON chat_sessions;

CREATE POLICY "Authenticated users can view chat sessions"
  ON chat_sessions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- 6. Fix always-true policies on raw_posts
-- ============================================================

DROP POLICY IF EXISTS "Anyone can insert raw posts" ON raw_posts;
DROP POLICY IF EXISTS "Anyone can view raw posts" ON raw_posts;

CREATE POLICY "Authenticated users can view raw posts"
  ON raw_posts FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- 7. Drop unused indexes
-- ============================================================

DROP INDEX IF EXISTS idx_analysis_sector_created;
DROP INDEX IF EXISTS idx_analysis_expires;
DROP INDEX IF EXISTS idx_raw_posts_analysis;
DROP INDEX IF EXISTS idx_raw_posts_source;
DROP INDEX IF EXISTS idx_chat_sessions_analysis;
DROP INDEX IF EXISTS idx_housing_cache_series;
DROP INDEX IF EXISTS idx_profiles_email;
DROP INDEX IF EXISTS idx_saved_analyses_user;

-- ============================================================
-- 8. Fix mutable search_path on handle_new_user function
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(COALESCE(NEW.email, ''), '@', 1))
  );
  RETURN NEW;
END;
$function$;
