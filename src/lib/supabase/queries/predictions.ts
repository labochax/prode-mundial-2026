import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type SupabaseDatabaseClient = SupabaseClient<Database>;
export type PredictionRow = Database["public"]["Tables"]["predictions"]["Row"];

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

export async function getPredictionsForMatches(
  client: SupabaseDatabaseClient,
  poolId: string,
  matchIds: string[],
) {
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user || matchIds.length === 0) {
    return new Map<string, PredictionRow>();
  }

  const { data, error } = await client
    .from("predictions")
    .select("*")
    .eq("pool_id", poolId)
    .eq("user_id", user.id)
    .in("match_id", matchIds);

  if (error) {
    throw error;
  }

  return new Map(data.map((prediction) => [prediction.match_id, prediction]));
}
