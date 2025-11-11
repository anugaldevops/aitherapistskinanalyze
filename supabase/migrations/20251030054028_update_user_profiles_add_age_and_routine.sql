/*
  # Update User Profiles Schema

  ## Changes
    - Add `age` column to user_profiles
    - Add `skincare_routine` column to user_profiles
    - Add `profile_completed` column to user_profiles
    - Rename `full_name` to `name` for consistency

  ## Notes
    1. Uses conditional logic to safely add columns if they don't exist
    2. Preserves existing data
*/

-- Add age column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'age'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN age integer;
  END IF;
END $$;

-- Add skincare_routine column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'skincare_routine'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN skincare_routine text;
  END IF;
END $$;

-- Add profile_completed column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'profile_completed'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN profile_completed boolean DEFAULT false;
  END IF;
END $$;

-- Rename full_name to name if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'full_name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'name'
  ) THEN
    ALTER TABLE user_profiles RENAME COLUMN full_name TO name;
  END IF;
END $$;