/*
  # Add AI Therapist interaction preference to user profiles

  ## Summary
  Adds a preference column to store users' preferred AI Therapist interaction mode
  (voice or text). This allows the app to remember and default to their preferred mode.

  ## Changes

  1. Schema Updates
    - Add `therapist_mode_preference` column to `user_profiles` table
      - Type: text
      - Possible values: 'voice', 'text'
      - Default: 'text'
      - Not null constraint

  2. Important Notes
    - Defaults to 'text' as it's universally supported across all browsers
    - Users can change this preference at any time
    - The app will remember their choice for future sessions
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'therapist_mode_preference'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN therapist_mode_preference text DEFAULT 'text' NOT NULL
    CHECK (therapist_mode_preference IN ('voice', 'text'));
  END IF;
END $$;
