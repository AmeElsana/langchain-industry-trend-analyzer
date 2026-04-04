/*
  # Add vector embeddings for RAG (Retrieval-Augmented Generation)

  1. Extensions
    - Enable `vector` extension for embedding storage and similarity search

  2. New Tables
    - `post_embeddings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `sector` (text) - which sector this post belongs to
      - `source` (text) - Reddit, HackerNews, or NewsAPI
      - `title` (text) - post title
      - `content` (text) - post content/text
      - `url` (text) - original URL
      - `score` (integer) - engagement score
      - `embedding` (vector(384)) - embedding vector for similarity search
      - `created_at` (timestamptz) - when the embedding was stored

  3. New Tables
    - `chat_messages`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `sector` (text) - which sector context
      - `role` (text) - user or assistant
      - `content` (text) - message content
      - `created_at` (timestamptz)

  4. Security
    - Enable RLS on both new tables
    - Users can only access their own embeddings and chat messages

  5. Functions
    - `match_posts` - performs similarity search against stored embeddings
*/

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS post_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  sector text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '',
  score integer NOT NULL DEFAULT 0,
  embedding extensions.vector(384),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE post_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own embeddings"
  ON post_embeddings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own embeddings"
  ON post_embeddings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own embeddings"
  ON post_embeddings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_post_embeddings_user_sector
  ON post_embeddings(user_id, sector);

CREATE INDEX IF NOT EXISTS idx_post_embeddings_embedding
  ON post_embeddings
  USING ivfflat (embedding extensions.vector_cosine_ops)
  WITH (lists = 50);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  sector text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'user',
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own chat messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages"
  ON chat_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_sector
  ON chat_messages(user_id, sector, created_at DESC);

CREATE OR REPLACE FUNCTION match_posts(
  query_embedding extensions.vector(384),
  match_user_id uuid,
  match_sector text,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  sector text,
  source text,
  title text,
  content text,
  url text,
  score integer,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pe.id,
    pe.sector,
    pe.source,
    pe.title,
    pe.content,
    pe.url,
    pe.score,
    1 - (pe.embedding <=> query_embedding) AS similarity
  FROM post_embeddings pe
  WHERE pe.user_id = match_user_id
    AND pe.sector = match_sector
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
