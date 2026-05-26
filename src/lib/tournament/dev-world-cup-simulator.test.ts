import { describe, expect, it } from "vitest";

import {
  buildDevWorldCupKnockoutDatabaseUpdates,
  buildDevWorldCupMatchUpdatesFromSavedBracket,
  buildDevWorldCupResetMatchUpdates,
  getDevWorldCupResetSuccessMessage,
  getTournamentPredictionBonusResetPatch,
} from "@/lib/tournament/dev-world-cup-simulator";
import { deriveActualTournamentOutcome } from "@/lib/tournament/actual-outcomes";
import { scoreTournamentPredictionBonus } from "@/lib/tournament/bonus-scoring";
import type { SavedTournamentBracketJson } from "@/lib/tournament/tournament-prediction-payload";

function slot(teamId: string) {
  return {
    groupCode: null,
    originLabel: "Origen",
    qualificationType: "Clasificado",
    slotLabel: "Slot",
    sourceRank: null,
    team: {
      code: teamId.toUpperCase(),
      id: teamId,
      name: teamId,
    },
  };
}

function savedMatch(matchNumber: number, selectedSide: "away" | "home" = "home") {
  const homeTeamId = `team-${matchNumber}-home`;
  const awayTeamId = `team-${matchNumber}-away`;

  return {
    away: slot(awayTeamId),
    home: slot(homeTeamId),
    id: `match-${matchNumber}`,
    matchNumber,
    roundLabel: "Ronda",
    selectedTeamId: selectedSide === "home" ? homeTeamId : awayTeamId,
    slotLabel: `Partido ${matchNumber}`,
  };
}

function savedBracketJson(): SavedTournamentBracketJson {
  return {
    projectedRoundOf32: Array.from({ length: 16 }, (_, index) =>
      savedMatch(73 + index, index % 2 === 0 ? "home" : "away"),
    ),
    rounds: {
      final: [savedMatch(104)],
      quarterfinals: Array.from({ length: 4 }, (_, index) =>
        savedMatch(97 + index),
      ),
      roundOf16: Array.from({ length: 8 }, (_, index) =>
        savedMatch(89 + index),
      ),
      semifinals: [savedMatch(101), savedMatch(102, "away")],
      thirdPlace: [savedMatch(103, "away")],
    },
    selections: {},
    summary: {
      championTeamId: "team-104-home",
      fourthPlaceTeamId: "team-103-home",
      runnerUpTeamId: "team-104-away",
      thirdPlaceTeamId: "team-103-away",
    },
    thirdPlaceCombination: null,
    version: 1,
  };
}

