import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

/**
 * Singleton Supabase client instance.
 */

const url = config.supabase.url;
const key = config.supabase.anonKey;

if (!url || !key) {
  console.error('❌ Supabase Initialization Error: Missing environment variables.');
  console.error('Expected VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file.');
  console.log('Current values:', { url, key });
}

// Create the client. We use a fallback to prevent the SDK from throwing a 
// blocking error, but the console.error above will warn us that it is fake.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  key || 'placeholder'
);
