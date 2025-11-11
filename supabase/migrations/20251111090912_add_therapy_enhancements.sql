/*
  # Add Therapy Feature Enhancements

  1. Schema Changes
    - Add `therapeutic_tone` column to `user_profiles` table
      - Stores user's preferred therapeutic interaction style (gentle, practical, challenging)
      - Type: text with check constraint
      - Nullable to allow default behavior when not set
    
    - Add `crisis_detected` column to `therapy_sessions` table
      - Boolean flag to track if crisis keywords were detected during session
      - Type: boolean with default false
      - Non-nullable
    
    - Add `inner_child_work_count` column to `therapy_sessions` table
      - Counter for inner child work interactions in session
      - Type: integer with default 0
      - Non-nullable
    
    - Add `therapeutic_modalities_used` column to `therapy_sessions` table
      - JSON array tracking which therapeutic modalities were emphasized
      - Type: jsonb with default empty array
      - Non-nullable
    
    - Add `skincare_suppressed` column to `therapy_sessions` table
      - Boolean flag to track if user has suppressed skincare mentions
      - Type: boolean with default false
      - Non-nullable

  2. Purpose
    - Enable personalized therapeutic tone adaptation
    - Track crisis detections for safety and analytics
    - Monitor inner child work engagement
    - Analyze which therapeutic approaches are most used
    - Respect user preference to focus on emotional wellness over skincare

  3. Security
    - All existing RLS policies remain in effect
    - No new security risks introduced
*/

-- Add therapeutic_tone to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'therapeutic_tone'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN therapeutic_tone text CHECK (therapeutic_tone IN ('gentle', 'practical', 'challenging'));
  END IF;
END $$;

-- Add crisis_detected to therapy_sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'therapy_sessions' AND column_name = 'crisis_detected'
  ) THEN
    ALTER TABLE therapy_sessions 
    ADD COLUMN crisis_detected boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add inner_child_work_count to therapy_sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'therapy_sessions' AND column_name = 'inner_child_work_count'
  ) THEN
    ALTER TABLE therapy_sessions 
    ADD COLUMN inner_child_work_count integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Add therapeutic_modalities_used to therapy_sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'therapy_sessions' AND column_name = 'therapeutic_modalities_used'
  ) THEN
    ALTER TABLE therapy_sessions 
    ADD COLUMN therapeutic_modalities_used jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
END $$;

-- Add skincare_suppressed to therapy_sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'therapy_sessions' AND column_name = 'skincare_suppressed'
  ) THEN
    ALTER TABLE therapy_sessions 
    ADD COLUMN skincare_suppressed boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Create index on crisis_detected for analytics queries
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_crisis_detected 
ON therapy_sessions(crisis_detected) 
WHERE crisis_detected = true;

-- Create index on therapeutic_modalities_used for analytics
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_modalities 
ON therapy_sessions USING gin(therapeutic_modalities_used);

-- Add comment to document the therapeutic_tone field
COMMENT ON COLUMN user_profiles.therapeutic_tone IS 
'User preference for therapeutic interaction style: gentle (nurturing, supportive), practical (solution-focused, structured), or challenging (direct, growth-oriented)';

COMMENT ON COLUMN therapy_sessions.crisis_detected IS 
'Flag indicating if crisis keywords (suicide, self-harm) were detected during this session';

COMMENT ON COLUMN therapy_sessions.inner_child_work_count IS 
'Number of inner child work interventions or exercises during this session';

COMMENT ON COLUMN therapy_sessions.therapeutic_modalities_used IS 
'Array of therapeutic modalities emphasized during session: CBT, ACT, SCHEMA, TRAUMA, MINDFULNESS, INNER_CHILD, PSYCHOANALYTIC';

COMMENT ON COLUMN therapy_sessions.skincare_suppressed IS 
'User has indicated they want to focus on emotional wellness without skincare mentions';
