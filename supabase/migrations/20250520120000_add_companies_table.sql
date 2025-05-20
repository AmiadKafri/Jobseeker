/*
  # Create companies table for user company tracking

  1. New Tables
    - `companies`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `company` (text)
      - `custom_company` (text)
      - `updated` (boolean)
      - `last_updated` (timestamp)
      - `link` (text)
      - `starred` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `companies` table
    - Add policies for authenticated users to:
      - Read their own companies
      - Create new companies
      - Update their own companies
      - Delete their own companies
*/

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  company text NOT NULL,
  custom_company text,
  updated boolean DEFAULT false,
  last_updated timestamptz,
  link text,
  starred boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own companies
CREATE POLICY "Users can read own companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy to allow users to create companies
CREATE POLICY "Users can create companies"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own companies
CREATE POLICY "Users can update own companies"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own companies
CREATE POLICY "Users can delete own companies"
  ON companies
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
