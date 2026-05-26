import type { SupabaseClient } from "@supabase/supabase-js";

import {
  mergeMiMundialBonusPoints,
  type LeaderboardPointsBreakdownRow,
} from "@/lib/leaderboard/leaderboard-points";
import type { Database } from "@/lib/supabase/database.types";

type SupabaseDatabaseClient = SupabaseClient<Database>;
type PoolLeaderboardRpcRow =
  Database["public"]["Functions"]["get_pool_leaderboard"]["Returns"][number];
type TournamentPredictionBonusRow = Pick<
  Database["public"]["Tables"]["tournament_predictions"]["Row"],
  "bonus_points" | "user_id"
>;

export type PoolLeaderboardRow =
  LeaderboardPointsBreakdownRow<PoolLeaderboardRpcRow>;

export async function getPoolLeaderboard(client: SupabaseDatabaseClient, poolId: string) {
  const [leaderboardResult, bonusResult] = await Promise.all([
    client.rpc("get_pool_leaderboard", {
      target_pool_id: poolId,
    }),
    client
      .from("tournament_predictions")
      .select("user_id, bonus_points")
      .eq("pool_id", poolId),
  ]);

  if (leaderboardResult.error) {
    throw leaderboardResult.error;
  }

  if (bonusResult.error) {
    throw bonusResult.error;
  }

  return mergeMiMundialBonusPoints(
    leaderboardResult.data ?? [],
    (bonusResult.data ?? []) as TournamentPredictionBonusRow[],
  );
}
