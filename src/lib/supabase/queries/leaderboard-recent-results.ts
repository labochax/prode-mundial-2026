import type { SupabaseClient } from "@supabase/supabase-js";

import type { LeaderboardTrendWindowContribution } from "@/lib/leaderboard/leaderboard-points";
import type { LeaderboardResultMarker } from "@/lib/leaderboard/leaderboard-types";
import {
  comparePredictionMatchesByMostRecent,
  comparePredictionMatchesChronologically,
  getPredictionResultMarker,
  isFinishedScoredVisiblePrediction,
  type VisiblePredictionMatch,
} from "@/lib/predictions/visible-prediction-results";
import type { Database } from "@/lib/supabase/database.types";

type SupabaseDatabaseClient = SupabaseClient<Database>;

const leaderboardRecentResultsPageSize = 1000;

export type LeaderboardRecentPredictionRow = {
  matches: VisiblePredictionMatch | null;
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
  recentMarkersByUserId: Map<string, LeaderboardResultMarker[]>;
  trendWindowContributionsByUserId: Map<
    string,
    LeaderboardTrendWindowContribution
  >;
};

export function mapPredictionPointsToResultMarker(
  points: number | null,
): LeaderboardResultMarker {
  return getPredictionResultMarker(points);
}

function isScoredFinishedPrediction(row: LeaderboardRecentPredictionRow) {
  return isFinishedScoredVisiblePrediction(row);
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
        .sort((left, right) =>
          comparePredictionMatchesChronologically(left.matches!, right.matches!),
        )
        .slice(-5)
        .map((row) => mapPredictionPointsToResultMarker(row.points));

      while (markers.length < 5) {
        markers.push("empty");
      }

      return [userId, markers] as const;
    }),
  );
}

function getTrendWindowMatchIds(
  rows: LeaderboardRecentPredictionRow[],
) {
  const scoredRows = rows.filter(isScoredFinishedPrediction);
  const matchesById = new Map(
    scoredRows.map((row) => [row.matches!.id, row.matches!] as const),
  );

  return [...matchesById.values()]
    .sort(comparePredictionMatchesByMostRecent)
    .slice(0, 5)
    .map((match) => match.id);
}

function getTrendWindowContributionsByUser(
  rows: LeaderboardRecentPredictionRow[],
) {
  const trendWindowMatchIds = new Set(getTrendWindowMatchIds(rows));

  if (trendWindowMatchIds.size === 0) {
    return new Map<string, LeaderboardTrendWindowContribution>();
  }

  const contributionsByUserId = new Map<
    string,
    LeaderboardTrendWindowContribution
  >();

  for (const row of rows.filter(isScoredFinishedPrediction)) {
    if (!trendWindowMatchIds.has(row.matches!.id)) {
      continue;
    }

    const points = row.points as 0 | 1 | 3;
    const contribution = contributionsByUserId.get(row.user_id) ?? {
      exactHits: 0,
      outcomeHits: 0,
      points: 0,
      predictedMatchesCount: 0,
    };

    contribution.exactHits += points === 3 ? 1 : 0;
    contribution.outcomeHits += points === 1 ? 1 : 0;
    contribution.points += points;
    contribution.predictedMatchesCount += 1;

    contributionsByUserId.set(row.user_id, contribution);
  }

  return contributionsByUserId;
}

export function buildLeaderboardRecentResults(
  rows: LeaderboardRecentPredictionRow[],
): LeaderboardRecentResults {
  return {
    recentMarkersByUserId: buildRecentResultMarkersByUser(rows),
    trendWindowContributionsByUserId:
      getTrendWindowContributionsByUser(rows),
  };
}

export function getFallbackRecentResultMarkers() {
  return [...fallbackRecentMarkers];
}

async function getAllLeaderboardRecentPredictionRows(
  client: SupabaseDatabaseClient,
  poolId: string,
) {
  const rows: LeaderboardRecentPredictionRow[] = [];
  let from = 0;

  while (true) {
    const to = from + leaderboardRecentResultsPageSize - 1;
    const { data, error } = await client
      .from("predictions")
      .select(
        "user_id,points,matches!inner(id,kickoff_at,lock_at,match_number,status,home_team_id,away_team_id)",
      )
      .eq("pool_id", poolId)
      .not("points", "is", null)
      .eq("matches.status", "FINISHED")
      .order("user_id", { ascending: true })
      .order("match_id", { ascending: true })
      .range(from, to);

    if (error) {
      throw error;
    }

    const pageRows = (data ?? []) as LeaderboardRecentPredictionRow[];

    rows.push(...pageRows);

    if (pageRows.length < leaderboardRecentResultsPageSize) {
      break;
    }

    from += leaderboardRecentResultsPageSize;
  }

  return rows;
}

export async function getLeaderboardRecentResults(
  client: SupabaseDatabaseClient,
  poolId: string,
) {
  return buildLeaderboardRecentResults(
    await getAllLeaderboardRecentPredictionRows(client, poolId),
  );
}
