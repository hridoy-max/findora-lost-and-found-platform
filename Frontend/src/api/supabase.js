import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

/**
 * Singleton Supabase client instance.
 * This prevents the "Multiple GoTrueClient instances" warning
 * and ensures auth state is consistent across the app.
 */
export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
);
