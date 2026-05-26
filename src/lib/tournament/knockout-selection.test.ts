import { describe, expect, it } from "vitest";

import { buildProjectedBracket } from "@/lib/tournament/bracket";
import {
  advanceBracketRound,
  buildDerivedKnockoutRounds,
  getBracketBonusPreview,
  getKnockoutPhaseStatus,
  sanitizeKnockoutSelections,
} from "@/lib/tournament/knockout-selection";
import { rankThirdPlacedTeams } from "@/lib/tournament/rank-third-placed";
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
    rows: [row(groupCode, 1), row(groupCode, 2), row(groupCode, 3), row(groupCode, 4)],
  };
}

function completeRoundOf32() {
  const groups = "ABCDEFGHIJKL".split("").map(group);
  const bracket = buildProjectedBracket(groups, rankThirdPlacedTeams(groups));

  return bracket.roundOf32;
}

function selectHome(matches: ProjectedBracketMatch[]) {
  return Object.fromEntries(
    matches.map((matchup) => [matchup.id, matchup.home.team.id]),
  );
}

function selectAway(matches: ProjectedBracketMatch[]) {
  return Object.fromEntries(
    matches.map((matchup) => [matchup.id, matchup.away.team.id]),
  );
}

describe("knockout selection helpers", () => {
  it("selecting Round of 32 winners produces 16 Round of 16 teams", () => {
    const roundOf32 = completeRoundOf32();
    const selections = selectHome(roundOf32);
    const advanced = advanceBracketRound(roundOf32, selections);
    const rounds = buildDerivedKnockoutRounds(roundOf32, selections);

    expect(advanced.winners).toHaveLength(16);
    expect(rounds.roundOf16).toHaveLength(8);
  });

  it("selecting Round of 16 winners produces 8 quarterfinalists", () => {
    const roundOf32 = completeRoundOf32();
    const firstPass = buildDerivedKnockoutRounds(roundOf32, selectHome(roundOf32));
    const selections = {
      ...selectHome(roundOf32),
      ...selectAway(firstPass.roundOf16),
    };
    const rounds = buildDerivedKnockoutRounds(roundOf32, selections);

    expect(advanceBracketRound(rounds.roundOf16, selections).winners).toHaveLength(8);
    expect(rounds.quarterfinals).toHaveLength(4);
  });

  it("selecting quarterfinal winners produces 4 semifinalists", () => {
    const roundOf32 = completeRoundOf32();
    const withRoundOf16 = buildDerivedKnockoutRounds(roundOf32, selectHome(roundOf32));
    const withQuarters = buildDerivedKnockoutRounds(roundOf32, {
      ...selectHome(roundOf32),
      ...selectHome(withRoundOf16.roundOf16),
    });
    const selections = {
      ...selectHome(roundOf32),
      ...selectHome(withRoundOf16.roundOf16),
      ...selectHome(withQuarters.quarterfinals),
    };
    const rounds = buildDerivedKnockoutRounds(roundOf32, selections);

    expect(advanceBracketRound(rounds.quarterfinals, selections).winners).toHaveLength(4);
    expect(rounds.semifinals).toHaveLength(2);
  });

  it("semifinal winners and losers produce final and third-place match", () => {
    const roundOf32 = completeRoundOf32();
    const withRoundOf16 = buildDerivedKnockoutRounds(roundOf32, selectHome(roundOf32));
    const withQuarters = buildDerivedKnockoutRounds(roundOf32, {
      ...selectHome(roundOf32),
      ...selectHome(withRoundOf16.roundOf16),
    });
    const withSemis = buildDerivedKnockoutRounds(roundOf32, {
      ...selectHome(roundOf32),
      ...selectHome(withRoundOf16.roundOf16),
      ...selectHome(withQuarters.quarterfinals),
    });
    const selections = {
      ...selectHome(roundOf32),
      ...selectHome(withRoundOf16.roundOf16),
      ...selectHome(withQuarters.quarterfinals),
      ...selectHome(withSemis.semifinals),
    };
    const rounds = buildDerivedKnockoutRounds(roundOf32, selections);

    expect(rounds.final).toHaveLength(1);
    expect(rounds.thirdPlace).toHaveLength(1);
  });

  it("final and third-place selections produce champion, runner-up, third and fourth", () => {
    const roundOf32 = completeRoundOf32();
    const withRoundOf16 = buildDerivedKnockoutRounds(roundOf32, selectHome(roundOf32));
    const withQuarters = buildDerivedKnockoutRounds(roundOf32, {
      ...selectHome(roundOf32),
      ...selectHome(withRoundOf16.roundOf16),
    });
    const withSemis = buildDerivedKnockoutRounds(roundOf32, {
      ...selectHome(roundOf32),
      ...selectHome(withRoundOf16.roundOf16),
      ...selectHome(withQuarters.quarterfinals),
    });
    const withFinals = buildDerivedKnockoutRounds(roundOf32, {
      ...selectHome(roundOf32),
      ...selectHome(withRoundOf16.roundOf16),
      ...selectHome(withQuarters.quarterfinals),
      ...selectHome(withSemis.semifinals),
    });
    const rounds = buildDerivedKnockoutRounds(roundOf32, {
      ...selectHome(roundOf32),
      ...selectHome(withRoundOf16.roundOf16),
      ...selectHome(withQuarters.quarterfinals),
      ...selectHome(withSemis.semifinals),
      ...selectHome(withFinals.final),
      ...selectAway(withFinals.thirdPlace),
    });

    expect(rounds.summary.champion?.team.id).toBe(rounds.final[0].home.team.id);
    expect(rounds.summary.runnerUp?.team.id).toBe(rounds.final[0].away.team.id);
    expect(rounds.summary.thirdPlace?.team.id).toBe(rounds.thirdPlace[0].away.team.id);
    expect(rounds.summary.fourthPlace?.team.id).toBe(rounds.thirdPlace[0].home.team.id);
  });

  it("bonus preview maximum is 52 points and does not include Round of 32", () => {
    expect(getBracketBonusPreview()).toMatchObject({
      maxPossiblePoints: 52,
      rules: [
        { label: "Equipos en octavos", pointsPerHit: 1, total: 16 },
        { label: "Equipos en cuartos", pointsPerHit: 1, total: 8 },
        { label: "Equipos en semifinales", pointsPerHit: 2, total: 8 },
        { label: "Campeón exacto", pointsPerHit: 10, total: 10 },
        { label: "Subcampeón exacto", pointsPerHit: 5, total: 5 },
        { label: "Tercer puesto exacto", pointsPerHit: 3, total: 3 },
        { label: "Cuarto puesto exacto", pointsPerHit: 2, total: 2 },
      ],
    });
  });

  it("does not mutate input bracket matches", () => {
    const roundOf32 = completeRoundOf32();
    const original = JSON.stringify(roundOf32);

    buildDerivedKnockoutRounds(roundOf32, selectHome(roundOf32));

    expect(JSON.stringify(roundOf32)).toBe(original);
  });

  it("derives all saved rounds from complete selections without actual outcomes", () => {
    const roundOf32 = completeRoundOf32();
    const withRoundOf16 = buildDerivedKnockoutRounds(
      roundOf32,
      selectHome(roundOf32),
    );
    const withQuarters = buildDerivedKnockoutRounds(roundOf32, {
      ...selectHome(roundOf32),
      ...selectHome(withRoundOf16.roundOf16),
    });
    const withSemis = buildDerivedKnockoutRounds(roundOf32, {
      ...selectHome(roundOf32),
      ...selectHome(withRoundOf16.roundOf16),
      ...selectHome(withQuarters.quarterfinals),
    });
    const withFinals = buildDerivedKnockoutRounds(roundOf32, {
      ...selectHome(roundOf32),
      ...selectHome(withRoundOf16.roundOf16),
      ...selectHome(withQuarters.quarterfinals),
      ...selectHome(withSemis.semifinals),
    });
    const completeSelections = {
      ...selectHome(roundOf32),
      ...selectHome(withRoundOf16.roundOf16),
      ...selectHome(withQuarters.quarterfinals),
      ...selectHome(withSemis.semifinals),
      ...selectHome(withFinals.final),
      ...selectHome(withFinals.thirdPlace),
    };
    const rounds = buildDerivedKnockoutRounds(roundOf32, completeSelections);

    expect(rounds.roundOf32).toHaveLength(16);
    expect(rounds.roundOf16).toHaveLength(8);
    expect(rounds.quarterfinals).toHaveLength(4);
    expect(rounds.semifinals).toHaveLength(2);
    expect(rounds.final).toHaveLength(1);
    expect(rounds.thirdPlace).toHaveLength(1);
    expect(rounds.summary.champion).not.toBeNull();
  });

  it("clears invalid downstream selections when a Round of 32 winner changes", () => {
    const roundOf32 = completeRoundOf32();
    const firstPass = buildDerivedKnockoutRounds(roundOf32, selectHome(roundOf32));
    const originalSelections = {
      ...selectHome(roundOf32),
      ...selectHome(firstPass.roundOf16),
    };
    const changedSelections = {
      ...originalSelections,
      [roundOf32[1].id]: roundOf32[1].away.team.id,
    };

    const result = sanitizeKnockoutSelections(roundOf32, changedSelections);

    expect(result.selections[roundOf32[1].id]).toBe(roundOf32[1].away.team.id);
    expect(result.selections["match-89"]).toBeUndefined();
    expect(result.removedSelectionIds).toContain("match-89");
  });

  it("clears invalid quarterfinal and semifinal selections when a Round of 16 winner changes", () => {
    const roundOf32 = completeRoundOf32();
    const withRoundOf16 = buildDerivedKnockoutRounds(
      roundOf32,
      selectHome(roundOf32),
    );
    const withQuarters = buildDerivedKnockoutRounds(roundOf32, {
      ...selectHome(roundOf32),
      ...selectHome(withRoundOf16.roundOf16),
    });
    const withSemis = buildDerivedKnockoutRounds(roundOf32, {
      ...selectHome(roundOf32),
      ...selectHome(withRoundOf16.roundOf16),
      ...selectHome(withQuarters.quarterfinals),
    });
    const originalSelections = {
      ...selectHome(roundOf32),
      ...selectHome(withRoundOf16.roundOf16),
      ...selectHome(withQuarters.quarterfinals),
      ...selectHome(withSemis.semifinals),
    };
    const changedSelections = {
      ...originalSelections,
      [withRoundOf16.roundOf16[0].id]: withRoundOf16.roundOf16[0].away.team.id,
    };

    const result = sanitizeKnockoutSelections(roundOf32, changedSelections);

    expect(result.selections[withRoundOf16.roundOf16[0].id]).toBe(
      withRoundOf16.roundOf16[0].away.team.id,
    );
    expect(result.selections["match-97"]).toBeUndefined();
    expect(result.selections["match-101"]).toBeUndefined();
    expect(result.removedSelectionIds).toEqual(
      expect.arrayContaining(["match-97", "match-101"]),
    );
  });

  it("drops saved selections that no longer fit a rebuilt projected Round of 32", () => {
    const roundOf32 = completeRoundOf32();
    const savedSelections = selectHome(roundOf32);
    const rebuiltRoundOf32 = roundOf32.map((matchup, index) =>
      index === 0
        ? {
            ...matchup,
            home: {
              ...matchup.home,
              team: team("changed-home", "Equipo cambiado"),
            },
          }
        : matchup,
    );

    const result = sanitizeKnockoutSelections(rebuiltRoundOf32, savedSelections);

    expect(result.selections[roundOf32[0].id]).toBeUndefined();
    expect(result.removedSelectionIds).toContain(roundOf32[0].id);
  });

  it("classifies phase status as complete, incomplete, or pending", () => {
    const roundOf32 = completeRoundOf32();

    expect(getKnockoutPhaseStatus([], {})).toBe("pending");
    expect(getKnockoutPhaseStatus(roundOf32, {})).toBe("incomplete");
    expect(getKnockoutPhaseStatus(roundOf32, selectHome(roundOf32))).toBe(
      "complete",
    );
  });
});
