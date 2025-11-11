/*
  # Add Meditation Tracking to Therapy Sessions

  1. Schema Changes
    - Add `meditation_completions` table
      - Tracks which meditations users have completed
      - Links to therapy sessions for context
      - Records completion timestamps and duration listened
    
    - Add `completed_meditations` column to `therapy_sessions` table
      - JSON array tracking meditation IDs completed during session
      - Type: jsonb with default empty array
      - Non-nullable

  2. New Table: meditation_completions
    Columns:
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key to auth.users)
    - `session_id` (uuid, foreign key to therapy_sessions, nullable)
    - `meditation_id` (text) - ID from meditations data file
    - `meditation_title` (text) - Title for display
    - `duration_listened` (integer) - Seconds listened
    - `completed` (boolean) - Whether fully completed
    - `completed_at` (timestamptz) - When completed
    - `created_at` (timestamptz)

  3. Purpose
    - Track meditation engagement and completion rates
    - Provide insights into which meditations are most helpful
    - Enable progress tracking for users
    - Connect meditation practice with therapy outcomes

  4. Security
    - Enable RLS on meditation_completions table
    - Users can only view and insert their own completion records
    - Session association for contextual tracking
*/

-- Create meditation_completions table
CREATE TABLE IF NOT EXISTS meditation_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES therapy_sessions(id) ON DELETE SET NULL,
  meditation_id text NOT NULL,
  meditation_title text NOT NULL,
  duration_listened integer DEFAULT 0 NOT NULL,
  completed boolean DEFAULT false NOT NULL,
  completed_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE meditation_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own meditation completions"
  ON meditation_completions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meditation completions"
  ON meditation_completions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meditation completions"
  ON meditation_completions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add completed_meditations to therapy_sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'therapy_sessions' AND column_name = 'completed_meditations'
  ) THEN
    ALTER TABLE therapy_sessions 
    ADD COLUMN completed_meditations jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
END $$;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_meditation_completions_user_id 
ON meditation_completions(user_id);

CREATE INDEX IF NOT EXISTS idx_meditation_completions_session_id 
ON meditation_completions(session_id) 
WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_meditation_completions_meditation_id 
ON meditation_completions(meditation_id);

CREATE INDEX IF NOT EXISTS idx_meditation_completions_completed_at 
ON meditation_completions(completed_at DESC);

-- Create index for completed meditations in sessions
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_completed_meditations 
ON therapy_sessions USING gin(completed_meditations);

-- Add comments
COMMENT ON TABLE meditation_completions IS 
'Tracks user completion of guided meditations, linked to therapy sessions for context';

COMMENT ON COLUMN meditation_completions.meditation_id IS 
'ID matching meditation from meditations data file (e.g., inner-child, breathwork-478)';

COMMENT ON COLUMN meditation_completions.duration_listened IS 
'Total seconds of meditation audio listened to';

COMMENT ON COLUMN meditation_completions.completed IS 
'Whether user completed the full meditation (listened to end)';

COMMENT ON COLUMN therapy_sessions.completed_meditations IS 
'Array of meditation IDs completed during this therapy session';
