import type { ActualTournamentOutcomeResult } from "@/lib/tournament/actual-outcomes";
import {
  MAX_MI_MUNDIAL_BONUS_POINTS,
  MI_MUNDIAL_BONUS_POINTS,
  scoreTournamentPredictionBonus,
  type PlacementBonusBreakdown,
  type TournamentBonusPrediction,
} from "@/lib/tournament/bonus-scoring";

export type TeamBonusItem = {
  hit: boolean;
  points: number;
  teamId: string;
};

export type StageBonusDetails = {
  items: TeamBonusItem[];
  points: number;
  pointsPerHit: number;
};

export type TournamentBonusBreakdownResult =
  | {
      message: "Bonus pendiente: faltan resultados oficiales de eliminación.";
      reason: string;
      status: "pending";
    }
  | {
      maxPossiblePoints: number;
      placements: {
        champion: PlacementBonusBreakdown;
        fourthPlace: PlacementBonusBreakdown;
        runnerUp: PlacementBonusBreakdown;
        thirdPlace: PlacementBonusBreakdown;
      };
      stages: {
        cuartos: StageBonusDetails;
        octavos: StageBonusDetails;
        semifinales: StageBonusDetails;
      };
      status: "complete";
      totalPoints: number;
    };

export type BonusSummarySegment = {
  displayValue: string;
  earnedPoints: number | null;
  label: string;
  maxPoints: number;
};

export type BonusSummarySegmentsResult = {
  segments: BonusSummarySegment[];
  status: "complete" | "pending";
  total: {
    earnedPoints: number;
    label: "Bonus Mi Mundial";
    maxPoints: number;
  } | null;
};

const PENDING_BONUS_SEGMENTS: BonusSummarySegment[] = [
  {
    displayValue: "+1 por equipo / 16 pts",
    earnedPoints: null,
    label: "Equipos en octavos",
    maxPoints: 16,
  },
  {
    displayValue: "+1 por equipo / 8 pts",
    earnedPoints: null,
    label: "Equipos en cuartos",
    maxPoints: 8,
  },
  {
    displayValue: "+2 por equipo / 8 pts",
    earnedPoints: null,
    label: "Equipos en semifinales",
    maxPoints: 8,
  },
  {
    displayValue: "+10 / 10 pts",
    earnedPoints: null,
    label: "Campeón exacto",
    maxPoints: 10,
  },
  {
    displayValue: "+5 / 5 pts",
    earnedPoints: null,
    label: "Subcampeón exacto",
    maxPoints: 5,
  },
  {
    displayValue: "+3 / 3 pts",
    earnedPoints: null,
    label: "Tercer puesto exacto",
    maxPoints: 3,
  },
  {
    displayValue: "+2 / 2 pts",
    earnedPoints: null,
    label: "Cuarto puesto exacto",
    maxPoints: 2,
  },
];

export function getStageBonusBadgeLabel(pointsPerHit: number) {
  return `BONUS +${pointsPerHit}`;
}

export function getStageTeamBonusStatusLabel(hit: boolean) {
  return hit ? "Acertado" : "No acertado";
}

function uniqueTeamIds(teamIds: readonly string[]) {
  return [...new Set(teamIds.filter((teamId) => teamId.trim().length > 0))];
}

function buildStageDetails(
  predictedTeamIds: readonly string[],
  actualTeamIds: readonly string[] | null | undefined,
  pointsPerHit: number,
): StageBonusDetails {
  const actual = new Set(actualTeamIds ?? []);
  const items = uniqueTeamIds(predictedTeamIds).map((teamId) => {
    const hit = actual.has(teamId);

    return {
      hit,
      points: hit ? pointsPerHit : 0,
      teamId,
    };
  });

  return {
    items,
    points: items.reduce((total, item) => total + item.points, 0),
    pointsPerHit,
  };
}

export function buildTournamentBonusBreakdown(
  prediction: TournamentBonusPrediction,
  actualResult: ActualTournamentOutcomeResult,
): TournamentBonusBreakdownResult {
  if (actualResult.status === "incomplete") {
    return {
      message: "Bonus pendiente: faltan resultados oficiales de eliminación.",
      reason: actualResult.reason,
      status: "pending",
    };
  }

  const scoring = scoreTournamentPredictionBonus(
    prediction,
    actualResult.outcome,
  );

  return {
    maxPossiblePoints: scoring.maxPossiblePoints,
    placements: {
      champion: scoring.breakdown.champion,
      fourthPlace: scoring.breakdown.fourthPlace,
      runnerUp: scoring.breakdown.runnerUp,
      thirdPlace: scoring.breakdown.thirdPlace,
    },
    stages: {
      cuartos: buildStageDetails(
        prediction.quarterfinalTeamIds,
        actualResult.outcome.actualQuarterfinalTeamIds,
        MI_MUNDIAL_BONUS_POINTS.cuartos,
      ),
      octavos: buildStageDetails(
        prediction.roundOf16TeamIds,
        actualResult.outcome.actualRoundOf16TeamIds,
        MI_MUNDIAL_BONUS_POINTS.octavos,
      ),
      semifinales: buildStageDetails(
        prediction.semifinalTeamIds,
        actualResult.outcome.actualSemifinalTeamIds,
        MI_MUNDIAL_BONUS_POINTS.semifinales,
      ),
    },
    status: "complete",
    totalPoints: scoring.totalPoints,
  };
}

function completeSegment(
  label: string,
  earnedPoints: number,
  maxPoints: number,
): BonusSummarySegment {
  return {
    displayValue: `${earnedPoints} / ${maxPoints} pts`,
    earnedPoints,
    label,
    maxPoints,
  };
}

export function getBonusSummarySegments(
  bonusBreakdown: TournamentBonusBreakdownResult | null,
): BonusSummarySegmentsResult {
  if (bonusBreakdown?.status !== "complete") {
    return {
      segments: PENDING_BONUS_SEGMENTS,
      status: "pending",
      total: null,
    };
  }

  return {
    segments: [
      completeSegment("Equipos en octavos", bonusBreakdown.stages.octavos.points, 16),
      completeSegment("Equipos en cuartos", bonusBreakdown.stages.cuartos.points, 8),
      completeSegment(
        "Equipos en semifinales",
        bonusBreakdown.stages.semifinales.points,
        8,
      ),
      completeSegment("Campeón exacto", bonusBreakdown.placements.champion.points, 10),
      completeSegment("Subcampeón exacto", bonusBreakdown.placements.runnerUp.points, 5),
      completeSegment("Tercer puesto exacto", bonusBreakdown.placements.thirdPlace.points, 3),
      completeSegment("Cuarto puesto exacto", bonusBreakdown.placements.fourthPlace.points, 2),
    ],
    status: "complete",
    total: {
      earnedPoints: bonusBreakdown.totalPoints,
      label: "Bonus Mi Mundial",
      maxPoints: MAX_MI_MUNDIAL_BONUS_POINTS,
    },
  };
}
