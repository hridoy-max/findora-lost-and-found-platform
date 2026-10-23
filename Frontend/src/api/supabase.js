import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

/**
 * Initializes the Supabase client using environment variables.
 */
export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
);
