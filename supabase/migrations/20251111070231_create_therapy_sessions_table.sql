/*
  # Create therapy_sessions table

  ## Summary
  Creates a new table to store Voice AI Therapist conversation sessions for users.

  ## Changes

  1. New Tables
    - `therapy_sessions`
      - `id` (uuid, primary key) - Unique identifier for each therapy session
      - `user_id` (uuid, foreign key) - Links to auth.users
      - `session_start_time` (timestamptz) - When the session began
      - `session_end_time` (timestamptz) - When the session ended
      - `conversation_log` (jsonb) - Array of messages with role, content, and timestamp
      - `mood_mentioned` (text array) - Array of moods/feelings mentioned by user
      - `actions_triggered` (jsonb) - Array of actions triggered during session
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `therapy_sessions` table
    - Add policy for users to read their own sessions
    - Add policy for users to insert their own sessions
    - Add policy for users to update their own sessions
    - Add policy for users to delete their own sessions

  3. Indexes
    - Add index on user_id for fast lookups
    - Add index on session_start_time for chronological queries

  ## Important Notes
    - All conversation data is private and only accessible by the session owner
    - Conversation logs stored as JSONB for flexibility and query capability
    - Mood tracking helps identify patterns in emotional state over time
*/

CREATE TABLE IF NOT EXISTS therapy_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_start_time timestamptz DEFAULT now() NOT NULL,
  session_end_time timestamptz,
  conversation_log jsonb DEFAULT '[]'::jsonb NOT NULL,
  mood_mentioned text[] DEFAULT ARRAY[]::text[],
  actions_triggered jsonb DEFAULT '[]'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE therapy_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own therapy sessions"
  ON therapy_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own therapy sessions"
  ON therapy_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own therapy sessions"
  ON therapy_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own therapy sessions"
  ON therapy_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_therapy_sessions_user_id ON therapy_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_start_time ON therapy_sessions(user_id, session_start_time DESC);

CREATE OR REPLACE FUNCTION update_therapy_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_therapy_session_updated_at ON therapy_sessions;
CREATE TRIGGER trigger_update_therapy_session_updated_at
  BEFORE UPDATE ON therapy_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_therapy_session_updated_at();