describe("buildDevWorldCupMatchUpdatesFromSavedBracket", () => {
  it("creates deterministic updates for all knockout matches", () => {
    const result = buildDevWorldCupMatchUpdatesFromSavedBracket(
      savedBracketJson(),
    );

    expect(result.status).toBe("success");

    if (result.status !== "success") {
      return;
    }

    expect(result.updates).toHaveLength(32);
    expect(result.updates.map((update) => update.matchNumber)).toEqual(
      Array.from({ length: 32 }, (_, index) => 73 + index),
    );
    expect(result.updates[0]).toMatchObject({
      awayScore: 0,
      homeScore: 2,
      matchNumber: 73,
      winner: "HOME_TEAM",
    });
    expect(result.updates[1]).toMatchObject({
      awayScore: 2,
      homeScore: 0,
      matchNumber: 74,
      winner: "AWAY_TEAM",
    });
  });

  it("rejects incomplete saved bracket data", () => {
    const bracketJson = savedBracketJson();
    bracketJson.rounds.final = [];

    expect(buildDevWorldCupMatchUpdatesFromSavedBracket(bracketJson)).toEqual({
      message: "Guardá una llave completa de Mi Mundial antes de autocompletar.",
      status: "error",
    });
  });

  it("rejects placeholder teams", () => {
    const bracketJson = savedBracketJson();
    bracketJson.projectedRoundOf32[0].home.team.id = "placeholder-1A";
    bracketJson.projectedRoundOf32[0].selectedTeamId = "placeholder-1A";

    expect(buildDevWorldCupMatchUpdatesFromSavedBracket(bracketJson)).toEqual({
      message:
        "La llave guardada todavía tiene equipos por definir. Completá Mi Mundial con cruces resueltos.",
      status: "error",
    });
  });

  it("maps saved bracket updates onto official knockout rows without match numbers", () => {
    const simulation = buildDevWorldCupMatchUpdatesFromSavedBracket(
      savedBracketJson(),
    );

    expect(simulation.status).toBe("success");

    if (simulation.status !== "success") {
      return;
    }

    const targets = [
      ...Array.from({ length: 16 }, (_, index) => ({
        footballDataId: 537417 + index,
        id: `db-r32-${index + 1}`,
        kickoffAt: `2026-06-${String(28 + index).padStart(2, "0")}T19:00:00Z`,
        matchNumber: null,
        stage: "LAST_32",
      })),
      ...Array.from({ length: 8 }, (_, index) => ({
        footballDataId: 537376 + index,
        id: `db-r16-${index + 1}`,
        kickoffAt: `2026-07-${String(4 + index).padStart(2, "0")}T19:00:00Z`,
        matchNumber: null,
        stage: "LAST_16",
      })),
      ...Array.from({ length: 4 }, (_, index) => ({
        footballDataId: 537383 + index,
        id: `db-qf-${index + 1}`,
        kickoffAt: `2026-07-${String(9 + index).padStart(2, "0")}T19:00:00Z`,
        matchNumber: null,
        stage: "QUARTER_FINALS",
      })),
      ...Array.from({ length: 2 }, (_, index) => ({
        footballDataId: 537387 + index,
        id: `db-sf-${index + 1}`,
        kickoffAt: `2026-07-${String(14 + index).padStart(2, "0")}T19:00:00Z`,
        matchNumber: null,
        stage: "SEMI_FINALS",
      })),
      {
        footballDataId: 537389,
        id: "db-third",
        kickoffAt: "2026-07-18T21:00:00Z",
        matchNumber: null,
        stage: "THIRD_PLACE",
      },
      {
        footballDataId: 537390,
        id: "db-final",
        kickoffAt: "2026-07-19T19:00:00Z",
        matchNumber: null,
        stage: "FINAL",
      },
    ];

    const result = buildDevWorldCupKnockoutDatabaseUpdates(
      simulation.updates,
      targets,
    );

    expect(result.status).toBe("success");

    if (result.status !== "success") {
      return;
    }

    expect(result.updates).toHaveLength(32);
    expect(result.updates[0]).toMatchObject({
      id: "db-r32-1",
      matchNumber: 73,
    });
    expect(result.updates.at(-1)).toMatchObject({
      id: "db-final",
      matchNumber: 104,
    });
  });

  it("produces complete actual outcomes and bonus scoring after dev simulation", () => {
    const simulation = buildDevWorldCupMatchUpdatesFromSavedBracket(
      savedBracketJson(),
    );

    expect(simulation.status).toBe("success");

    if (simulation.status !== "success") {
      return;
    }

    const actualOutcome = deriveActualTournamentOutcome(
      simulation.updates.map((update) => ({
        away_score: update.awayScore,
        away_team_id: update.awayTeamId,
        home_score: update.homeScore,
        home_team_id: update.homeTeamId,
        match_number: update.matchNumber,
        status: "FINISHED",
        winner: update.winner,
      })),
    );

    expect(actualOutcome.status).toBe("complete");

    if (actualOutcome.status !== "complete") {
      return;
    }

    const result = scoreTournamentPredictionBonus(
      {
        championTeamId: "team-104-home",
        fourthPlaceTeamId: "team-103-home",
        quarterfinalTeamIds: simulation.updates
          .filter((update) => update.matchNumber >= 89 && update.matchNumber <= 96)
          .map((update) =>
            update.winner === "HOME_TEAM" ? update.homeTeamId : update.awayTeamId,
          ),
        roundOf16TeamIds: simulation.updates
          .filter((update) => update.matchNumber >= 73 && update.matchNumber <= 88)
          .map((update) =>
            update.winner === "HOME_TEAM" ? update.homeTeamId : update.awayTeamId,
          ),
        runnerUpTeamId: "team-104-away",
        semifinalTeamIds: simulation.updates
          .filter((update) => update.matchNumber >= 97 && update.matchNumber <= 100)
          .map((update) =>
            update.winner === "HOME_TEAM" ? update.homeTeamId : update.awayTeamId,
          ),
        thirdPlaceTeamId: "team-103-away",
      },
      actualOutcome.outcome,
    );

    expect(result.isComplete).toBe(true);
    expect(result.totalPoints).toBe(52);
  });

  it("builds reset updates that clear results while preserving group teams", () => {
    const updates = buildDevWorldCupResetMatchUpdates([
      {
        away_team_id: "group-away",
        home_team_id: "group-home",
        id: "group-1",
        match_number: 1,
        stage: "GROUP_STAGE",
      },
      {
        away_team_id: "ko-away",
        home_team_id: "ko-home",
        id: "ko-73",
        match_number: 73,
        stage: "LAST_32",
      },
    ]);

    expect(updates).toEqual([
      {
        away_score: null,
        home_score: null,
        id: "group-1",
        minute: null,
        status: "TIMED",
        winner: null,
      },
      {
        away_score: null,
        away_team_id: null,
        home_score: null,
        home_team_id: null,
        id: "ko-73",
        minute: null,
        status: "TIMED",
        winner: null,
      },
    ]);
  });

  it("returns incomplete actual outcomes after reset clears knockout teams and scores", () => {
    const resetMatches = buildDevWorldCupResetMatchUpdates([
      ...Array.from({ length: 32 }, (_, index) => ({
        away_team_id: `away-${index}`,
        home_team_id: `home-${index}`,
        id: `ko-${73 + index}`,
        match_number: 73 + index,
        stage: "LAST_32",
      })),
    ]);
    const actualOutcome = deriveActualTournamentOutcome(
      resetMatches.map((update) => ({
        away_score: update.away_score,
        away_team_id: update.away_team_id ?? null,
        home_score: update.home_score,
        home_team_id: update.home_team_id ?? null,
        match_number: Number(update.id.replace("ko-", "")),
        status: update.status,
        winner: update.winner,
      })),
    );

    expect(actualOutcome.status).toBe("incomplete");
    expect(actualOutcome.reason).toContain("16avos");
  });

  it("builds tournament prediction bonus reset patch without removing bracket data", () => {
    expect(getTournamentPredictionBonusResetPatch()).toEqual({
      bonus_points: 0,
      scored_at: null,
    });
  });

  it("returns a non-empty Spanish reset success message", () => {
    expect(
      getDevWorldCupResetSuccessMessage({
        bonusReset: 1,
        matchesReset: 104,
        predictionsConserved: 72,
      }),
    ).toBe(
      "Datos de prueba eliminados. Partidos reiniciados: 104. Predicciones conservadas: 72. Bonus Mi Mundial reiniciado: 1.",
    );
  });
});
