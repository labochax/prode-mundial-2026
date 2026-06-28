import { describe, expect, it } from "vitest";

import { getMatchEditability } from "@/lib/matches/match-editability";
import {
  buildOfficialKnockoutTeamUpdatePlan,
  resolveOfficialRoundOf32Assignments,
} from "@/lib/tournament/official-knockout-resolver";

describe("resolveOfficialRoundOf32Assignments", () => {
  it("resolves M73 from completed Group A and Group B runners-up", () => {
    const result = resolveOfficialRoundOf32Assignments([
      ...group("A", [
        ["a1", 9],
        ["a2", 6],
        ["a3", 3],
        ["a4", 0],
      ]),
      ...group("B", [
        ["b1", 9],
        ["b2", 6],
        ["b3", 3],
        ["b4", 0],
      ]),
    ]);

    expect(result.assignmentsByMatchNumber.get(73)).toEqual({
      awayTeamId: "b2",
      homeTeamId: "a2",
      matchNumber: 73,
    });
  });

  it("leaves best-third slots unresolved until the exact Annex C assignment is known", () => {
    const result = resolveOfficialRoundOf32Assignments([
      ...group("E", [
        ["e1", 9],
        ["e2", 6],
        ["e3", 3],
        ["e4", 0],
      ]),
    ]);

    expect(result.assignmentsByMatchNumber.get(74)).toEqual({
      homeTeamId: "e1",
      matchNumber: 74,
    });
    expect(result.unresolvedSlots).toContainEqual({
      matchNumber: 74,
      side: "away",
    });
  });

  it("resolves best-third slots when the qualified group set matches Annex C", () => {
    const result = resolveOfficialRoundOf32Assignments([
      ...lowThirdGroup("A"),
      ...lowThirdGroup("B"),
      ...lowThirdGroup("C"),
      ...lowThirdGroup("D"),
      ...qualifiedThirdGroup("E"),
      ...qualifiedThirdGroup("F"),
      ...qualifiedThirdGroup("G"),
      ...qualifiedThirdGroup("H"),
      ...qualifiedThirdGroup("I"),
      ...qualifiedThirdGroup("J"),
      ...qualifiedThirdGroup("K"),
      ...qualifiedThirdGroup("L"),
    ]);

    expect(result.thirdPlaceCombination?.option).toBe(1);
    expect(result.assignmentsByMatchNumber.get(74)).toMatchObject({
      awayTeamId: "F3",
      homeTeamId: "E1",
    });
    expect(result.assignmentsByMatchNumber.get(82)).toMatchObject({
      awayTeamId: "H3",
      homeTeamId: "G1",
    });
  });

  it("does not resolve a tied group position that needs unavailable FIFA tie-breakers", () => {
    const result = resolveOfficialRoundOf32Assignments([
      ...ambiguousRunnerUpGroup("A"),
      ...group("B", [
        ["b1", 9],
        ["b2", 6],
        ["b3", 3],
        ["b4", 0],
      ]),
    ]);

    expect(result.assignmentsByMatchNumber.get(73)).toEqual({
      awayTeamId: "b2",
      matchNumber: 73,
    });
    expect(result.unresolvedSlots).toContainEqual({
      matchNumber: 73,
      side: "home",
    });
  });
});

