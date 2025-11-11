/*
  # Add metadata fields to analysis_history table

  1. New Columns
    - `photo_date` (timestamptz) - When the photo was actually taken (can be historical)
    - `age_in_photo` (integer) - User's age when the photo was taken
    - `skincare_routine` (text) - Description of skincare routine at that time
    - `lifestyle_habits` (jsonb) - Array of lifestyle habits (SPF use, smoking, exercise, etc.)
    - `notes` (text) - Additional notes about skin condition at that time
    - `updated_at` (timestamptz) - Last time the record was updated

  2. Changes
    - Allow users to edit metadata for existing analyses
    - Track when metadata was last updated
    
  3. Notes
    - All new fields are optional except photo_date and age_in_photo
    - photo_date defaults to analysis_date for backward compatibility
    - age_in_photo defaults to user_age for backward compatibility
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analysis_history' AND column_name = 'photo_date'
  ) THEN
    ALTER TABLE analysis_history ADD COLUMN photo_date timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analysis_history' AND column_name = 'age_in_photo'
  ) THEN
    ALTER TABLE analysis_history ADD COLUMN age_in_photo integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analysis_history' AND column_name = 'skincare_routine'
  ) THEN
    ALTER TABLE analysis_history ADD COLUMN skincare_routine text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analysis_history' AND column_name = 'lifestyle_habits'
  ) THEN
    ALTER TABLE analysis_history ADD COLUMN lifestyle_habits jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analysis_history' AND column_name = 'notes'
  ) THEN
    ALTER TABLE analysis_history ADD COLUMN notes text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analysis_history' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE analysis_history ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

UPDATE analysis_history 
SET age_in_photo = user_age 
WHERE age_in_photo IS NULL;

ALTER TABLE analysis_history ALTER COLUMN age_in_photo SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_analysis_history_photo_date ON analysis_history(photo_date DESC);