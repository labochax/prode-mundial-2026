export type DashboardPredictionValue = {
  away: number;
  home: number;
};

export type DashboardPredictionMap = Record<string, DashboardPredictionValue>;

export type BatchPredictionPayloadItem = {
  match_id: string;
  predicted_away_score: number;
  predicted_home_score: number;
};

export function isSamePrediction(
  left: DashboardPredictionValue | undefined,
  right: DashboardPredictionValue | undefined,
) {
  return Boolean(left && right && left.away === right.away && left.home === right.home);
}

export function getDirtyPredictionIds(
  currentPredictions: DashboardPredictionMap,
  savedPredictions: DashboardPredictionMap,
) {
  return Object.keys(currentPredictions)
    .filter(
      (matchId) =>
        !isSamePrediction(currentPredictions[matchId], savedPredictions[matchId]),
    )
    .sort((left, right) => left.localeCompare(right));
}

export function buildBatchPredictionPayload({
  currentPredictions,
  dirtyIds,
  editableMatchIds,
}: {
  currentPredictions: DashboardPredictionMap;
  dirtyIds: string[];
  editableMatchIds: ReadonlySet<string>;
}) {
  const editableDirtyIds = dirtyIds.filter((matchId) =>
    editableMatchIds.has(matchId),
  );

  return editableDirtyIds
    .map((matchId) => ({
      matchId,
      prediction: currentPredictions[matchId],
    }))
    .filter(
      (
        item,
      ): item is {
        matchId: string;
        prediction: DashboardPredictionValue;
      } => Boolean(item.prediction),
    )
    .map(({ matchId, prediction }) => {
      return {
        match_id: matchId,
        predicted_away_score: prediction.away,
        predicted_home_score: prediction.home,
      };
    });
}

export function mergeBatchSaveResult({
  currentPredictions,
  dirtyIds,
  failedMatchIds,
  savedPredictions,
}: {
  currentPredictions: DashboardPredictionMap;
  dirtyIds: string[];
  failedMatchIds: string[];
  savedPredictions: DashboardPredictionMap;
}) {
  const failedSet = new Set(failedMatchIds);
  const nextSavedPredictions = {
    ...savedPredictions,
  };
  const nextDirtyIds: string[] = [];

  for (const matchId of dirtyIds) {
    if (failedSet.has(matchId)) {
      nextDirtyIds.push(matchId);
      continue;
    }

    const currentPrediction = currentPredictions[matchId];

    if (currentPrediction) {
      nextSavedPredictions[matchId] = currentPrediction;
    }
  }

  return {
    dirtyIds: nextDirtyIds,
    savedPredictions: nextSavedPredictions,
  };
}
