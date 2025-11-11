/*
  # Create analysis_history table

  1. New Tables
    - `analysis_history`
      - `id` (uuid, primary key) - Unique identifier for each analysis
      - `user_id` (uuid, foreign key) - Links to auth.users
      - `analysis_date` (timestamptz) - When the analysis was performed
      - `user_age` (integer) - User's actual age at time of scan
      - `skin_age` (numeric) - Estimated skin age from analysis
      - `age_difference` (numeric) - Difference between skin age and actual age
      - `clinical_score` (numeric) - Clinical assessment score
      - `max_clinical_score` (numeric) - Maximum possible clinical score
      - `composite_index` (numeric) - Overall composite index score
      - `zone_scores` (jsonb) - Individual scores for all facial zones
      - `pigmentation_score` (numeric) - Overall pigmentation assessment
      - `top_concerns` (jsonb) - Array of top 3 problem areas
      - `raw_data` (jsonb) - Complete raw analysis data for future reference
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on `analysis_history` table
    - Add policy for users to read their own analyses
    - Add policy for users to insert their own analyses
    - Add policy for users to delete their own analyses
*/

CREATE TABLE IF NOT EXISTS analysis_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  analysis_date timestamptz DEFAULT now() NOT NULL,
  user_age integer NOT NULL,
  skin_age numeric NOT NULL,
  age_difference numeric NOT NULL,
  clinical_score numeric NOT NULL,
  max_clinical_score numeric NOT NULL,
  composite_index numeric NOT NULL,
  zone_scores jsonb DEFAULT '{}'::jsonb,
  pigmentation_score numeric DEFAULT 0,
  top_concerns jsonb DEFAULT '[]'::jsonb,
  raw_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses"
  ON analysis_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
  ON analysis_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
  ON analysis_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_analysis_history_user_id ON analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_history_analysis_date ON analysis_history(analysis_date DESC);