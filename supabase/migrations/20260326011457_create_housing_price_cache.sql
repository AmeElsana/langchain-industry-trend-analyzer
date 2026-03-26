/*
  # Housing Price Data Cache Table

  1. New Tables
    - `housing_price_cache`
      - `id` (uuid, primary key) - Unique identifier
      - `series_id` (text) - FRED series identifier (e.g., CSUSHPINSA, MSPUS)
      - `series_title` (text) - Human-readable series name
      - `units` (text) - Unit of measurement
      - `frequency` (text) - Data frequency (Monthly, Weekly, Quarterly)
      - `data` (jsonb) - Array of date/value data points
      - `fetched_at` (timestamptz) - When data was last fetched
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on `housing_price_cache` table
    - Add SELECT policy for authenticated users
    - Add INSERT policy for authenticated users
    - Add UPDATE policy for authenticated users

  3. Indexes
    - Index on series_id for fast lookups
    - Index on fetched_at for cache expiration queries
*/

CREATE TABLE IF NOT EXISTS housing_price_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id text NOT NULL,
  series_title text NOT NULL DEFAULT '',
  units text NOT NULL DEFAULT '',
  frequency text NOT NULL DEFAULT '',
  data jsonb NOT NULL DEFAULT '[]'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_series_id UNIQUE (series_id)
);

CREATE INDEX IF NOT EXISTS idx_housing_cache_series ON housing_price_cache(series_id);
CREATE INDEX IF NOT EXISTS idx_housing_cache_fetched ON housing_price_cache(fetched_at);

ALTER TABLE housing_price_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view housing data"
  ON housing_price_cache FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert housing data"
  ON housing_price_cache FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update housing data"
  ON housing_price_cache FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
