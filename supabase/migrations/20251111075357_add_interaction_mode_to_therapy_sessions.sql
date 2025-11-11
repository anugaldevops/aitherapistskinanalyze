/*
  # Add interaction mode tracking to therapy sessions

  ## Summary
  Adds a new column to track whether users are interacting via voice or text chat
  in therapy sessions. This helps analyze user preferences and improve the feature.

  ## Changes

  1. Schema Updates
    - Add `interaction_mode` column to `therapy_sessions` table
      - Type: text
      - Possible values: 'voice', 'text', 'mixed'
      - Default: 'text'
      - Not null constraint

  2. Important Notes
    - 'mixed' mode is for sessions where user switches between voice and text
    - Existing sessions will default to 'text' mode
    - This data helps improve feature recommendations for users
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'therapy_sessions' AND column_name = 'interaction_mode'
  ) THEN
    ALTER TABLE therapy_sessions 
    ADD COLUMN interaction_mode text DEFAULT 'text' NOT NULL
    CHECK (interaction_mode IN ('voice', 'text', 'mixed'));
  END IF;
END $$;
