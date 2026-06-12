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

export async function getProfileById(
  client: SupabaseDatabaseClient,
  userId: string,
) {
  const { data, error } = await client
    .from("profiles")
    .select(
      "avatar_kind,avatar_value,display_name,email,full_name,google_avatar_url,id,prode_subgroup,prode_subgroups,school_group",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
