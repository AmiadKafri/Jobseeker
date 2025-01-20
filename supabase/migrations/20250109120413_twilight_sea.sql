/*
  # Create jobs table for user job applications

  1. New Tables
    - `jobs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `company` (text)
      - `status` (text)
      - `notes` (text)
      - `position` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `jobs` table
    - Add policies for authenticated users to:
      - Read their own jobs
      - Create new jobs
      - Update their own jobs
      - Delete their own jobs
*/

CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  company text NOT NULL,
  status text NOT NULL,
  notes text,
  position jsonb NOT NULL DEFAULT '{"x": 0, "y": 0}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own jobs
CREATE POLICY "Users can read own jobs"
  ON jobs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy to allow users to create jobs
CREATE POLICY "Users can create jobs"
  ON jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own jobs
CREATE POLICY "Users can update own jobs"
  ON jobs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own jobs
CREATE POLICY "Users can delete own jobs"
  ON jobs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);