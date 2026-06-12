import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildMatchPredictionStats,
  buildMatchPredictionStatsByMatchIds,
  isMatchPredictionStatsVisible,
} from "@/lib/matches/match-prediction-stats";
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

export async function getMatchPredictionStats(
  client: SupabaseDatabaseClient,
  {
    lockAt,
    matchId,
    poolId,
    status,
  }: {
    lockAt: string;
    matchId: string;
    poolId: string;
    status?: string | null;
  },
) {
  const isVisible = isMatchPredictionStatsVisible({ lockAt, status });

  if (!isVisible) {
    return buildMatchPredictionStats([], { isVisible: false });
  }

  const { data, error } = await client
    .from("predictions")
    .select("predicted_away_score,predicted_home_score")
    .eq("pool_id", poolId)
    .eq("match_id", matchId);

  if (error) {
    throw error;
  }

  return buildMatchPredictionStats(data ?? [], { isVisible: true });
}

export async function getMatchPredictionStatsByMatchIds(
  client: SupabaseDatabaseClient,
  {
    matches,
    poolId,
  }: {
    matches: Array<{
      id: string;
      lockAt: string;
      status: string;
    }>;
    poolId: string;
  },
) {
  const matchVisibility = matches.map((match) => ({
    isVisible: isMatchPredictionStatsVisible({
      lockAt: match.lockAt,
      status: match.status,
    }),
    matchId: match.id,
  }));
  const visibleMatchIds = matchVisibility
    .filter((match) => match.isVisible)
    .map((match) => match.matchId);

  if (visibleMatchIds.length === 0) {
    return buildMatchPredictionStatsByMatchIds([], matchVisibility);
  }

  const { data, error } = await client
    .from("predictions")
    .select("match_id,predicted_away_score,predicted_home_score")
    .eq("pool_id", poolId)
    .in("match_id", visibleMatchIds);

  if (error) {
    throw error;
  }

  return buildMatchPredictionStatsByMatchIds(data ?? [], matchVisibility);
}
