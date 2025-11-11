/*
  # Create journal_entries table for storing user journal reflections

  ## Summary
  Creates a new table to store journal entries written during therapy sessions,
  allowing the AI therapist to reference past reflections and track emotional patterns.

  ## Changes

  1. New Tables
    - `journal_entries`
      - `id` (uuid, primary key) - Unique identifier for each journal entry
      - `user_id` (uuid, foreign key) - Links to auth.users
      - `therapy_session_id` (uuid, foreign key) - Links to therapy_sessions (nullable)
      - `prompt` (text) - The journal prompt that was presented to the user
      - `entry_text` (text) - The user's journal reflection/writing
      - `entry_date` (timestamptz) - When the entry was written
      - `exercise_id` (text) - ID of the exercise that prompted this journal entry
      - `mood_at_time` (text) - User's emotional state when writing
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `journal_entries` table
    - Add policy for users to read their own journal entries
    - Add policy for users to insert their own journal entries
    - Add policy for users to update their own journal entries
    - Add policy for users to delete their own journal entries

  3. Indexes
    - Add index on user_id for fast lookups
    - Add index on therapy_session_id for session-based queries
    - Add index on entry_date for chronological queries

  ## Important Notes
    - All journal entries are strictly private and only accessible by the entry owner
    - therapy_session_id is nullable to allow standalone journaling outside sessions
    - Full-text search capabilities can be added later for journal content searching
*/

CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  therapy_session_id uuid REFERENCES therapy_sessions(id) ON DELETE SET NULL,
  prompt text NOT NULL,
  entry_text text NOT NULL,
  entry_date timestamptz DEFAULT now() NOT NULL,
  exercise_id text DEFAULT '',
  mood_at_time text DEFAULT '',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own journal entries"
  ON journal_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries"
  ON journal_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON journal_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON journal_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_session_id ON journal_entries(therapy_session_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(user_id, entry_date DESC);

CREATE OR REPLACE FUNCTION update_journal_entry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_journal_entry_updated_at ON journal_entries;
CREATE TRIGGER trigger_update_journal_entry_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_journal_entry_updated_at();

COMMENT ON TABLE journal_entries IS
'Stores private journal reflections written during therapy sessions or standalone journaling';

COMMENT ON COLUMN journal_entries.prompt IS
'The journal prompt or question that was presented to the user';

COMMENT ON COLUMN journal_entries.entry_text IS
'The user''s written reflection or journal entry';

COMMENT ON COLUMN journal_entries.therapy_session_id IS
'Optional link to the therapy session during which this entry was written';

COMMENT ON COLUMN journal_entries.exercise_id IS
'ID of the mini-exercise that prompted this journal entry (e.g., mini-journal-prompt)';
