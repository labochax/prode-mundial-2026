import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import {
  getPoolLeaderboard,
  type PoolLeaderboardRow,
} from "@/lib/supabase/queries/leaderboard";

type SupabaseDatabaseClient = SupabaseClient<Database>;
type StandingRow = Pick<PoolLeaderboardRow, "rank" | "total_points" | "user_id">;

export function findCurrentUserStanding(
  leaderboard: readonly StandingRow[],
  userId: string,
) {
  const currentUser = leaderboard.find((row) => row.user_id === userId);

  return {
    rank: currentUser?.rank ?? null,
    totalPoints: currentUser?.total_points ?? 0,
  };
}

export async function getCurrentUserStanding(
  client: SupabaseDatabaseClient,
  poolId: string,
  userId: string,
) {
  const leaderboard = await getPoolLeaderboard(client, poolId);

  return findCurrentUserStanding(leaderboard, userId);
}
