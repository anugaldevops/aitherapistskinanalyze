/*
  # Add Intent Analytics to Therapy Sessions

  1. Changes
    - Add `intents_detected` column to track detected intents during sessions
    - Add `skincare_suppressed` column to track if skincare mentions were suppressed

  2. Security
    - No changes to RLS policies needed (inherits from existing table policies)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'therapy_sessions' AND column_name = 'intents_detected'
  ) THEN
    ALTER TABLE therapy_sessions ADD COLUMN intents_detected jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'therapy_sessions' AND column_name = 'skincare_suppressed'
  ) THEN
    ALTER TABLE therapy_sessions ADD COLUMN skincare_suppressed boolean DEFAULT false;
  END IF;
END $$;
