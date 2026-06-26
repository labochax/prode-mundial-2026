import type {
  LeaderboardPlayer,
  LeaderboardTrendDirection,
} from "@/lib/leaderboard/leaderboard-types";

export type LeaderboardBasePointsRow = {
  display_name: string;
  exact_hits: number | null;
  outcome_hits: number | null;
  predicted_matches_count: number | null;
  rank?: bigint | number | null;
  total_points: number | null;
  user_id: string;
};

export type MiMundialBonusPointsRow = {
  bonus_points: number | null;
  user_id: string;
};

export type LeaderboardPointsBreakdownRow<
  T extends LeaderboardBasePointsRow = LeaderboardBasePointsRow,
> = Omit<
  T,
  "exact_hits" | "outcome_hits" | "predicted_matches_count" | "rank" | "total_points"
> & {
  exact_hits: number;
  match_points: number;
  mi_mundial_bonus_points: number;
  outcome_hits: number;
  predicted_matches_count: number;
  rank: number;
  total_points: number;
};

export type LeaderboardRankTrend = {
  direction: LeaderboardTrendDirection;
  value: number;
};

export type LeaderboardTrendWindowContribution = {
  exactHits: number;
  outcomeHits: number;
  points: number;
  predictedMatchesCount: number;
};

function toScoreNumber(value: bigint | number | null | undefined) {
  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return value;
}

function compareLeaderboardRows(
  left: LeaderboardPointsBreakdownRow,
  right: LeaderboardPointsBreakdownRow,
) {
  return (
    right.total_points - left.total_points ||
    right.exact_hits - left.exact_hits ||
    right.outcome_hits - left.outcome_hits ||
    right.predicted_matches_count - left.predicted_matches_count ||
    left.display_name.localeCompare(right.display_name, "es-AR", {
      sensitivity: "base",
    }) ||
    left.user_id.localeCompare(right.user_id)
  );
}

export function rankLeaderboardByTotalPoints<T extends LeaderboardPointsBreakdownRow>(
  rows: readonly T[],
) {
  const sortedRows = [...rows].sort(compareLeaderboardRows);
  let previousRank = 0;
  let previousTotalPoints: number | null = null;

  return sortedRows.map((row, index) => {
    const rank =
      previousTotalPoints === row.total_points ? previousRank : index + 1;

    previousRank = rank;
    previousTotalPoints = row.total_points;

    return {
      ...row,
      rank,
    };
  });
}

export function rankLeaderboardPlayersByTotalPoints(
  players: readonly LeaderboardPlayer[],
) {
  const playersById = new Map(players.map((player) => [player.id, player]));
  const rankedRows = rankLeaderboardByTotalPoints(
    players.map((player) => ({
      display_name: player.name,
      exact_hits: player.exactHits,
      match_points: player.matchPoints,
      mi_mundial_bonus_points: player.miMundialBonusPoints,
      outcome_hits: player.outcomeHits,
      predicted_matches_count: player.predictedMatchesCount,
      rank: player.rank,
      total_points: player.totalPoints,
      user_id: player.id,
    })),
  );

  return rankedRows.map((row) => ({
    ...playersById.get(row.user_id)!,
    rank: row.rank,
  }));
}

export function getLeaderboardRankTrends<
  T extends LeaderboardPointsBreakdownRow,
>(
  rows: readonly T[],
  trendWindowContributionsByUserId: ReadonlyMap<
    string,
    LeaderboardTrendWindowContribution
  >,
) {
  const currentRows = rankLeaderboardByTotalPoints(rows);
  const currentRankByUserId = new Map(
    currentRows.map((row) => [row.user_id, row.rank]),
  );

  if (trendWindowContributionsByUserId.size === 0) {
    return new Map<string, LeaderboardRankTrend>(
      currentRows.map((row) => [row.user_id, { direction: "same", value: 0 }]),
    );
  }

  const previousRows = rankLeaderboardByTotalPoints(
    rows.map((row) => {
      const contribution = trendWindowContributionsByUserId.get(row.user_id) ?? {
        exactHits: 0,
        outcomeHits: 0,
        points: 0,
        predictedMatchesCount: 0,
      };

      return {
        ...row,
        exact_hits: Math.max(
          0,
          row.exact_hits - contribution.exactHits,
        ),
        match_points: Math.max(0, row.match_points - contribution.points),
        outcome_hits: Math.max(
          0,
          row.outcome_hits - contribution.outcomeHits,
        ),
        predicted_matches_count: Math.max(
          0,
          row.predicted_matches_count - contribution.predictedMatchesCount,
        ),
        total_points: Math.max(0, row.total_points - contribution.points),
      };
    }),
  );
  const previousRankByUserId = new Map(
    previousRows.map((row) => [row.user_id, row.rank]),
  );

  return new Map<string, LeaderboardRankTrend>(
    currentRows.map((row) => {
      const currentRank = currentRankByUserId.get(row.user_id) ?? row.rank;
      const previousRank = previousRankByUserId.get(row.user_id) ?? currentRank;

      if (previousRank > currentRank) {
        return [
          row.user_id,
          { direction: "up", value: previousRank - currentRank },
        ];
      }

      if (previousRank < currentRank) {
        return [
          row.user_id,
          { direction: "down", value: currentRank - previousRank },
        ];
      }

      return [row.user_id, { direction: "same", value: 0 }];
    }),
  );
}

export function mergeMiMundialBonusPoints<T extends LeaderboardBasePointsRow>(
  rows: readonly T[],
  bonusRows: readonly MiMundialBonusPointsRow[],
) {
  const bonusPointsByUserId = new Map(
    bonusRows.map((row) => [row.user_id, toScoreNumber(row.bonus_points)]),
  );

  const rowsWithBreakdown = rows.map((row) => {
    const matchPoints = toScoreNumber(row.total_points);
    const miMundialBonusPoints = bonusPointsByUserId.get(row.user_id) ?? 0;

    return {
      ...row,
      exact_hits: toScoreNumber(row.exact_hits),
      match_points: matchPoints,
      mi_mundial_bonus_points: miMundialBonusPoints,
      outcome_hits: toScoreNumber(row.outcome_hits),
      predicted_matches_count: toScoreNumber(row.predicted_matches_count),
      rank: toScoreNumber(row.rank),
      total_points: matchPoints + miMundialBonusPoints,
    } satisfies LeaderboardPointsBreakdownRow<T>;
  });

  return rankLeaderboardByTotalPoints(rowsWithBreakdown);
}
