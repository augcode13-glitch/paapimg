import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Favorite {
  id: string;
  user_id: string;
  pexels_id: string;
  image_url: string;
  photographer: string;
  photographer_url: string;
  avg_color: string;
  created_at: string;
}
