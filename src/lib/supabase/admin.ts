import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseAdminEnv } from "@/lib/config/env.server";
import type { Database } from "@/lib/supabase/database.types";

// Server-only service-role client for future sync, scoring, and admin jobs.
// Never import this module from client components or browser-exposed modules.
export function createSupabaseAdminClient() {
  const { url, serviceRoleKey } = getSupabaseAdminEnv();

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
