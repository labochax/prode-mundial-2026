type ScorePair = {
  away: number;
  home: number;
};

type ProvisionalPointsInput = {
  actual: ScorePair | null;
  prediction: ScorePair | null;
  status: string;
};

const finalStatus = "FINISHED";

function outcome(score: ScorePair) {
  if (score.home > score.away) {
    return "HOME_TEAM";
  }

  if (score.away > score.home) {
    return "AWAY_TEAM";
  }

  return "DRAW";
}

export function calculateProvisionalPredictionPoints({
  actual,
  prediction,
  status,
}: ProvisionalPointsInput) {
  if (!actual || !prediction) {
    return {
      points: null,
      provisional: status !== finalStatus,
    };
  }

  const points =
    prediction.home === actual.home && prediction.away === actual.away
      ? 3
      : outcome(prediction) === outcome(actual)
        ? 1
        : 0;

  return {
    points,
    provisional: status !== finalStatus,
  };
}
