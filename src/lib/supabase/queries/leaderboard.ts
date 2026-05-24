import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type SupabaseDatabaseClient = SupabaseClient<Database>;

export async function getPoolLeaderboard(client: SupabaseDatabaseClient, poolId: string) {
  const { data, error } = await client.rpc("get_pool_leaderboard", {
    target_pool_id: poolId,
  });

  if (error) {
    throw error;
  }

  return data;
}
