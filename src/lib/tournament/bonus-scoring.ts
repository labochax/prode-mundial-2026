export const MI_MUNDIAL_BONUS_POINTS = {
  champion: 10,
  cuartos: 1,
  fourthPlace: 2,
  octavos: 1,
  runnerUp: 5,
  semifinales: 2,
  thirdPlace: 3,
} as const;

export const MAX_MI_MUNDIAL_BONUS_POINTS =
  16 * MI_MUNDIAL_BONUS_POINTS.octavos +
  8 * MI_MUNDIAL_BONUS_POINTS.cuartos +
  4 * MI_MUNDIAL_BONUS_POINTS.semifinales +
  MI_MUNDIAL_BONUS_POINTS.champion +
  MI_MUNDIAL_BONUS_POINTS.runnerUp +
  MI_MUNDIAL_BONUS_POINTS.thirdPlace +
  MI_MUNDIAL_BONUS_POINTS.fourthPlace;

export type TournamentBonusPrediction = {
  championTeamId: string | null;
  fourthPlaceTeamId: string | null;
  quarterfinalTeamIds: readonly string[];
  roundOf16TeamIds: readonly string[];
  runnerUpTeamId: string | null;
  semifinalTeamIds: readonly string[];
  thirdPlaceTeamId: string | null;
};

export type TournamentBonusActualOutcome = {
  actualChampionTeamId?: string | null;
  actualFourthPlaceTeamId?: string | null;
  actualQuarterfinalTeamIds?: readonly string[] | null;
  actualRoundOf16TeamIds?: readonly string[] | null;
  actualRunnerUpTeamId?: string | null;
  actualSemifinalTeamIds?: readonly string[] | null;
  actualThirdPlaceTeamId?: string | null;
};

export type StageBonusBreakdown = {
  hits: number;
  points: number;
  pointsPerHit: number;
};

export type PlacementBonusBreakdown = {
  hit: boolean;
  points: number;
  possiblePoints: number;
};

export type TournamentBonusScoringResult = {
  breakdown: {
    champion: PlacementBonusBreakdown;
    cuartos: StageBonusBreakdown;
    fourthPlace: PlacementBonusBreakdown;
    octavos: StageBonusBreakdown;
    runnerUp: PlacementBonusBreakdown;
    semifinales: StageBonusBreakdown;
    thirdPlace: PlacementBonusBreakdown;
  };
  isComplete: boolean;
  maxPossiblePoints: number;
  totalPoints: number;
};

function uniqueTeamIds(teamIds: readonly string[] | null | undefined) {
  return new Set(
    (teamIds ?? []).filter(
      (teamId): teamId is string =>
        typeof teamId === "string" && teamId.trim().length > 0,
    ),
  );
}

function scoreStage(
  predictedTeamIds: readonly string[],
  actualTeamIds: readonly string[] | null | undefined,
  pointsPerHit: number,
): StageBonusBreakdown {
  const predicted = uniqueTeamIds(predictedTeamIds);
  const actual = uniqueTeamIds(actualTeamIds);
  let hits = 0;

  for (const teamId of predicted) {
    if (actual.has(teamId)) {
      hits += 1;
    }
  }

  return {
    hits,
    points: hits * pointsPerHit,
    pointsPerHit,
  };
}

function scorePlacement(
  predictedTeamId: string | null,
  actualTeamId: string | null | undefined,
  possiblePoints: number,
): PlacementBonusBreakdown {
  const hit =
    typeof predictedTeamId === "string" &&
    predictedTeamId.length > 0 &&
    predictedTeamId === actualTeamId;

  return {
    hit,
    points: hit ? possiblePoints : 0,
    possiblePoints,
  };
}

function hasCompleteActualOutcome(actual: TournamentBonusActualOutcome) {
  return Boolean(
    actual.actualRoundOf16TeamIds?.length &&
      actual.actualQuarterfinalTeamIds?.length &&
      actual.actualSemifinalTeamIds?.length &&
      actual.actualChampionTeamId &&
      actual.actualRunnerUpTeamId &&
      actual.actualThirdPlaceTeamId &&
      actual.actualFourthPlaceTeamId,
  );
}

export function scoreTournamentPredictionBonus(
  prediction: TournamentBonusPrediction,
  actual: TournamentBonusActualOutcome,
): TournamentBonusScoringResult {
  const octavos = scoreStage(
    prediction.roundOf16TeamIds,
    actual.actualRoundOf16TeamIds,
    MI_MUNDIAL_BONUS_POINTS.octavos,
  );
  const cuartos = scoreStage(
    prediction.quarterfinalTeamIds,
    actual.actualQuarterfinalTeamIds,
    MI_MUNDIAL_BONUS_POINTS.cuartos,
  );
  const semifinales = scoreStage(
    prediction.semifinalTeamIds,
    actual.actualSemifinalTeamIds,
    MI_MUNDIAL_BONUS_POINTS.semifinales,
  );
  const champion = scorePlacement(
    prediction.championTeamId,
    actual.actualChampionTeamId,
    MI_MUNDIAL_BONUS_POINTS.champion,
  );
  const runnerUp = scorePlacement(
    prediction.runnerUpTeamId,
    actual.actualRunnerUpTeamId,
    MI_MUNDIAL_BONUS_POINTS.runnerUp,
  );
  const thirdPlace = scorePlacement(
    prediction.thirdPlaceTeamId,
    actual.actualThirdPlaceTeamId,
    MI_MUNDIAL_BONUS_POINTS.thirdPlace,
  );
  const fourthPlace = scorePlacement(
    prediction.fourthPlaceTeamId,
    actual.actualFourthPlaceTeamId,
    MI_MUNDIAL_BONUS_POINTS.fourthPlace,
  );
  const totalPoints =
    octavos.points +
    cuartos.points +
    semifinales.points +
    champion.points +
    runnerUp.points +
    thirdPlace.points +
    fourthPlace.points;

  return {
    breakdown: {
      champion,
      cuartos,
      fourthPlace,
      octavos,
      runnerUp,
      semifinales,
      thirdPlace,
    },
    isComplete: hasCompleteActualOutcome(actual),
    maxPossiblePoints: MAX_MI_MUNDIAL_BONUS_POINTS,
    totalPoints,
  };
}
