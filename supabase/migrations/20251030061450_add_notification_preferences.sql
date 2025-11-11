/*
  # Add notification preferences to user profiles

  1. Changes
    - Add `notify_analysis_reminders` column (boolean, default false)
    - Add `notify_routine_reminders` column (boolean, default false)
    - Add `notify_progress_updates` column (boolean, default false)
  
  2. Security
    - No changes to RLS policies needed (existing policies cover new columns)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'notify_analysis_reminders'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN notify_analysis_reminders boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'notify_routine_reminders'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN notify_routine_reminders boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'notify_progress_updates'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN notify_progress_updates boolean DEFAULT false;
  END IF;
END $$;