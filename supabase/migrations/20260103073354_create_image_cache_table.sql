/*
  # Create image cache table

  1. New Tables
    - `image_cache`
      - `id` (uuid, primary key) - Unique identifier
      - `pexels_id` (text, unique) - Pexels image ID
      - `url` (text) - Full URL for image
      - `photographer` (text) - Photographer name
      - `photographer_url` (text) - Photographer Pexels URL
      - `avg_color` (text) - Average color of image
      - `width` (integer) - Image width
      - `height` (integer) - Image height
      - `src_original` (text) - Original quality URL
      - `src_large2x` (text) - Large 2x quality URL
      - `src_large` (text) - Large quality URL
      - `src_medium` (text) - Medium quality URL
      - `src_small` (text) - Small quality URL
      - `alt` (text) - Alt text
      - `cached_at` (timestamptz) - When image was cached
  
  2. Indexes
    - Index on pexels_id for fast lookups
    - Index on cached_at for cache management

  3. Security
    - Enable RLS (public read-only)
    - Public can select cached images
*/

CREATE TABLE IF NOT EXISTS image_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pexels_id text UNIQUE NOT NULL,
  url text NOT NULL,
  photographer text NOT NULL,
  photographer_url text NOT NULL,
  avg_color text DEFAULT '#000000',
  width integer NOT NULL,
  height integer NOT NULL,
  src_original text NOT NULL,
  src_large2x text NOT NULL,
  src_large text NOT NULL,
  src_medium text NOT NULL,
  src_small text NOT NULL,
  alt text DEFAULT '',
  cached_at timestamptz DEFAULT now()
);

ALTER TABLE image_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read cached images"
  ON image_cache FOR SELECT
  TO public
  USING (true);

CREATE INDEX IF NOT EXISTS idx_image_cache_pexels_id ON image_cache(pexels_id);
CREATE INDEX IF NOT EXISTS idx_image_cache_cached_at ON image_cache(cached_at);