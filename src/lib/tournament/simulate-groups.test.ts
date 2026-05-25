import { describe, expect, it } from "vitest";

import {
  getTournamentGroupLabel,
  rankTournamentStandingRows,
  simulateGroupTables,
} from "@/lib/tournament/simulate-groups";
import type {
  TournamentGroupMatch,
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

function match(
  id: string,
  groupCode: string,
  homeTeam: TournamentTeam,
  awayTeam: TournamentTeam,
  score: { away: number; home: number } | null,
): TournamentGroupMatch {
  return {
    awayTeam,
    groupCode,
    homeTeam,
    id,
    prediction: score
      ? {
          awayScore: score.away,
          homeScore: score.home,
        }
      : null,
  };
}

function standing(
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
    goalsAgainst: 0,
    goalsFor: values.goalsFor,
    losses: 0,
    played: 3,
    points: values.points,
    rank: 0,
    team: team(id, name),
    wins: 0,
  };
}

describe("simulateGroupTables", () => {
  it("calculates wins, draws, goals, goal difference and points from predictions", () => {
    const argentina = team("arg", "Argentina");
    const mexico = team("mex", "México");
    const japon = team("jpn", "Japón");
    const francia = team("fra", "Francia");

    const [group] = simulateGroupTables([
      match("a1", "GROUP_A", argentina, mexico, { away: 4, home: 7 }),
      match("a2", "GROUP_A", japon, francia, { away: 0, home: 0 }),
      match("a3", "GROUP_A", argentina, japon, { away: 2, home: 2 }),
      match("a4", "GROUP_A", mexico, francia, { away: 0, home: 1 }),
    ]);

    const argentinaRow = group.rows.find((row) => row.team.id === "arg");
    const franciaRow = group.rows.find((row) => row.team.id === "fra");

    expect(group.isComplete).toBe(true);
    expect(group.predictionsCompleted).toBe(4);
    expect(group.predictionsTotal).toBe(4);
    expect(argentinaRow).toMatchObject({
      draws: 1,
      goalDifference: 3,
      goalsAgainst: 6,
      goalsFor: 9,
      losses: 0,
      played: 2,
      points: 4,
      wins: 1,
    });
    expect(franciaRow).toMatchObject({
      draws: 1,
      goalDifference: -1,
      goalsAgainst: 1,
      goalsFor: 0,
      losses: 1,
      played: 2,
      points: 1,
      wins: 0,
    });
  });

  it("marks groups with missing predictions as incomplete without crashing", () => {
    const a = team("a", "A");
    const b = team("b", "B");
    const c = team("c", "C");
    const d = team("d", "D");

    const [group] = simulateGroupTables([
      match("b1", "GROUP_B", a, b, { away: 1, home: 1 }),
      match("b2", "GROUP_B", c, d, null),
    ]);

    expect(group.isComplete).toBe(false);
    expect(group.predictionsCompleted).toBe(1);
    expect(group.predictionsTotal).toBe(2);
    expect(group.rows).toHaveLength(4);
    expect(group.rows.find((row) => row.team.id === "c")).toMatchObject({
      played: 0,
      points: 0,
    });
  });

  it("formats normalized group labels", () => {
    expect(getTournamentGroupLabel("GROUP_J")).toBe("Grupo J");
    expect(getTournamentGroupLabel("GRUPO_A")).toBe("Grupo A");
  });
});

describe("rankTournamentStandingRows", () => {
  it("orders by points, goal difference, goals for and stable team fallback", () => {
    const ranked = rankTournamentStandingRows([
      standing("delta", "Delta", {
        goalDifference: 8,
        goalsFor: 9,
        points: 3,
      }),
      standing("bravo", "Bravo", {
        goalDifference: 1,
        goalsFor: 8,
        points: 6,
      }),
      standing("charlie", "Charlie", {
        goalDifference: 1,
        goalsFor: 6,
        points: 6,
      }),
      standing("alfa", "Alfa", {
        goalDifference: 4,
        goalsFor: 5,
        points: 6,
      }),
      standing("atlas", "Atlas", {
        goalDifference: 1,
        goalsFor: 6,
        points: 6,
      }),
    ]);

    expect(ranked.map((row) => row.team.name)).toEqual([
      "Alfa",
      "Bravo",
      "Atlas",
      "Charlie",
      "Delta",
    ]);
    expect(ranked.map((row) => row.rank)).toEqual([1, 2, 3, 4, 5]);
  });
});
