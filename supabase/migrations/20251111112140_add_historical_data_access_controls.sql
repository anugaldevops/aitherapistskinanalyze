/*
  # Add Historical Data Access Controls

  ## Summary
  Creates privacy controls and consent management for GPT-4o access to historical user data.
  Users can granularly control what historical data is accessible to the AI therapist.

  ## Changes

  1. New Columns in user_profiles
    - `enable_historical_context` (boolean) - Master switch for historical data access
    - `allow_journal_access` (boolean) - Allow AI to access journal entries
    - `allow_therapy_history_access` (boolean) - Allow AI to access past therapy sessions
    - `allow_skin_analysis_access` (boolean) - Allow AI to access skin analysis history
    - `historical_context_days` (integer) - How many days back to include (default 90)
    - `last_privacy_update` (timestamptz) - Track when privacy settings were last changed

  ## Important Notes
    - All controls default to TRUE to enable the feature by default
    - Users can disable any or all data access types
    - Privacy settings are auditable with last_privacy_update timestamp
    - These settings are checked before enriching GPT-4o context
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'enable_historical_context'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN enable_historical_context boolean DEFAULT true NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'allow_journal_access'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN allow_journal_access boolean DEFAULT true NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'allow_therapy_history_access'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN allow_therapy_history_access boolean DEFAULT true NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'allow_skin_analysis_access'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN allow_skin_analysis_access boolean DEFAULT true NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'historical_context_days'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN historical_context_days integer DEFAULT 90 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'last_privacy_update'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN last_privacy_update timestamptz DEFAULT now();
  END IF;
END $$;

COMMENT ON COLUMN user_profiles.enable_historical_context IS
'Master switch: enables or disables all historical data access for AI context enrichment';

COMMENT ON COLUMN user_profiles.allow_journal_access IS
'Allows AI therapist to access and reference past journal entries';

COMMENT ON COLUMN user_profiles.allow_therapy_history_access IS
'Allows AI therapist to access and reference past therapy conversation logs';

COMMENT ON COLUMN user_profiles.allow_skin_analysis_access IS
'Allows AI therapist to access and reference skin analysis history and trends';

COMMENT ON COLUMN user_profiles.historical_context_days IS
'Number of days of historical data to include in AI context (default 90, max 365)';
