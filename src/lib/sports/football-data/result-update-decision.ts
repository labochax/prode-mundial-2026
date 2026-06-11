import type {
  FootballDataMatchCandidate,
  FootballDataMatchStatus,
} from "@/lib/sports/football-data/types";

type ExistingFootballDataResult = {
  away_score: number | null;
  home_score: number | null;
  status: string;
};

type IncomingFootballDataResult = Pick<
  FootballDataMatchCandidate,
  "away_score" | "home_score" | "status"
>;

export type FootballDataResultUpdateDecision = {
  reason:
    | "apply"
    | "protected-finished-stale"
    | "protected-live-stale"
    | "protected-scored-stale";
  shouldApplyUpdate: boolean;
  shouldScorePredictions: boolean;
  staleResultsSkipped: 0 | 1;
};

export type FootballDataResultUpdateOperationResult = {
  finishedMatchesScored: 0 | 1;
  matchesUpdated: 0 | 1;
  scoredPredictions: number;
  staleResultsSkipped: 0 | 1;
};

type FootballDataResultUpdateOperations = {
  applyUpdate: () => Promise<void>;
  scorePredictions: () => Promise<number>;
};

const liveStatuses = new Set<FootballDataMatchStatus>([
  "EXTRA_TIME",
  "IN_PLAY",
  "PAUSED",
  "PENALTY_SHOOTOUT",
]);

const scheduledStatuses = new Set<FootballDataMatchStatus>([
  "SCHEDULED",
  "TIMED",
]);

function hasCompleteScore(result: {
  away_score: number | null;
  home_score: number | null;
}) {
  return (
    typeof result.home_score === "number" &&
    typeof result.away_score === "number"
  );
}

function isCompleteFinishedResult(result: IncomingFootballDataResult) {
  return result.status === "FINISHED" && hasCompleteScore(result);
}

function isStaleScheduledResult(result: IncomingFootballDataResult) {
  return scheduledStatuses.has(result.status) && !hasCompleteScore(result);
}

export function getFootballDataResultUpdateDecision(
  existing: ExistingFootballDataResult,
  candidate: IncomingFootballDataResult,
): FootballDataResultUpdateDecision {
  const shouldScorePredictions = isCompleteFinishedResult(candidate);
  const hasProtectedFinishedStatus = existing.status === "FINISHED";
  const hasProtectedLocalScore = hasCompleteScore(existing);

  if (hasProtectedFinishedStatus && !shouldScorePredictions) {
    return {
      reason: "protected-finished-stale",
      shouldApplyUpdate: false,
      shouldScorePredictions: false,
      staleResultsSkipped: 1,
    };
  }

  if (
    liveStatuses.has(existing.status as FootballDataMatchStatus) &&
    isStaleScheduledResult(candidate)
  ) {
    return {
      reason: "protected-live-stale",
      shouldApplyUpdate: false,
      shouldScorePredictions: false,
      staleResultsSkipped: 1,
    };
  }

  if (hasProtectedLocalScore && !shouldScorePredictions) {
    return {
      reason: "protected-scored-stale",
      shouldApplyUpdate: false,
      shouldScorePredictions: false,
      staleResultsSkipped: 1,
    };
  }

  return {
    reason: "apply",
    shouldApplyUpdate: true,
    shouldScorePredictions,
    staleResultsSkipped: 0,
  };
}

export async function applyFootballDataResultUpdateDecision(
  decision: FootballDataResultUpdateDecision,
  operations: FootballDataResultUpdateOperations,
): Promise<FootballDataResultUpdateOperationResult> {
  if (!decision.shouldApplyUpdate) {
    return {
      finishedMatchesScored: 0,
      matchesUpdated: 0,
      scoredPredictions: 0,
      staleResultsSkipped: decision.staleResultsSkipped,
    };
  }

  await operations.applyUpdate();

  if (!decision.shouldScorePredictions) {
    return {
      finishedMatchesScored: 0,
      matchesUpdated: 1,
      scoredPredictions: 0,
      staleResultsSkipped: 0,
    };
  }

  const scoredPredictions = await operations.scorePredictions();

  return {
    finishedMatchesScored: 1,
    matchesUpdated: 1,
    scoredPredictions,
    staleResultsSkipped: 0,
  };
}
