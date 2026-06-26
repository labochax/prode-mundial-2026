import type { SupabaseClient } from "@supabase/supabase-js";

import type { LeaderboardResultMarker } from "@/lib/leaderboard/leaderboard-types";
import type { Database } from "@/lib/supabase/database.types";

type SupabaseDatabaseClient = SupabaseClient<Database>;

export type LeaderboardRecentPredictionRow = {
  matches: {
    id: string;
    kickoff_at: string | null;
    match_number: number | null;
    status: string;
  } | null;
  points: number | null;
  user_id: string;
};

const fallbackRecentMarkers: LeaderboardResultMarker[] = [
  "empty",
  "empty",
  "empty",
  "empty",
  "empty",
];

export type LeaderboardRecentResults = {
  latestScoredMatchPointsByUserId: Map<string, number>;
  recentMarkersByUserId: Map<string, LeaderboardResultMarker[]>;
};

export function mapPredictionPointsToResultMarker(
  points: number | null,
): LeaderboardResultMarker {
  if (points === 3) {
    return "exact";
  }

  if (points === 1) {
    return "outcome";
  }

  if (points === 0) {
    return "miss";
  }

  return "empty";
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

  const matchNumberDiff =
    (right.matches?.match_number ?? -1) - (left.matches?.match_number ?? -1);

  if (matchNumberDiff !== 0) {
    return matchNumberDiff;
  }

  return (right.matches?.id ?? "").localeCompare(left.matches?.id ?? "");
}

function isScoredFinishedPrediction(row: LeaderboardRecentPredictionRow) {
  return row.matches?.status === "FINISHED" && typeof row.points === "number";
}

export function buildRecentResultMarkersByUser(
  rows: LeaderboardRecentPredictionRow[],
) {
  const rowsByUserId = new Map<string, LeaderboardRecentPredictionRow[]>();

  for (const row of rows.filter(isScoredFinishedPrediction)) {
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
        markers.push("empty");
      }

      return [userId, markers] as const;
    }),
  );
}

function getLatestScoredMatchPointsByUser(
  rows: LeaderboardRecentPredictionRow[],
) {
  const scoredRows = rows.filter(isScoredFinishedPrediction);
  const latestMatchId = [...scoredRows].sort(compareRecentPredictions)[0]?.matches
    ?.id;

  if (!latestMatchId) {
    return new Map<string, number>();
  }

  return new Map(
    scoredRows
      .filter((row) => row.matches?.id === latestMatchId)
      .map((row) => [row.user_id, row.points as number]),
  );
}

export function buildLeaderboardRecentResults(
  rows: LeaderboardRecentPredictionRow[],
): LeaderboardRecentResults {
  return {
    latestScoredMatchPointsByUserId: getLatestScoredMatchPointsByUser(rows),
    recentMarkersByUserId: buildRecentResultMarkersByUser(rows),
  };
}

export function getFallbackRecentResultMarkers() {
  return [...fallbackRecentMarkers];
}

export async function getLeaderboardRecentResults(
  client: SupabaseDatabaseClient,
  poolId: string,
) {
  const { data, error } = await client
    .from("predictions")
    .select("user_id,points,matches!inner(id,kickoff_at,match_number,status)")
    .eq("pool_id", poolId)
    .not("points", "is", null)
    .eq("matches.status", "FINISHED");

  if (error) {
    throw error;
  }

  return buildLeaderboardRecentResults(
    (data ?? []) as LeaderboardRecentPredictionRow[],
  );
}
