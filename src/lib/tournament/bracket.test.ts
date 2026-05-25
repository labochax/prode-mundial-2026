import { describe, expect, it } from "vitest";

import { buildProjectedBracket } from "@/lib/tournament/bracket";
import { rankThirdPlacedTeams } from "@/lib/tournament/rank-third-placed";
import type {
  RankedThirdPlacedTeam,
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

function row(
  groupCode: string,
  rank: number,
  values: Pick<
    TournamentStandingRow,
    "goalDifference" | "goalsFor" | "points"
  >,
): TournamentStandingRow {
  return {
    draws: 0,
    goalDifference: values.goalDifference,
    goalsAgainst: Math.max(0, values.goalsFor - values.goalDifference),
    goalsFor: values.goalsFor,
    losses: 0,
    played: 3,
    points: values.points,
    rank,
    team: team(`${groupCode}-${rank}`, `${groupCode} Equipo ${rank}`),
    wins: 0,
  };
}

function group(groupCode: string, thirdPoints: number): TournamentGroupSimulation {
  return {
    groupCode,
    groupLabel: `Grupo ${groupCode}`,
    isComplete: true,
    predictionsCompleted: 6,
    predictionsTotal: 6,
    rows: [
      row(groupCode, 1, {
        goalDifference: 6,
        goalsFor: 9,
        points: 9,
      }),
      row(groupCode, 2, {
        goalDifference: 3,
        goalsFor: 7,
        points: 6,
      }),
      row(groupCode, 3, {
        goalDifference: thirdPoints,
        goalsFor: thirdPoints + 2,
        points: thirdPoints,
      }),
      row(groupCode, 4, {
        goalDifference: -6,
        goalsFor: 1,
        points: 0,
      }),
    ],
  };
}

function completeGroups() {
  return "ABCDEFGHIJKL"
    .split("")
    .map((groupCode, index) => group(groupCode, 12 - index));
}

function buildRankedThirds(groups: TournamentGroupSimulation[]) {
  return rankThirdPlacedTeams(groups);
}

function rankedThird(
  groupCode: string,
  thirdRank: number,
): RankedThirdPlacedTeam {
  return {
    ...row(groupCode, 3, {
      goalDifference: 10 - thirdRank,
      goalsFor: 12 - thirdRank,
      points: 9 - thirdRank,
    }),
    groupCode,
    groupLabel: `Grupo ${groupCode}`,
    isQualified: true,
    thirdRank,
  };
}

describe("buildProjectedBracket", () => {
  it("produces 32 projected teams and 16 round-of-32 matchups when qualifiers are complete", () => {
    const groups = completeGroups();
    const bracket = buildProjectedBracket(groups, buildRankedThirds(groups));

    expect(bracket.status).toBe("complete");
    expect(bracket.projectedTeams).toHaveLength(32);
    expect(bracket.roundOf32).toHaveLength(16);
    expect(bracket.missingQualifiers).toBe(0);
  });

  it("uses fixed FIFA Round of 32 slots for deterministic direct qualifiers", () => {
    const groups = completeGroups();
    const bracket = buildProjectedBracket(groups, buildRankedThirds(groups));

    expect(bracket.roundOf32.find((matchup) => matchup.matchNumber === 73))
      .toMatchObject({
        away: {
          slotLabel: "2°B",
          team: {
            id: "B-2",
          },
        },
        home: {
          slotLabel: "2°A",
          team: {
            id: "A-2",
          },
        },
      });
    expect(bracket.roundOf32.find((matchup) => matchup.matchNumber === 84))
      .toMatchObject({
        away: {
          slotLabel: "2°J",
          team: {
            id: "J-2",
          },
        },
        home: {
          slotLabel: "1°H",
          team: {
            id: "H-1",
          },
        },
      });
    expect(bracket.roundOf32.find((matchup) => matchup.matchNumber === 86))
      .toMatchObject({
        away: {
          slotLabel: "2°H",
          team: {
            id: "H-2",
          },
        },
        home: {
          slotLabel: "1°J",
          team: {
            id: "J-1",
          },
        },
      });
  });

  it("marks projected team origins and qualification types", () => {
    const groups = completeGroups();
    const bracket = buildProjectedBracket(groups, buildRankedThirds(groups));

    expect(bracket.projectedTeams.find((slot) => slot.slotLabel === "1°A"))
      .toMatchObject({
        originLabel: "1° Grupo A",
        qualificationType: "Ganador de grupo",
        team: {
          id: "A-1",
        },
      });
    expect(bracket.projectedTeams.find((slot) => slot.slotLabel === "2°A"))
      .toMatchObject({
        originLabel: "2° Grupo A",
        qualificationType: "Segundo de grupo",
        team: {
          id: "A-2",
        },
      });
    expect(bracket.projectedTeams.find((slot) => slot.slotLabel === "3°A"))
      .toMatchObject({
        originLabel: "Mejor 3° - Grupo A",
        qualificationType: "Mejor tercero",
        team: {
          id: "A-3",
        },
      });
  });

  it("returns incomplete state when not enough group results exist", () => {
    const groups = completeGroups().slice(0, 4);
    const bracket = buildProjectedBracket(groups, buildRankedThirds(groups));

    expect(bracket.status).toBe("incomplete");
    expect(bracket.roundOf32).toHaveLength(16);
    expect(bracket.missingQualifiers).toBeGreaterThan(0);
  });

  it("returns incomplete state while any projected group remains incomplete", () => {
    const groups = completeGroups();
    groups[0] = {
      ...groups[0],
      isComplete: false,
      predictionsCompleted: 5,
    };
    const bracket = buildProjectedBracket(groups, buildRankedThirds(groups));

    expect(bracket.status).toBe("incomplete");
    expect(bracket.roundOf32).toHaveLength(16);
  });

  it("does not reuse the same best-third team in multiple Round of 32 slots", () => {
    const groups = completeGroups();
    const bracket = buildProjectedBracket(groups, buildRankedThirds(groups));
    const usedThirdTeamIds = bracket.roundOf32
      .flatMap((matchup) => [matchup.home, matchup.away])
      .filter((slot) => slot.sourceRank === 3 && !slot.isPlaceholder)
      .map((slot) => slot.team.id);

    expect(new Set(usedThirdTeamIds).size).toBe(usedThirdTeamIds.length);
  });

  it("uses Annex C instead of greedy assignment for third-place slots", () => {
    const groups = completeGroups();
    const thirdPlacedTeams = ["A", "H", "E", "I", "J", "C", "D", "L"].map(
      (groupCode, index) => rankedThird(groupCode, index + 1),
    );
    const bracket = buildProjectedBracket(groups, thirdPlacedTeams);
    const matchup = bracket.roundOf32.find((candidate) => candidate.matchNumber === 82);

    expect(bracket.thirdPlaceCombination?.option).toBe(254);
    expect(matchup?.away).toMatchObject({
      isPlaceholder: false,
      ruleLabel: "Slot FIFA: 1G",
      slotLabel: "Mejor 3° A",
      team: {
        id: "A-3",
      },
    });
  });

  it("does not leave best-third placeholders when eight qualified thirds match Annex C", () => {
    const groups = completeGroups();
    const thirdPlacedTeams = ["A", "H", "E", "I", "J", "C", "D", "L"].map(
      (groupCode, index) => rankedThird(groupCode, index + 1),
    );
    const bracket = buildProjectedBracket(groups, thirdPlacedTeams);
    const bestThirdSlots = bracket.roundOf32
      .flatMap((matchup) => [matchup.home, matchup.away])
      .filter((slot) => slot.sourceRank === 3);

    expect(bestThirdSlots).toHaveLength(8);
    expect(bestThirdSlots.every((slot) => !slot.isPlaceholder)).toBe(true);
    expect(new Set(bestThirdSlots.map((slot) => slot.team.id)).size).toBe(8);
  });

  it("uses Por definir placeholders when a required group slot is missing", () => {
    const groups = completeGroups().filter((candidate) => candidate.groupCode !== "J");
    const bracket = buildProjectedBracket(groups, buildRankedThirds(groups));
    const matchup = bracket.roundOf32.find((candidate) => candidate.matchNumber === 86);

    expect(matchup?.home).toMatchObject({
      isPlaceholder: true,
      slotLabel: "1°J",
      team: {
        name: "Por definir",
      },
    });
  });

  it("uses best-third placeholders when no Annex C row matches the qualified groups", () => {
    const groups = completeGroups();
    const thirdPlacedTeams = ["A", "B", "C", "D", "E", "F", "G", "Z"].map(
      (groupCode, index) => rankedThird(groupCode, index + 1),
    );
    const bracket = buildProjectedBracket(groups, thirdPlacedTeams);
    const unresolvedBestThird = bracket.roundOf32
      .flatMap((matchup) => [matchup.home, matchup.away])
      .find((slot) => slot.sourceRank === 3 && slot.isPlaceholder);

    expect(bracket.thirdPlaceCombination).toBeNull();
    expect(unresolvedBestThird).toMatchObject({
      isPlaceholder: true,
      team: {
        name: "Por definir",
      },
    });
  });

  it("uses stable deterministic ordering regardless of input order", () => {
    const groups = completeGroups();
    const shuffledGroups = [...groups].reverse();
    const shuffledThirds = [...buildRankedThirds(groups)].reverse();

    const ordered = buildProjectedBracket(groups, buildRankedThirds(groups));
    const shuffled = buildProjectedBracket(shuffledGroups, shuffledThirds);

    expect(shuffled.projectedTeams.map((slot) => slot.team.id)).toEqual(
      ordered.projectedTeams.map((slot) => slot.team.id),
    );
    expect(
      shuffled.roundOf32.map((matchup) => [
        matchup.matchNumber,
        matchup.home.team.id,
        matchup.away.team.id,
      ]),
    ).toEqual(
      ordered.roundOf32.map((matchup) => [
        matchup.matchNumber,
        matchup.home.team.id,
        matchup.away.team.id,
      ]),
    );
  });

  it("does not mutate group or third-place inputs", () => {
    const groups = completeGroups();
    const thirdPlacedTeams: RankedThirdPlacedTeam[] = buildRankedThirds(groups);
    const originalGroups = JSON.stringify(groups);
    const originalThirds = JSON.stringify(thirdPlacedTeams);

    buildProjectedBracket(groups, thirdPlacedTeams);

    expect(JSON.stringify(groups)).toBe(originalGroups);
    expect(JSON.stringify(thirdPlacedTeams)).toBe(originalThirds);
  });
});
