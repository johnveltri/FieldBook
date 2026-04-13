import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** Supabase client for Fieldbook — add generated `Database` generic when types are generated. */
export type FieldbookSupabaseClient = SupabaseClient;

export function createFieldbookClient(
  supabaseUrl: string,
  supabaseAnonKey: string,
  options?: Parameters<typeof createClient>[2],
): FieldbookSupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, options);
}
