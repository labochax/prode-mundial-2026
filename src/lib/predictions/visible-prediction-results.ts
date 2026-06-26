import { getMatchEditability } from "@/lib/matches/match-editability";

export type PredictionResultMarker = "empty" | "exact" | "miss" | "outcome";

export type VisiblePredictionMatch = {
  away_team_id: string | null;
  home_team_id: string | null;
  id: string;
  kickoff_at: string | null;
  lock_at: string | null;
  match_number: number | null;
  status: string | null;
};

export type PredictionResultRow = {
  matches: VisiblePredictionMatch | null;
  points: number | null;
};

export function getPredictionResultMarker(
  points: number | null,
): PredictionResultMarker {
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

export function isVisiblePlayerPredictionMatch(
  match: Pick<
    VisiblePredictionMatch,
    "away_team_id" | "home_team_id" | "lock_at" | "status"
  >,
  now = new Date(),
) {
  const editability = getMatchEditability(match, now);

  return !editability.canEdit && editability.reason !== "missing_teams";
}

export function isFinishedScoredVisiblePrediction(
  row: PredictionResultRow,
  now = new Date(),
) {
  if (!row.matches) {
    return false;
  }

  return (
    row.matches.status?.trim().toUpperCase() === "FINISHED" &&
    getPredictionResultMarker(row.points) !== "empty" &&
    isVisiblePlayerPredictionMatch(row.matches, now)
  );
}

function toKickoffTime(value: string | null) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function comparePredictionMatchesChronologically(
  left: Pick<VisiblePredictionMatch, "id" | "kickoff_at" | "match_number">,
  right: Pick<VisiblePredictionMatch, "id" | "kickoff_at" | "match_number">,
) {
  const leftKickoff = toKickoffTime(left.kickoff_at);
  const rightKickoff = toKickoffTime(right.kickoff_at);

  if (leftKickoff === null && rightKickoff !== null) {
    return 1;
  }

  if (leftKickoff !== null && rightKickoff === null) {
    return -1;
  }

  if (leftKickoff !== null && rightKickoff !== null && leftKickoff !== rightKickoff) {
    return leftKickoff - rightKickoff;
  }

  const matchNumberDiff =
    (left.match_number ?? Number.MAX_SAFE_INTEGER) -
    (right.match_number ?? Number.MAX_SAFE_INTEGER);

  if (matchNumberDiff !== 0) {
    return matchNumberDiff;
  }

  return left.id.localeCompare(right.id);
}

export function comparePredictionMatchesByMostRecent(
  left: Pick<VisiblePredictionMatch, "id" | "kickoff_at" | "match_number">,
  right: Pick<VisiblePredictionMatch, "id" | "kickoff_at" | "match_number">,
) {
  const leftKickoff = toKickoffTime(left.kickoff_at);
  const rightKickoff = toKickoffTime(right.kickoff_at);

  if (leftKickoff === null && rightKickoff !== null) {
    return 1;
  }

  if (leftKickoff !== null && rightKickoff === null) {
    return -1;
  }

  if (leftKickoff !== null && rightKickoff !== null && leftKickoff !== rightKickoff) {
    return rightKickoff - leftKickoff;
  }

  const matchNumberDiff =
    (right.match_number ?? Number.MIN_SAFE_INTEGER) -
    (left.match_number ?? Number.MIN_SAFE_INTEGER);

  if (matchNumberDiff !== 0) {
    return matchNumberDiff;
  }

  return right.id.localeCompare(left.id);
}
