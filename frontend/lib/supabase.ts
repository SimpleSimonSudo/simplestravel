import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Fehlende Supabase Environment Variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Server-side Client (für Server Components & Route Handlers)
export function createServerClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}

// Admin-side Client (um RLS zu umgehen, nur für Server-Aktionen/Mutations)
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables");
  }
  return createClient<any>(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}
