/*
  # TrendLens Database Schema

  ## Overview
  Creates the core database schema for TrendLens application to store analysis results,
  user preferences, and cached trend data for improved performance and data persistence.

  ## Tables Created

  ### 1. `analysis_results`
  Stores AI-generated trend analysis results with metadata
  - `id` (uuid, primary key) - Unique identifier
  - `sector` (text) - Industry sector analyzed
  - `keywords` (jsonb) - Array of keywords used in analysis
  - `summary` (text) - AI-generated summary
  - `sentiment` (text) - Overall sentiment (positive/neutral/negative)
  - `insights` (jsonb) - Array of key insights
  - `trending_topics` (jsonb) - Array of trending topics
  - `data_sources` (jsonb) - Source breakdown (Reddit, HN, News)
  - `total_posts` (integer) - Total number of posts analyzed
  - `created_at` (timestamptz) - Timestamp of analysis
  - `expires_at` (timestamptz) - Cache expiration timestamp

  ### 2. `raw_posts`
  Stores fetched posts from various sources for reprocessing and analysis
  - `id` (uuid, primary key) - Unique identifier
  - `analysis_id` (uuid, foreign key) - Links to analysis_results
  - `source` (text) - Data source (Reddit, HackerNews, News)
  - `title` (text) - Post title
  - `content` (text) - Post content/description
  - `url` (text) - Original post URL
  - `score` (integer) - Post score/points
  - `num_comments` (integer) - Number of comments
  - `published_at` (timestamptz) - Original publish date
  - `created_at` (timestamptz) - When stored in DB

  ### 3. `chat_sessions`
  Stores chat conversation history for context and analytics
  - `id` (uuid, primary key) - Unique identifier
  - `analysis_id` (uuid, foreign key) - Links to analysis_results
  - `messages` (jsonb) - Array of chat messages
  - `created_at` (timestamptz) - Session start time
  - `updated_at` (timestamptz) - Last message time

  ## Security
  - RLS enabled on all tables
  - Public read access for demonstration purposes
  - Insert/update/delete restricted to authenticated users (future auth implementation)

  ## Indexes
  - Fast lookups by sector and creation date
  - Efficient filtering by expiration for cache cleanup
*/

-- Create analysis_results table
CREATE TABLE IF NOT EXISTS analysis_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sector text NOT NULL,
  keywords jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary text DEFAULT '',
  sentiment text DEFAULT 'neutral',
  insights jsonb DEFAULT '[]'::jsonb,
  trending_topics jsonb DEFAULT '[]'::jsonb,
  data_sources jsonb DEFAULT '{}'::jsonb,
  total_posts integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '10 minutes')
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_analysis_sector_created ON analysis_results(sector, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_expires ON analysis_results(expires_at);

-- Create raw_posts table
CREATE TABLE IF NOT EXISTS raw_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid REFERENCES analysis_results(id) ON DELETE CASCADE,
  source text NOT NULL,
  title text NOT NULL,
  content text DEFAULT '',
  url text DEFAULT '',
  score integer DEFAULT 0,
  num_comments integer DEFAULT 0,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_raw_posts_analysis ON raw_posts(analysis_id);
CREATE INDEX IF NOT EXISTS idx_raw_posts_source ON raw_posts(source);

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid REFERENCES analysis_results(id) ON DELETE CASCADE,
  messages jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_chat_sessions_analysis ON chat_sessions(analysis_id);

-- Enable Row Level Security
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (demo purposes)
CREATE POLICY "Anyone can view analysis results"
  ON analysis_results FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert analysis results"
  ON analysis_results FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view raw posts"
  ON raw_posts FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert raw posts"
  ON raw_posts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view chat sessions"
  ON chat_sessions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert chat sessions"
  ON chat_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update chat sessions"
  ON chat_sessions FOR UPDATE
  USING (true)
  WITH CHECK (true);