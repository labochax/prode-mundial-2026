import { describe, expect, it } from "vitest";

import { rankThirdPlacedTeams } from "@/lib/tournament/rank-third-placed";
import type {
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
  id: string,
  name: string,
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
    rank: 3,
    team: team(id, name),
    wins: 0,
  };
}

function group(
  code: string,
  thirdPlaced: TournamentStandingRow,
): TournamentGroupSimulation {
  return {
    groupCode: code,
    groupLabel: `Grupo ${code}`,
    isComplete: true,
    predictionsCompleted: 6,
    predictionsTotal: 6,
    rows: [
      row(`${code}-first`, `${code} Primero`, {
        goalDifference: 5,
        goalsFor: 8,
        points: 9,
      }),
      row(`${code}-second`, `${code} Segundo`, {
        goalDifference: 2,
        goalsFor: 6,
        points: 6,
      }),
      thirdPlaced,
      row(`${code}-fourth`, `${code} Cuarto`, {
        goalDifference: -5,
        goalsFor: 1,
        points: 0,
      }),
    ],
  };
}

describe("rankThirdPlacedTeams", () => {
  it("collects one third-place team per group and ranks them by the table rules", () => {
    const ranked = rankThirdPlacedTeams([
      group(
        "A",
        row("boca", "Boca", {
          goalDifference: 2,
          goalsFor: 5,
          points: 6,
        }),
      ),
      group(
        "B",
        row("atlas", "Atlas", {
          goalDifference: 2,
          goalsFor: 5,
          points: 6,
        }),
      ),
      group(
        "C",
        row("c", "C", {
          goalDifference: 3,
          goalsFor: 4,
          points: 5,
        }),
      ),
    ]);

    expect(ranked.map((candidate) => candidate.team.name)).toEqual([
      "Atlas",
      "Boca",
      "C",
    ]);
    expect(ranked.map((candidate) => candidate.groupLabel)).toEqual([
      "Grupo B",
      "Grupo A",
      "Grupo C",
    ]);
    expect(ranked.every((candidate) => candidate.isQualified)).toBe(true);
  });

  it("marks the top 8 third-place teams as qualified and the rest as eliminated", () => {
    const ranked = rankThirdPlacedTeams([
      group("A", row("a", "A", { goalDifference: 8, goalsFor: 9, points: 9 })),
      group("B", row("b", "B", { goalDifference: 7, goalsFor: 8, points: 8 })),
      group("C", row("c", "C", { goalDifference: 6, goalsFor: 7, points: 7 })),
      group("D", row("d", "D", { goalDifference: 5, goalsFor: 6, points: 6 })),
      group("E", row("e", "E", { goalDifference: 4, goalsFor: 5, points: 5 })),
      group("F", row("f", "F", { goalDifference: 3, goalsFor: 4, points: 4 })),
      group("G", row("g", "G", { goalDifference: 2, goalsFor: 3, points: 3 })),
      group("H", row("h", "H", { goalDifference: 1, goalsFor: 2, points: 2 })),
      group("I", row("i", "I", { goalDifference: 0, goalsFor: 1, points: 1 })),
    ]);

    expect(ranked).toHaveLength(9);
    expect(ranked.slice(0, 8).every((candidate) => candidate.isQualified)).toBe(
      true,
    );
    expect(ranked[8]).toMatchObject({
      isQualified: false,
      team: {
        id: "i",
      },
      thirdRank: 9,
    });
  });

  it("marks every candidate as qualified when fewer than 8 third-place teams exist", () => {
    const ranked = rankThirdPlacedTeams([
      group("A", row("a", "A", { goalDifference: 1, goalsFor: 2, points: 4 })),
      group("B", row("b", "B", { goalDifference: 0, goalsFor: 1, points: 3 })),
    ]);

    expect(ranked).toHaveLength(2);
    expect(ranked.every((candidate) => candidate.isQualified)).toBe(true);
  });
});
