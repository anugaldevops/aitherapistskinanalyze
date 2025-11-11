/*
  # Add Short-Session Therapy Enhancements

  1. New Columns for therapy_sessions table
    - `turn_count` (integer) - Tracks user-bot exchange pairs in current session
    - `max_turns_reached` (boolean) - Flags when 3-exchange limit is hit
    - `paraphrases_used` (jsonb) - Array of paraphrases used with timestamps
    - `user_emotion_labels` (jsonb) - Array of user's own emotional vocabulary
    - `cognitive_distortions_detected` (jsonb) - Array of detected distortion types with timestamps
    - `exercises_offered` (jsonb) - Array of exercises offered to user
    - `exercises_completed` (jsonb) - Array of exercises completed by user
    - `last_emotion_check` (timestamptz) - When we last asked about emotions
    - `session_phase` (text) - Current phase: 'opening', 'exploring', 'action', 'closing'

  2. Purpose
    - Enable turn-based session management (3-exchange cap)
    - Track empathetic listening patterns (paraphrasing)
    - Store user's emotional vocabulary for consistent mirroring
    - Log cognitive distortion interventions
    - Monitor exercise engagement
    - Support emotion-naming flow
    - Phase tracking for appropriate responses

  3. Security
    - All new columns respect existing RLS policies
    - No additional policies needed - user_id filtering handles access
*/

-- Add turn tracking columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'therapy_sessions' AND column_name = 'turn_count'
  ) THEN
    ALTER TABLE therapy_sessions 
    ADD COLUMN turn_count integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'therapy_sessions' AND column_name = 'max_turns_reached'
  ) THEN
    ALTER TABLE therapy_sessions 
    ADD COLUMN max_turns_reached boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add paraphrase tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'therapy_sessions' AND column_name = 'paraphrases_used'
  ) THEN
    ALTER TABLE therapy_sessions 
    ADD COLUMN paraphrases_used jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
END $$;

-- Add emotion vocabulary tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'therapy_sessions' AND column_name = 'user_emotion_labels'
  ) THEN
    ALTER TABLE therapy_sessions 
    ADD COLUMN user_emotion_labels jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
END $$;

-- Add cognitive distortion tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'therapy_sessions' AND column_name = 'cognitive_distortions_detected'
  ) THEN
    ALTER TABLE therapy_sessions 
    ADD COLUMN cognitive_distortions_detected jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
END $$;

-- Add exercise tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'therapy_sessions' AND column_name = 'exercises_offered'
  ) THEN
    ALTER TABLE therapy_sessions 
    ADD COLUMN exercises_offered jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'therapy_sessions' AND column_name = 'exercises_completed'
  ) THEN
    ALTER TABLE therapy_sessions 
    ADD COLUMN exercises_completed jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
END $$;

-- Add emotion check timestamp
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'therapy_sessions' AND column_name = 'last_emotion_check'
  ) THEN
    ALTER TABLE therapy_sessions 
    ADD COLUMN last_emotion_check timestamptz;
  END IF;
END $$;

-- Add session phase tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'therapy_sessions' AND column_name = 'session_phase'
  ) THEN
    ALTER TABLE therapy_sessions 
    ADD COLUMN session_phase text DEFAULT 'opening' NOT NULL;
  END IF;
END $$;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_turn_count 
ON therapy_sessions(turn_count);

CREATE INDEX IF NOT EXISTS idx_therapy_sessions_max_turns_reached 
ON therapy_sessions(max_turns_reached) 
WHERE max_turns_reached = true;

CREATE INDEX IF NOT EXISTS idx_therapy_sessions_session_phase 
ON therapy_sessions(session_phase);

-- Add GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_user_emotion_labels 
ON therapy_sessions USING gin(user_emotion_labels);

CREATE INDEX IF NOT EXISTS idx_therapy_sessions_cognitive_distortions 
ON therapy_sessions USING gin(cognitive_distortions_detected);

CREATE INDEX IF NOT EXISTS idx_therapy_sessions_exercises_offered 
ON therapy_sessions USING gin(exercises_offered);

-- Add comments for documentation
COMMENT ON COLUMN therapy_sessions.turn_count IS 
'Number of user-bot exchange pairs in current session (max 3 for short sessions)';

COMMENT ON COLUMN therapy_sessions.max_turns_reached IS 
'Flag indicating session has reached 3-exchange limit and action menu should appear';

COMMENT ON COLUMN therapy_sessions.paraphrases_used IS 
'Array of paraphrased reflections used with timestamps: [{text: string, timestamp: string}]';

COMMENT ON COLUMN therapy_sessions.user_emotion_labels IS 
'User''s own emotional vocabulary for consistent mirroring: [string, string, ...]';

COMMENT ON COLUMN therapy_sessions.cognitive_distortions_detected IS 
'Detected distortions with type and timestamp: [{type: string, pattern: string, timestamp: string}]';

COMMENT ON COLUMN therapy_sessions.exercises_offered IS 
'Exercises offered to user: [{exercise_id: string, offered_at: string}]';

COMMENT ON COLUMN therapy_sessions.exercises_completed IS 
'Exercises completed by user: [{exercise_id: string, completed_at: string, reflection: string}]';

COMMENT ON COLUMN therapy_sessions.last_emotion_check IS 
'Timestamp of last "What emotion are you feeling?" prompt';

COMMENT ON COLUMN therapy_sessions.session_phase IS 
'Current session phase: opening, exploring, action, or closing';
