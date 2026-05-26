import { describe, expect, it } from "vitest";

import {
  MAX_MI_MUNDIAL_BONUS_POINTS,
  scoreTournamentPredictionBonus,
  type TournamentBonusActualOutcome,
  type TournamentBonusPrediction,
} from "@/lib/tournament/bonus-scoring";

const teamIds = Array.from({ length: 32 }, (_, index) => `team-${index + 1}`);

function prediction(): TournamentBonusPrediction {
  return {
    championTeamId: "team-1",
    fourthPlaceTeamId: "team-4",
    quarterfinalTeamIds: teamIds.slice(0, 8),
    roundOf16TeamIds: teamIds.slice(0, 16),
    runnerUpTeamId: "team-2",
    semifinalTeamIds: teamIds.slice(0, 4),
    thirdPlaceTeamId: "team-3",
  };
}

function actual(): TournamentBonusActualOutcome {
  return {
    actualChampionTeamId: "team-1",
    actualFourthPlaceTeamId: "team-4",
    actualQuarterfinalTeamIds: teamIds.slice(0, 8),
    actualRoundOf16TeamIds: teamIds.slice(0, 16),
    actualRunnerUpTeamId: "team-2",
    actualSemifinalTeamIds: teamIds.slice(0, 4),
    actualThirdPlaceTeamId: "team-3",
  };
}

describe("scoreTournamentPredictionBonus", () => {
  it("scores a perfect full bracket at the maximum bonus", () => {
    const result = scoreTournamentPredictionBonus(prediction(), actual());

    expect(result.totalPoints).toBe(52);
    expect(result.maxPossiblePoints).toBe(52);
    expect(result.breakdown.octavos).toMatchObject({ hits: 16, points: 16 });
    expect(result.breakdown.cuartos).toMatchObject({ hits: 8, points: 8 });
    expect(result.breakdown.semifinales).toMatchObject({ hits: 4, points: 8 });
    expect(result.breakdown.champion).toMatchObject({ hit: true, points: 10 });
    expect(result.breakdown.runnerUp).toMatchObject({ hit: true, points: 5 });
    expect(result.breakdown.thirdPlace).toMatchObject({ hit: true, points: 3 });
    expect(result.breakdown.fourthPlace).toMatchObject({ hit: true, points: 2 });
  });

  it("scores partial stage and placement hits", () => {
    const result = scoreTournamentPredictionBonus(prediction(), {
      actualChampionTeamId: "team-1",
      actualFourthPlaceTeamId: "other-4",
      actualQuarterfinalTeamIds: ["team-1", "team-2", "team-9", "team-10"],
      actualRoundOf16TeamIds: ["team-1", "team-2", "team-3", "team-17"],
      actualRunnerUpTeamId: "other-2",
      actualSemifinalTeamIds: ["team-1", "team-5"],
      actualThirdPlaceTeamId: "team-3",
    });

    expect(result.totalPoints).toBe(20);
    expect(result.breakdown.octavos).toMatchObject({ hits: 3, points: 3 });
    expect(result.breakdown.cuartos).toMatchObject({ hits: 2, points: 2 });
    expect(result.breakdown.semifinales).toMatchObject({ hits: 1, points: 2 });
    expect(result.breakdown.champion.points).toBe(10);
    expect(result.breakdown.runnerUp.points).toBe(0);
    expect(result.breakdown.thirdPlace.points).toBe(3);
    expect(result.breakdown.fourthPlace.points).toBe(0);
  });

  it("returns zero when there are no hits", () => {
    const result = scoreTournamentPredictionBonus(prediction(), {
      actualChampionTeamId: "other-1",
      actualFourthPlaceTeamId: "other-4",
      actualQuarterfinalTeamIds: ["other-q"],
      actualRoundOf16TeamIds: ["other-r16"],
      actualRunnerUpTeamId: "other-2",
      actualSemifinalTeamIds: ["other-sf"],
      actualThirdPlaceTeamId: "other-3",
    });

    expect(result.totalPoints).toBe(0);
    expect(result.breakdown.octavos.hits).toBe(0);
    expect(result.breakdown.cuartos.hits).toBe(0);
    expect(result.breakdown.semifinales.hits).toBe(0);
  });

  it("does not double-count duplicate team ids", () => {
    const result = scoreTournamentPredictionBonus(
      {
        ...prediction(),
        quarterfinalTeamIds: ["team-1", "team-1", "team-2"],
        roundOf16TeamIds: ["team-1", "team-1", "team-2", "team-2"],
        semifinalTeamIds: ["team-1", "team-1"],
      },
      {
        ...actual(),
        actualQuarterfinalTeamIds: ["team-1", "team-2", "team-2"],
        actualRoundOf16TeamIds: ["team-1", "team-2", "team-2"],
        actualSemifinalTeamIds: ["team-1", "team-1"],
      },
    );

    expect(result.breakdown.octavos).toMatchObject({ hits: 2, points: 2 });
    expect(result.breakdown.cuartos).toMatchObject({ hits: 2, points: 2 });
    expect(result.breakdown.semifinales).toMatchObject({ hits: 1, points: 2 });
  });

  it("handles incomplete actual outcomes safely", () => {
    const result = scoreTournamentPredictionBonus(prediction(), {});

    expect(result.totalPoints).toBe(0);
    expect(result.isComplete).toBe(false);
    expect(result.breakdown.champion.hit).toBe(false);
  });

  it("exports the current maximum possible bonus", () => {
    expect(MAX_MI_MUNDIAL_BONUS_POINTS).toBe(52);
  });
});
