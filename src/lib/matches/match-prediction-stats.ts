export type MatchPredictionStatsRow = {
  predicted_away_score: number;
  predicted_home_score: number;
};

export type MatchPredictionStatsBatchRow = MatchPredictionStatsRow & {
  match_id: string;
};

export type MatchPredictionStats = {
  counts: {
    away: number;
    draw: number;
    home: number;
  };
  distribution: {
    away: number;
    draw: number;
    home: number;
  } | null;
  status: "available" | "hidden-until-lock" | "insufficient";
  topScorelines: Array<{
    away: number;
    count: number;
    home: number;
  }>;
  totalPredictions: number | null;
};

const outcomeKeys = ["home", "draw", "away"] as const;
const visibleMatchStatuses = new Set([
  "AWARDED",
  "EXTRA_TIME",
  "FINISHED",
  "IN_PLAY",
  "LIVE",
  "PAUSED",
  "PENALTY_SHOOTOUT",
  "SUSPENDED",
]);

export function isMatchPredictionStatsVisible({
  lockAt,
  now = Date.now(),
  status,
}: {
  lockAt: string;
  now?: number;
  status?: string | null;
}) {
  return (
    new Date(lockAt).getTime() <= now ||
    visibleMatchStatuses.has((status ?? "").trim().toUpperCase())
  );
}

function getRoundedDistribution(
  counts: MatchPredictionStats["counts"],
  total: number,
) {
  const rows = outcomeKeys.map((key, index) => {
    const exact = (counts[key] / total) * 100;

    return {
      floor: Math.floor(exact),
      fraction: exact - Math.floor(exact),
      index,
      key,
    };
  });
  let remainder = 100 - rows.reduce((sum, row) => sum + row.floor, 0);

  for (const row of [...rows].sort(
    (left, right) =>
      right.fraction - left.fraction || left.index - right.index,
  )) {
    if (remainder <= 0) {
      break;
    }

    row.floor += 1;
    remainder -= 1;
  }

  return Object.fromEntries(
    rows.map((row) => [row.key, row.floor]),
  ) as NonNullable<MatchPredictionStats["distribution"]>;
}

function getTopScorelines(rows: MatchPredictionStatsRow[]) {
  const scorelines = new Map<
    string,
    MatchPredictionStats["topScorelines"][number]
  >();

  for (const row of rows) {
    const key = `${row.predicted_home_score}:${row.predicted_away_score}`;
    const current = scorelines.get(key);

    scorelines.set(key, {
      away: row.predicted_away_score,
      count: (current?.count ?? 0) + 1,
      home: row.predicted_home_score,
    });
  }

  return [...scorelines.values()]
    .sort(
      (left, right) =>
        right.count - left.count ||
        right.home - left.home ||
        left.away - right.away,
    )
    .slice(0, 3);
}

export function buildMatchPredictionStats(
  rows: MatchPredictionStatsRow[],
  {
    isVisible,
    minimumPredictions = 3,
  }: {
    isVisible: boolean;
    minimumPredictions?: number;
  },
): MatchPredictionStats {
  if (!isVisible) {
    return {
      counts: { away: 0, draw: 0, home: 0 },
      distribution: null,
      status: "hidden-until-lock",
      topScorelines: [],
      totalPredictions: null,
    };
  }

  const counts = rows.reduce(
    (current, row) => {
      if (row.predicted_home_score > row.predicted_away_score) {
        current.home += 1;
      } else if (row.predicted_home_score < row.predicted_away_score) {
        current.away += 1;
      } else {
        current.draw += 1;
      }

      return current;
    },
    { away: 0, draw: 0, home: 0 },
  );
  const totalPredictions = rows.length;

  if (totalPredictions < minimumPredictions) {
    return {
      counts,
      distribution: null,
      status: "insufficient",
      topScorelines: [],
      totalPredictions,
    };
  }

  return {
    counts,
    distribution: getRoundedDistribution(counts, totalPredictions),
    status: "available",
    topScorelines: getTopScorelines(rows),
    totalPredictions,
  };
}

export function buildMatchPredictionStatsByMatchIds(
  rows: MatchPredictionStatsBatchRow[],
  matches: Array<{
    isVisible: boolean;
    matchId: string;
  }>,
) {
  const rowsByMatchId = new Map<string, MatchPredictionStatsRow[]>();

  for (const row of rows) {
    const matchRows = rowsByMatchId.get(row.match_id) ?? [];

    matchRows.push({
      predicted_away_score: row.predicted_away_score,
      predicted_home_score: row.predicted_home_score,
    });
    rowsByMatchId.set(row.match_id, matchRows);
  }

  return new Map(
    matches.map(({ isVisible, matchId }) => [
      matchId,
      buildMatchPredictionStats(rowsByMatchId.get(matchId) ?? [], {
        isVisible,
      }),
    ]),
  );
}
