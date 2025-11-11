/*
  # Create Reminders and Skincare Routine Tables

  1. New Tables
    - `skincare_routine_steps`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `routine_type` (text: 'morning' or 'evening')
      - `step_name` (text: product/step name)
      - `step_order` (integer: display order)
      - `scheduled_time` (time: HH:MM format)
      - `days_of_week` (jsonb: array of day numbers 0-6)
      - `enabled` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `reminders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `reminder_type` (text: 'morning_routine', 'evening_routine', 'next_scan')
      - `scheduled_time` (time: HH:MM format)
      - `scheduled_date` (date: for next_scan type)
      - `days_of_week` (jsonb: array of day numbers 0-6)
      - `enabled` (boolean)
      - `last_triggered` (timestamptz)
      - `notification_methods` (jsonb: array of 'browser' and/or 'email')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `routine_adherence`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `date` (date)
      - `routine_type` (text: 'morning' or 'evening')
      - `completed` (boolean)
      - `completed_steps` (integer: number of steps completed)
      - `total_steps` (integer: total steps in routine that day)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data

  3. Indexes
    - Add indexes on user_id and date columns for performance
*/

-- Create skincare_routine_steps table
CREATE TABLE IF NOT EXISTS skincare_routine_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_type text NOT NULL CHECK (routine_type IN ('morning', 'evening')),
  step_name text NOT NULL,
  step_order integer NOT NULL DEFAULT 0,
  scheduled_time time NOT NULL DEFAULT '07:00:00',
  days_of_week jsonb NOT NULL DEFAULT '[0,1,2,3,4,5,6]'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type text NOT NULL CHECK (reminder_type IN ('morning_routine', 'evening_routine', 'next_scan')),
  scheduled_time time,
  scheduled_date date,
  days_of_week jsonb DEFAULT '[0,1,2,3,4,5,6]'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  last_triggered timestamptz,
  notification_methods jsonb NOT NULL DEFAULT '["browser"]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create routine_adherence table
CREATE TABLE IF NOT EXISTS routine_adherence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  routine_type text NOT NULL CHECK (routine_type IN ('morning', 'evening')),
  completed boolean NOT NULL DEFAULT false,
  completed_steps integer NOT NULL DEFAULT 0,
  total_steps integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date, routine_type)
);

-- Enable RLS
ALTER TABLE skincare_routine_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_adherence ENABLE ROW LEVEL SECURITY;

-- RLS Policies for skincare_routine_steps
CREATE POLICY "Users can view own routine steps"
  ON skincare_routine_steps FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own routine steps"
  ON skincare_routine_steps FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own routine steps"
  ON skincare_routine_steps FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own routine steps"
  ON skincare_routine_steps FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for reminders
CREATE POLICY "Users can view own reminders"
  ON reminders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders"
  ON reminders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
  ON reminders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
  ON reminders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for routine_adherence
CREATE POLICY "Users can view own adherence"
  ON routine_adherence FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own adherence"
  ON routine_adherence FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own adherence"
  ON routine_adherence FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own adherence"
  ON routine_adherence FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_routine_steps_user_id ON skincare_routine_steps(user_id);
CREATE INDEX IF NOT EXISTS idx_routine_steps_routine_type ON skincare_routine_steps(user_id, routine_type);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_enabled ON reminders(user_id, enabled);
CREATE INDEX IF NOT EXISTS idx_adherence_user_date ON routine_adherence(user_id, date DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_routine_steps_updated_at ON skincare_routine_steps;
CREATE TRIGGER update_routine_steps_updated_at
  BEFORE UPDATE ON skincare_routine_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reminders_updated_at ON reminders;
CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
