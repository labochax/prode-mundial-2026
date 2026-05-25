import type {
  TournamentGroupMatch,
  TournamentGroupSimulation,
  TournamentStandingRow,
  TournamentTeam,
} from "@/lib/tournament/types";

type MutableStandingRow = Omit<TournamentStandingRow, "rank">;

function normalizeGroupCode(groupCode: string) {
  return groupCode
    .trim()
    .toUpperCase()
    .replace(/^GROUP_/, "")
    .replace(/^GRUPO_/, "")
    .replace(/^GR_/, "");
}

export function getTournamentGroupLabel(groupCode: string) {
  const normalized = normalizeGroupCode(groupCode);

  return normalized ? `Grupo ${normalized}` : "Grupo";
}

function createStandingRow(team: TournamentTeam): MutableStandingRow {
  return {
    draws: 0,
    goalDifference: 0,
    goalsAgainst: 0,
    goalsFor: 0,
    losses: 0,
    played: 0,
    points: 0,
    team,
    wins: 0,
  };
}

function compareStandingRows(
  left: Pick<
    TournamentStandingRow,
    "goalDifference" | "goalsFor" | "points" | "team"
  >,
  right: Pick<
    TournamentStandingRow,
    "goalDifference" | "goalsFor" | "points" | "team"
  >,
) {
  if (left.points !== right.points) {
    return right.points - left.points;
  }

  if (left.goalDifference !== right.goalDifference) {
    return right.goalDifference - left.goalDifference;
  }

  if (left.goalsFor !== right.goalsFor) {
    return right.goalsFor - left.goalsFor;
  }

  return (
    left.team.name.localeCompare(right.team.name, "es-AR") ||
    left.team.id.localeCompare(right.team.id)
  );
}

export function rankTournamentStandingRows<T extends TournamentStandingRow>(
  rows: T[],
) {
  return [...rows].sort(compareStandingRows).map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}

function applyPredictionToRow(
  row: MutableStandingRow,
  goalsFor: number,
  goalsAgainst: number,
) {
  row.played += 1;
  row.goalsFor += goalsFor;
  row.goalsAgainst += goalsAgainst;
  row.goalDifference = row.goalsFor - row.goalsAgainst;

  if (goalsFor > goalsAgainst) {
    row.wins += 1;
    row.points += 3;
    return;
  }

  if (goalsFor === goalsAgainst) {
    row.draws += 1;
    row.points += 1;
    return;
  }

  row.losses += 1;
}

function getOrCreateRow(
  rowsByTeamId: Map<string, MutableStandingRow>,
  team: TournamentTeam,
) {
  const current = rowsByTeamId.get(team.id);

  if (current) {
    return current;
  }

  const next = createStandingRow(team);
  rowsByTeamId.set(team.id, next);

  return next;
}

export function simulateGroupTables(
  matches: TournamentGroupMatch[],
): TournamentGroupSimulation[] {
  const matchesByGroup = new Map<string, TournamentGroupMatch[]>();

  for (const match of matches) {
    const groupCode = normalizeGroupCode(match.groupCode);
    const current = matchesByGroup.get(groupCode);

    if (current) {
      current.push(match);
      continue;
    }

    matchesByGroup.set(groupCode, [match]);
  }

  return [...matchesByGroup.entries()]
    .sort(([left], [right]) => left.localeCompare(right, "es-AR"))
    .map(([groupCode, groupMatches]) => {
      const rowsByTeamId = new Map<string, MutableStandingRow>();
      let predictionsCompleted = 0;

      for (const match of groupMatches) {
        const homeRow = getOrCreateRow(rowsByTeamId, match.homeTeam);
        const awayRow = getOrCreateRow(rowsByTeamId, match.awayTeam);

        if (!match.prediction) {
          continue;
        }

        predictionsCompleted += 1;
        applyPredictionToRow(
          homeRow,
          match.prediction.homeScore,
          match.prediction.awayScore,
        );
        applyPredictionToRow(
          awayRow,
          match.prediction.awayScore,
          match.prediction.homeScore,
        );
      }

      return {
        groupCode,
        groupLabel: getTournamentGroupLabel(groupCode),
        isComplete: predictionsCompleted === groupMatches.length,
        predictionsCompleted,
        predictionsTotal: groupMatches.length,
        rows: rankTournamentStandingRows(
          [...rowsByTeamId.values()].map((row) => ({
            ...row,
            rank: 0,
          })),
        ),
      };
    });
}
