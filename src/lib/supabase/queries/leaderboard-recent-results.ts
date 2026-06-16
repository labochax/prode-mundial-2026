import type { SupabaseClient } from "@supabase/supabase-js";

import type { LeaderboardResultMarker } from "@/lib/leaderboard/leaderboard-types";
import type { Database } from "@/lib/supabase/database.types";

type SupabaseDatabaseClient = SupabaseClient<Database>;

export type LeaderboardRecentPredictionRow = {
  matches: {
    kickoff_at: string | null;
    match_number: number | null;
  } | null;
  points: number | null;
  user_id: string;
};

const fallbackRecentMarkers: LeaderboardResultMarker[] = [
  "miss",
  "miss",
  "miss",
  "miss",
  "miss",
];

export function mapPredictionPointsToResultMarker(
  points: number | null,
): LeaderboardResultMarker {
  if (points === 3) {
    return "exact";
  }

  if (points === 1) {
    return "outcome";
  }

  return "miss";
}

function compareRecentPredictions(
  left: LeaderboardRecentPredictionRow,
  right: LeaderboardRecentPredictionRow,
) {
  const leftKickoff = left.matches?.kickoff_at
    ? new Date(left.matches.kickoff_at).getTime()
    : Number.NEGATIVE_INFINITY;
  const rightKickoff = right.matches?.kickoff_at
    ? new Date(right.matches.kickoff_at).getTime()
    : Number.NEGATIVE_INFINITY;
  const kickoffDiff = rightKickoff - leftKickoff;

  if (kickoffDiff !== 0) {
    return kickoffDiff;
  }

  return (right.matches?.match_number ?? -1) - (left.matches?.match_number ?? -1);
}

export function buildRecentResultMarkersByUser(
  rows: LeaderboardRecentPredictionRow[],
) {
  const rowsByUserId = new Map<string, LeaderboardRecentPredictionRow[]>();

  for (const row of rows) {
    const userRows = rowsByUserId.get(row.user_id) ?? [];

    userRows.push(row);
    rowsByUserId.set(row.user_id, userRows);
  }

  return new Map(
    [...rowsByUserId.entries()].map(([userId, userRows]) => {
      const markers = userRows
        .sort(compareRecentPredictions)
        .slice(0, 5)
        .map((row) => mapPredictionPointsToResultMarker(row.points));

      while (markers.length < 5) {
        markers.push("miss");
      }

      return [userId, markers] as const;
    }),
  );
}

export function getFallbackRecentResultMarkers() {
  return [...fallbackRecentMarkers];
}

export async function getLeaderboardRecentResultMarkers(
  client: SupabaseDatabaseClient,
  poolId: string,
) {
  const { data, error } = await client
    .from("predictions")
    .select("user_id,points,matches!inner(kickoff_at,match_number,status)")
    .eq("pool_id", poolId)
    .not("points", "is", null)
    .eq("matches.status", "FINISHED");

  if (error) {
    throw error;
  }

  return buildRecentResultMarkersByUser(
    (data ?? []) as LeaderboardRecentPredictionRow[],
  );
}
