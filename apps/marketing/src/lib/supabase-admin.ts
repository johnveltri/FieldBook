import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type WaitlistSignupInsert = {
  first_name: string;
  email: string;
  trades: string[];
  uses_software: boolean;
  tracking_tools: string[];
  job_sources: string[];
  privacy_policy_version: string;
  privacy_accepted_at: string;
  terms_version: string;
  terms_accepted_at: string;
  marketing_consent: boolean;
};

type WaitlistSignupRow = WaitlistSignupInsert & {
  id: string;
  status: string;
  created_at: string;
};

type WaitlistDatabase = {
  public: {
    Tables: {
      waitlist_signups: {
        Row: WaitlistSignupRow;
        Insert: WaitlistSignupInsert;
        Update: Partial<WaitlistSignupInsert>;
        Relationships: [];
      };
      waitlist_rate_limits: {
        Row: { key_hash: string; window_started_at: string; attempts: number };
        Insert: { key_hash: string; window_started_at: string; attempts?: number };
        Update: { attempts?: number };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      consume_waitlist_rate_limit: {
        Args: { p_key_hash: string; p_limit?: number };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

let adminClient: SupabaseClient<WaitlistDatabase> | null = null;

export function getSupabaseAdmin() {
  if (adminClient) return adminClient;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  adminClient = createClient<WaitlistDatabase>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return adminClient;
}