describe("buildOfficialKnockoutTeamUpdatePlan", () => {
  it("maps LAST_32 rows without match_number to M73-M88 by kickoff order", () => {
    const plan = buildOfficialKnockoutTeamUpdatePlan([
      ...group("A", [
        ["a1", 9],
        ["a2", 6],
        ["a3", 3],
        ["a4", 0],
      ]),
      ...group("B", [
        ["b1", 9],
        ["b2", 6],
        ["b3", 3],
        ["b4", 0],
      ]),
      knockout("round-32-later", null, "2026-06-29T19:00:00.000Z", 8002),
      knockout("round-32-first", null, "2026-06-28T19:00:00.000Z", 8001),
    ]);

    expect(plan.updates).toEqual([
      {
        away_team_id: "b2",
        home_team_id: "a2",
        id: "round-32-first",
      },
    ]);
  });

  it("does not clear existing team ids and keeps partially unresolved matches disabled", () => {
    const plan = buildOfficialKnockoutTeamUpdatePlan([
      ...group("E", [
        ["e1", 9],
        ["e2", 6],
        ["e3", 3],
        ["e4", 0],
      ]),
      {
        ...knockout("m74", 74, "2026-06-29T19:00:00.000Z", 8074),
        away_team_id: null,
        home_team_id: "e1",
      },
    ]);

    expect(plan.updates).toEqual([]);
    expect(plan.stats.knockoutTeamSlotsSkipped).toBeGreaterThan(0);
    expect(
      getMatchEditability({
        away_team_id: null,
        home_team_id: "e1",
        lock_at: "2026-07-01T19:00:00.000Z",
        status: "TIMED",
      }).reason,
    ).toBe("missing_teams");
  });

  it("does not overwrite a non-null team id with a conflicting resolved team", () => {
    const plan = buildOfficialKnockoutTeamUpdatePlan([
      ...group("A", [
        ["a1", 9],
        ["a2", 6],
        ["a3", 3],
        ["a4", 0],
      ]),
      ...group("B", [
        ["b1", 9],
        ["b2", 6],
        ["b3", 3],
        ["b4", 0],
      ]),
      {
        ...knockout("m73", 73, "2026-06-28T19:00:00.000Z", 8073),
        away_team_id: "already-away",
        home_team_id: null,
      },
    ]);

    expect(plan.updates).toEqual([
      {
        home_team_id: "a2",
        id: "m73",
      },
    ]);
    expect(plan.stats.knockoutTeamSlotsResolved).toBe(1);
    expect(plan.stats.knockoutMatchesUnlocked).toBe(0);
  });

  it("marks a match unlocked when the update fills both missing sides", () => {
    const plan = buildOfficialKnockoutTeamUpdatePlan([
      ...group("A", [
        ["a1", 9],
        ["a2", 6],
        ["a3", 3],
        ["a4", 0],
      ]),
      ...group("B", [
        ["b1", 9],
        ["b2", 6],
        ["b3", 3],
        ["b4", 0],
      ]),
      knockout("m73", 73, "2026-06-28T19:00:00.000Z", 8073),
    ]);

    expect(plan.stats.knockoutTeamSlotsResolved).toBe(2);
    expect(plan.stats.knockoutMatchesUnlocked).toBe(1);
  });
});

function group(groupCode: string, standings: Array<[string, number]>) {
  const [first, second, third, fourth] = standings.map(([teamId]) => teamId);

  return [
    match(groupCode, first, second, 1, 0),
    match(groupCode, first, third, 1, 0),
    match(groupCode, first, fourth, 1, 0),
    match(groupCode, second, third, 1, 0),
    match(groupCode, second, fourth, 1, 0),
    match(groupCode, third, fourth, 1, 0),
  ];
}

function lowThirdGroup(groupCode: string) {
  const first = `${groupCode}1`;
  const second = `${groupCode}2`;
  const third = `${groupCode}3`;
  const fourth = `${groupCode}4`;

  return [
    match(groupCode, first, second, 1, 0),
    match(groupCode, first, third, 5, 0),
    match(groupCode, first, fourth, 1, 0),
    match(groupCode, second, third, 5, 0),
    match(groupCode, second, fourth, 1, 0),
    match(groupCode, third, fourth, 1, 0),
  ];
}

function qualifiedThirdGroup(groupCode: string) {
  const first = `${groupCode}1`;
  const second = `${groupCode}2`;
  const third = `${groupCode}3`;
  const fourth = `${groupCode}4`;

  return [
    match(groupCode, first, second, 1, 0),
    match(groupCode, first, third, 1, 0),
    match(groupCode, first, fourth, 1, 0),
    match(groupCode, second, third, 1, 0),
    match(groupCode, second, fourth, 1, 0),
    match(groupCode, third, fourth, 1, 0),
  ];
}

function ambiguousRunnerUpGroup(groupCode: string) {
  return [
    match(groupCode, "a1", "a2", 1, 0),
    match(groupCode, "a1", "a3", 1, 0),
    match(groupCode, "a1", "a4", 1, 0),
    match(groupCode, "a2", "a3", 0, 0),
    match(groupCode, "a2", "a4", 1, 0),
    match(groupCode, "a3", "a4", 1, 0),
  ];
}

function match(
  groupCode: string,
  homeTeamId: string,
  awayTeamId: string,
  homeScore: number,
  awayScore: number,
) {
  return {
    away_score: awayScore,
    away_team_id: awayTeamId,
    football_data_id: Number(`${groupCode.charCodeAt(0)}${homeScore}${awayScore}`),
    group_code: groupCode,
    home_score: homeScore,
    home_team_id: homeTeamId,
    id: `${groupCode}-${homeTeamId}-${awayTeamId}`,
    kickoff_at: "2026-06-20T19:00:00.000Z",
    match_number: null,
    stage: "GROUP_STAGE",
    status: "FINISHED",
  };
}

function knockout(
  id: string,
  matchNumber: number | null,
  kickoffAt: string,
  footballDataId: number,
) {
  return {
    away_score: null,
    away_team_id: null,
    football_data_id: footballDataId,
    group_code: null,
    home_score: null,
    home_team_id: null,
    id,
    kickoff_at: kickoffAt,
    match_number: matchNumber,
    stage: "LAST_32",
    status: "TIMED",
  };
}
