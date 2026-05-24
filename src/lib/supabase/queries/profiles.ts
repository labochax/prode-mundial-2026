import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type SupabaseDatabaseClient = SupabaseClient<Database>;

export async function getCurrentProfile(client: SupabaseDatabaseClient) {
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return null;
  }

  const { data, error } = await client.from("profiles").select("*").eq("id", user.id).maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
