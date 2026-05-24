"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getPublicSupabaseEnv } from "@/lib/config/env";
import type { Database } from "@/lib/supabase/database.types";

// Browser-only Supabase client. This must never use service-role credentials.
export function createSupabaseBrowserClient() {
  const { url, publishableKey } = getPublicSupabaseEnv();

  return createBrowserClient<Database>(url, publishableKey);
}
