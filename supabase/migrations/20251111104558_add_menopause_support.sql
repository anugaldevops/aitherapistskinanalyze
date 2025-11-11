/*
  # Add Menopause Support Mode

  ## Overview
  This migration adds menopause support tracking to the therapy sessions system,
  allowing the AI therapist to detect and respond appropriately to menopause-related
  discussions with specialized meditations and interventions.

  ## Changes

  1. New Fields in therapy_sessions
    - `menopause_mode` (boolean) - Tracks if session is in menopause support mode
    - `menopause_symptoms` (text[]) - Array of symptoms mentioned during session
    - `menopause_meditations_offered` (jsonb) - Tracks which meditations were offered

  2. Security
    - Maintains existing RLS policies
    - All new fields follow same security pattern as existing columns

  ## Notes
  - Menopause mode auto-activates when relevant keywords detected
  - Tracks symptoms for personalized meditation recommendations
  - Maintains privacy and security of sensitive health information
*/

-- Add menopause tracking fields to therapy_sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'therapy_sessions' AND column_name = 'menopause_mode'
  ) THEN
    ALTER TABLE therapy_sessions ADD COLUMN menopause_mode boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'therapy_sessions' AND column_name = 'menopause_symptoms'
  ) THEN
    ALTER TABLE therapy_sessions ADD COLUMN menopause_symptoms text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'therapy_sessions' AND column_name = 'menopause_meditations_offered'
  ) THEN
    ALTER TABLE therapy_sessions ADD COLUMN menopause_meditations_offered jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Create index for faster menopause session queries
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_menopause_mode
  ON therapy_sessions(menopause_mode)
  WHERE menopause_mode = true;

-- Add comment for documentation
COMMENT ON COLUMN therapy_sessions.menopause_mode IS 'Indicates if session is focused on menopause support';
COMMENT ON COLUMN therapy_sessions.menopause_symptoms IS 'Array of menopause symptoms mentioned by user';
COMMENT ON COLUMN therapy_sessions.menopause_meditations_offered IS 'JSON array of meditation IDs offered during menopause mode';