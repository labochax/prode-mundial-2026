import { describe, expect, it } from "vitest";

import { buildProjectedBracket } from "@/lib/tournament/bracket";
import {
  buildDerivedKnockoutRounds,
  type KnockoutSelectionMap,
} from "@/lib/tournament/knockout-selection";
import { rankThirdPlacedTeams } from "@/lib/tournament/rank-third-placed";
import {
  buildTournamentPredictionPayload,
  getProjectedBracketFromSavedTournamentPrediction,
  getReadOnlyTournamentPredictionFromSavedJson,
  getSelectionsFromSavedTournamentPrediction,
} from "@/lib/tournament/tournament-prediction-payload";
import type {
  ProjectedBracketMatch,
  TournamentGroupSimulation,
  TournamentStandingRow,
  TournamentTeam,
} from "@/lib/tournament/types";

function team(id: string, name: string): TournamentTeam {
  return {
    code: id.toUpperCase(),
    id,
    name,
  };
}

function row(groupCode: string, rank: number): TournamentStandingRow {
  return {
    draws: 0,
    goalDifference: 20 - rank,
    goalsAgainst: rank,
    goalsFor: 20,
    losses: 0,
    played: 3,
    points: 12 - rank,
    rank,
    team: team(`${groupCode}-${rank}`, `${groupCode} Equipo ${rank}`),
    wins: 0,
  };
}

function group(groupCode: string): TournamentGroupSimulation {
  return {
    groupCode,
    groupLabel: `Grupo ${groupCode}`,
    isComplete: true,
    predictionsCompleted: 6,
    predictionsTotal: 6,
    rows: [
      row(groupCode, 1),
      row(groupCode, 2),
      row(groupCode, 3),
      row(groupCode, 4),
    ],
  };
}

function selectHome(matches: Pick<ProjectedBracketMatch, "home" | "id">[]) {
  return Object.fromEntries(
    matches.map((matchup) => [matchup.id, matchup.home.team.id]),
  );
}

function completeSelections() {
  const groups = "ABCDEFGHIJKL".split("").map(group);
  const bracket = buildProjectedBracket(groups, rankThirdPlacedTeams(groups));
  const withRoundOf16 = buildDerivedKnockoutRounds(
    bracket.roundOf32,
    selectHome(bracket.roundOf32),
  );
  const withQuarters = buildDerivedKnockoutRounds(bracket.roundOf32, {
    ...selectHome(bracket.roundOf32),
    ...selectHome(withRoundOf16.roundOf16),
  });
  const withSemis = buildDerivedKnockoutRounds(bracket.roundOf32, {
    ...selectHome(bracket.roundOf32),
    ...selectHome(withRoundOf16.roundOf16),
    ...selectHome(withQuarters.quarterfinals),
  });
  const withFinals = buildDerivedKnockoutRounds(bracket.roundOf32, {
    ...selectHome(bracket.roundOf32),
    ...selectHome(withRoundOf16.roundOf16),
    ...selectHome(withQuarters.quarterfinals),
    ...selectHome(withSemis.semifinals),
  });
  const selections: KnockoutSelectionMap = {
    ...selectHome(bracket.roundOf32),
    ...selectHome(withRoundOf16.roundOf16),
    ...selectHome(withQuarters.quarterfinals),
    ...selectHome(withSemis.semifinals),
    ...selectHome(withFinals.final),
    ...selectHome(withFinals.thirdPlace),
  };

  return { bracket, selections };
}

