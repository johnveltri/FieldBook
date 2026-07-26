import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/** Supabase client parameterized with the checked-in database contract. */
export type FieldSoloSupabaseClient = SupabaseClient<Database>;

export function createFieldSoloClient(
  supabaseUrl: string,
  supabaseAnonKey: string,
  options?: Parameters<typeof createClient<Database>>[2],
): FieldSoloSupabaseClient {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, options);
}
