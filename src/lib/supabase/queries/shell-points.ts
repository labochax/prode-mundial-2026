import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type SupabaseDatabaseClient = SupabaseClient<Database>;
type PredictionPointsRow = Pick<
  Database["public"]["Tables"]["predictions"]["Row"],
  "points"
>;

function toPoints(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function calculateShellTotalPoints(
  predictions: readonly PredictionPointsRow[],
  miMundialBonusPoints: number | null | undefined,
) {
  const matchPoints = predictions.reduce(
    (total, prediction) => total + toPoints(prediction.points),
    0,
  );

  return matchPoints + toPoints(miMundialBonusPoints);
}

export async function getCurrentUserTotalPoints(
  client: SupabaseDatabaseClient,
  poolId: string,
  userId: string,
) {
  const [predictionsResult, tournamentPredictionResult] = await Promise.all([
    client
      .from("predictions")
      .select("points")
      .eq("pool_id", poolId)
      .eq("user_id", userId),
    client
      .from("tournament_predictions")
      .select("bonus_points")
      .eq("pool_id", poolId)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (predictionsResult.error) {
    throw predictionsResult.error;
  }

  if (tournamentPredictionResult.error) {
    throw tournamentPredictionResult.error;
  }

  return calculateShellTotalPoints(
    predictionsResult.data ?? [],
    tournamentPredictionResult.data?.bonus_points,
  );
}