describe("tournament prediction payload helpers", () => {
  it("serializes a complete bracket into DB-safe fields", () => {
    const { bracket, selections } = completeSelections();
    const result = buildTournamentPredictionPayload(bracket, selections);

    expect(result.status).toBe("success");

    if (result.status !== "success") {
      return;
    }

    expect(result.payload.round_of_16_team_ids).toHaveLength(16);
    expect(result.payload.quarterfinal_team_ids).toHaveLength(8);
    expect(result.payload.semifinal_team_ids).toHaveLength(4);
    expect(result.payload.champion_team_id).toBeTruthy();
    expect(result.payload.runner_up_team_id).toBeTruthy();
    expect(result.payload.third_place_team_id).toBeTruthy();
    expect(result.payload.fourth_place_team_id).toBeTruthy();
    expect(
      new Set([
        result.payload.champion_team_id,
        result.payload.runner_up_team_id,
        result.payload.third_place_team_id,
        result.payload.fourth_place_team_id,
      ]).size,
    ).toBe(4);
    expect(result.payload.bracket_json.version).toBe(1);
    expect(result.payload.bracket_json.selections).toEqual(selections);
  });

  it("rejects incomplete bracket selections", () => {
    const { bracket, selections } = completeSelections();
    const [firstSelectionKey] = Object.keys(selections);
    const incompleteSelections = { ...selections };
    delete incompleteSelections[firstSelectionKey];

    expect(buildTournamentPredictionPayload(bracket, incompleteSelections)).toEqual({
      message: "Completá la llave antes de guardar",
      status: "error",
    });
  });

  it("rejects an incomplete projected bracket", () => {
    const { bracket, selections } = completeSelections();

    expect(
      buildTournamentPredictionPayload(
        {
          ...bracket,
          status: "incomplete",
        },
        selections,
      ),
    ).toEqual({
      message: "Completá la llave antes de guardar",
      status: "error",
    });
  });

  it("extracts saved selections from persisted bracket JSON", () => {
    const { bracket, selections } = completeSelections();
    const result = buildTournamentPredictionPayload(bracket, selections);

    expect(result.status).toBe("success");

    if (result.status !== "success") {
      return;
    }

    expect(
      getSelectionsFromSavedTournamentPrediction(result.payload.bracket_json),
    ).toEqual(selections);
  });

  it("reconstructs the locked bracket from the persisted snapshot", () => {
    const { bracket, selections } = completeSelections();
    const result = buildTournamentPredictionPayload(bracket, selections);

    expect(result.status).toBe("success");

    if (result.status !== "success") {
      return;
    }

    const savedBracket = getProjectedBracketFromSavedTournamentPrediction(
      result.payload.bracket_json,
    );

    expect(savedBracket?.status).toBe("complete");
    expect(savedBracket?.roundOf32).toHaveLength(16);
    expect(savedBracket?.roundOf32[0]?.home.team.id).toBe(
      result.payload.bracket_json.projectedRoundOf32[0]?.home.team.id,
    );
  });

  it("returns null when the persisted bracket snapshot is missing", () => {
    expect(getProjectedBracketFromSavedTournamentPrediction(null)).toBeNull();
  });

  it("reconstructs a complete read-only tournament prediction", () => {
    const { bracket, selections } = completeSelections();
    const result = buildTournamentPredictionPayload(bracket, selections);

    expect(result.status).toBe("success");

    if (result.status !== "success") {
      return;
    }

    const readOnly = getReadOnlyTournamentPredictionFromSavedJson(
      result.payload.bracket_json,
    );

    expect(readOnly?.rounds.roundOf32).toHaveLength(16);
    expect(readOnly?.rounds.roundOf16).toHaveLength(8);
    expect(readOnly?.rounds.quarterfinals).toHaveLength(4);
    expect(readOnly?.rounds.semifinals).toHaveLength(2);
    expect(readOnly?.rounds.summary.champion).not.toBeNull();
  });

  it("rejects malformed read-only bracket JSON safely", () => {
    expect(
      getReadOnlyTournamentPredictionFromSavedJson({
        projectedRoundOf32: [],
        selections: {},
      }),
    ).toBeNull();
  });

  it("does not mutate the input bracket or selections", () => {
    const { bracket, selections } = completeSelections();
    const originalBracket = JSON.stringify(bracket);
    const originalSelections = JSON.stringify(selections);

    buildTournamentPredictionPayload(bracket, selections);

    expect(JSON.stringify(bracket)).toBe(originalBracket);
    expect(JSON.stringify(selections)).toBe(originalSelections);
  });
});
