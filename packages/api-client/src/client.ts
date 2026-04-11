import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** Supabase client for Fieldbook — add generated `Database` generic when types are generated. */
export type FieldbookSupabaseClient = SupabaseClient;

export function createFieldbookClient(
  supabaseUrl: string,
  supabaseAnonKey: string,
): FieldbookSupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey);
}
