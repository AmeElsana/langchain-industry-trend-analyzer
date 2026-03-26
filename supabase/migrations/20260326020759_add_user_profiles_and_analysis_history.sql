/*
  # Add User Profiles and Analysis History

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text) - User email
      - `display_name` (text) - User display name
      - `created_at` (timestamptz) - Account creation time
    - `saved_analyses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `sector` (text) - Sector analyzed
      - `topic` (text) - Topic name
      - `summary` (text) - Analysis summary
      - `sentiment` (jsonb) - Sentiment breakdown
      - `trending_topics` (jsonb) - Array of trending topics
      - `volume_over_time` (jsonb) - Volume data
      - `key_insights` (jsonb) - Array of insights
      - `sources` (jsonb) - Array of source references
      - `created_at` (timestamptz) - When analysis was saved

  2. Security
    - Enable RLS on both tables
    - Users can only read/update their own profile
    - Users can only read/insert/delete their own saved analyses

  3. Triggers
    - Auto-create profile on user signup
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL DEFAULT '',
  display_name text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS saved_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sector text NOT NULL DEFAULT '',
  topic text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  sentiment jsonb NOT NULL DEFAULT '{}'::jsonb,
  trending_topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  volume_over_time jsonb NOT NULL DEFAULT '[]'::jsonb,
  key_insights jsonb NOT NULL DEFAULT '[]'::jsonb,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_analyses_user ON saved_analyses(user_id, created_at DESC);

ALTER TABLE saved_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses"
  ON saved_analyses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
  ON saved_analyses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
  ON saved_analyses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(COALESCE(NEW.email, ''), '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;
