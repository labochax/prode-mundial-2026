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
