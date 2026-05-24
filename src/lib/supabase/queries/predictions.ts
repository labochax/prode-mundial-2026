import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type SupabaseDatabaseClient = SupabaseClient<Database>;

export async function getPredictionForMatch(
  client: SupabaseDatabaseClient,
  matchId: string,
  poolId?: string,
) {
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

  let query = client
    .from("predictions")
    .select("*")
    .eq("match_id", matchId)
    .eq("user_id", user.id);

  if (poolId) {
    query = query.eq("pool_id", poolId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
