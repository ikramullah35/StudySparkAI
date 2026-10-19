"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/config";

// Browser-side Supabase client. Safe to call in Client Components.
// It stores the session in cookies so the server can read it too.
export function createClient() {
  const { url, key } = getSupabaseEnv();
  return createBrowserClient(url, key);
}
