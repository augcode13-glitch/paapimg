/*
  # Create favorites table for gallery app

  1. New Tables
    - `favorites`
      - `id` (uuid, primary key) - Unique identifier for each favorite
      - `user_id` (uuid) - Reference to authenticated user
      - `pexels_id` (text) - Pexels image ID
      - `image_url` (text) - URL of the image
      - `photographer` (text) - Name of photographer
      - `photographer_url` (text) - Photographer's Pexels profile
      - `avg_color` (text) - Average color of the image
      - `created_at` (timestamptz) - When favorite was added
  
  2. Security
    - Enable RLS on `favorites` table
    - Add policy for authenticated users to read their own favorites
    - Add policy for authenticated users to insert their own favorites
    - Add policy for authenticated users to delete their own favorites
*/

CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pexels_id text NOT NULL,
  image_url text NOT NULL,
  photographer text NOT NULL,
  photographer_url text NOT NULL,
  avg_color text DEFAULT '#000000',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_pexels_id ON favorites(pexels_id);