/*
  # Create Routine Step Completions Table

  1. New Tables
    - `routine_step_completions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `step_id` (uuid, foreign key to skincare_routine_steps)
      - `date` (date) - Date when step was completed
      - `completed_at` (timestamptz) - Exact timestamp of completion
      - `created_at` (timestamptz)
      - Unique constraint on (user_id, step_id, date) to prevent duplicates

  2. Security
    - Enable RLS on `routine_step_completions` table
    - Add policies for users to manage their own step completions

  3. Indexes
    - Index on (user_id, date) for fast daily completion lookups
    - Index on (user_id, step_id, date) for checking individual step status
*/

CREATE TABLE IF NOT EXISTS routine_step_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  step_id uuid REFERENCES skincare_routine_steps(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, step_id, date)
);

ALTER TABLE routine_step_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own step completions"
  ON routine_step_completions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own step completions"
  ON routine_step_completions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own step completions"
  ON routine_step_completions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own step completions"
  ON routine_step_completions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_step_completions_user_date
  ON routine_step_completions(user_id, date);

CREATE INDEX IF NOT EXISTS idx_step_completions_user_step_date
  ON routine_step_completions(user_id, step_id, date);
