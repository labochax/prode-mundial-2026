import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getPublicSupabaseEnv } from "@/lib/config/env";
import type { Database } from "@/lib/supabase/database.types";

// Server Components, Server Actions, and Route Handlers should create a fresh
// client per request so auth cookies stay scoped to that request.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = getPublicSupabaseEnv();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. Middleware or Server Actions
          // should handle refresh writes when auth is wired.
        }
      },
    },
  });
}
