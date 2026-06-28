import { describe, expect, it } from "vitest";

import { getMatchEditability } from "@/lib/matches/match-editability";
import {
  buildOfficialKnockoutTeamUpdatePlan,
  resolveOfficialRoundOf32Assignments,
} from "@/lib/tournament/official-knockout-resolver";
import {
  OFFICIAL_KNOCKOUT_ADVANCEMENT_MAP,
  OFFICIAL_ROUND_OF_16_ADVANCEMENT_MAP,
  OFFICIAL_ROUND_OF_32_FIXTURE_MAP,
  type OfficialKnockoutFixtureMapEntry,
} from "@/lib/tournament/official-knockout-fixture-map";

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
  it("does not infer M73-M88 from LAST_32 kickoff order without a trusted fixture map", () => {
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

    expect(plan.updates).toEqual([]);
    expect(plan.stats.knockoutSkippedMissingOfficialFixtureMap).toBe(2);
    expect(plan.stats.knockoutTeamSlotsResolved).toBe(0);
  });

  it("resolves a knockout row only when its Football-Data id has a trusted official slot mapping", () => {
    const fixtureMap: OfficialKnockoutFixtureMapEntry[] = [
      { footballDataId: 8073, matchNumber: 73 },
    ];
    const plan = buildOfficialKnockoutTeamUpdatePlan(
      [
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
        knockout("m73", null, "2026-06-28T19:00:00.000Z", 8073),
      ],
      { fixtureMap },
    );

    expect(plan.updates).toEqual([
      {
        away_team_id: "b2",
        home_team_id: "a2",
        id: "m73",
      },
    ]);
    expect(plan.stats.knockoutMatchesUnlocked).toBe(1);
    expect(plan.stats.knockoutSkippedMissingOfficialFixtureMap).toBe(0);
  });

  it("does not clear existing team ids and keeps partially unresolved matches disabled", () => {
    const fixtureMap: OfficialKnockoutFixtureMapEntry[] = [
      { footballDataId: 8074, matchNumber: 74 },
    ];
    const plan = buildOfficialKnockoutTeamUpdatePlan(
      [
        ...group("E", [
          ["e1", 9],
          ["e2", 6],
          ["e3", 3],
          ["e4", 0],
        ]),
        {
          ...knockout("m74", null, "2026-06-29T19:00:00.000Z", 8074),
          away_team_id: null,
          home_team_id: "e1",
        },
      ],
      { fixtureMap },
    );

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
    const fixtureMap: OfficialKnockoutFixtureMapEntry[] = [
      { footballDataId: 8073, matchNumber: 73 },
    ];
    const plan = buildOfficialKnockoutTeamUpdatePlan(
      [
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
          ...knockout("m73", null, "2026-06-28T19:00:00.000Z", 8073),
          away_team_id: "already-away",
          home_team_id: null,
        },
      ],
      { fixtureMap },
    );

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
    const fixtureMap: OfficialKnockoutFixtureMapEntry[] = [
      { footballDataId: 8073, matchNumber: 73 },
    ];
    const plan = buildOfficialKnockoutTeamUpdatePlan(
      [
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
        knockout("m73", null, "2026-06-28T19:00:00.000Z", 8073),
      ],
      { fixtureMap },
    );

    expect(plan.stats.knockoutTeamSlotsResolved).toBe(2);
    expect(plan.stats.knockoutMatchesUnlocked).toBe(1);
  });

  it("keeps Germany away from Morocco when trusted mapping puts Germany in M74 and Morocco in M75", () => {
    const fixtureMap: OfficialKnockoutFixtureMapEntry[] = [
      { footballDataId: 8074, matchNumber: 74 },
      { footballDataId: 8075, matchNumber: 75 },
    ];
    const plan = buildOfficialKnockoutTeamUpdatePlan(
      [
        ...lowThirdGroup("A"),
        ...lowThirdGroup("B"),
        ...customLowThirdGroup("C", {
          first: "C1",
          second: "morocco",
          third: "C3",
          fourth: "C4",
        }),
        ...lowThirdGroup("D"),
        ...customQualifiedThirdGroup("E", {
          first: "germany",
          second: "E2",
          third: "E3",
          fourth: "E4",
        }),
        ...customQualifiedThirdGroup("F", {
          first: "netherlands",
          second: "F2",
          third: "paraguay",
          fourth: "F4",
        }),
        ...qualifiedThirdGroup("G"),
        ...qualifiedThirdGroup("H"),
        ...qualifiedThirdGroup("I"),
        ...qualifiedThirdGroup("J"),
        ...qualifiedThirdGroup("K"),
        ...qualifiedThirdGroup("L"),
        knockout("m74", null, "2026-06-28T20:00:00.000Z", 8074),
        knockout("m75", null, "2026-06-28T19:00:00.000Z", 8075),
      ],
      { fixtureMap },
    );

    expect(plan.updates).toEqual(
      expect.arrayContaining([
        {
          away_team_id: "paraguay",
          home_team_id: "germany",
          id: "m74",
        },
        {
          away_team_id: "morocco",
          home_team_id: "netherlands",
          id: "m75",
        },
      ]),
    );
    const assignedTeams = plan.updates.flatMap((update) =>
      [update.home_team_id, update.away_team_id].filter(Boolean),
    );
    expect(assignedTeams.filter((teamId) => teamId === "morocco")).toHaveLength(
      1,
    );
  });

  it("does not assign a resolved team that already appears in another Round of 32 match", () => {
    const fixtureMap: OfficialKnockoutFixtureMapEntry[] = [
      { footballDataId: 8075, matchNumber: 75 },
    ];
    const plan = buildOfficialKnockoutTeamUpdatePlan(
      [
        ...customLowThirdGroup("C", {
          first: "C1",
          second: "morocco",
          third: "C3",
          fourth: "C4",
        }),
        ...customQualifiedThirdGroup("F", {
          first: "netherlands",
          second: "F2",
          third: "F3",
          fourth: "F4",
        }),
        {
          ...knockout("bad-existing-morocco", null, "2026-06-28T18:00:00.000Z", 9001),
          home_team_id: "morocco",
        },
        knockout("m75", null, "2026-06-28T19:00:00.000Z", 8075),
      ],
      { fixtureMap },
    );

    expect(plan.updates).toEqual([
      {
        home_team_id: "netherlands",
        id: "m75",
      },
    ]);
    expect(plan.stats.knockoutTeamSlotsSkipped).toBeGreaterThan(0);
  });

  it("applies all 16 verified Round of 32 fixtures when TLA teams exist", () => {
    const plan = buildOfficialKnockoutTeamUpdatePlan(
      OFFICIAL_ROUND_OF_32_FIXTURE_MAP.map((entry) =>
        knockout(
          `fixture-${entry.footballDataId}`,
          null,
          "2026-06-28T19:00:00.000Z",
          entry.footballDataId,
        ),
      ),
      {
        teamIdsByTla: teamIdsByTlaForFixtureMap(),
      },
    );

    expect(plan.updates).toHaveLength(16);
    expect(plan.stats.knockoutMappedFixturesApplied).toBe(16);
    expect(plan.stats.knockoutTeamSlotsResolved).toBe(32);
    expect(plan.stats.knockoutTeamSlotsSkipped).toBe(0);
    expect(plan.stats.knockoutSkippedMissingOfficialFixtureMap).toBe(0);
  });

  it("resolves Germany against Paraguay and Netherlands against Morocco from the verified map", () => {
    const plan = buildOfficialKnockoutTeamUpdatePlan(
      [
        knockout("germany-paraguay", null, "2026-06-29T20:30:00.000Z", 537415),
        knockout("netherlands-morocco", null, "2026-06-30T01:00:00.000Z", 537418),
      ],
      {
        teamIdsByTla: teamIdsByTlaForFixtureMap(),
      },
    );

    expect(plan.updates).toEqual(
      expect.arrayContaining([
        {
          away_team_id: "team-par",
          home_team_id: "team-ger",
          id: "germany-paraguay",
        },
        {
          away_team_id: "team-mar",
          home_team_id: "team-ned",
          id: "netherlands-morocco",
        },
      ]),
    );
  });

  it("does not assign Morocco to more than one verified Round of 32 fixture", () => {
    const plan = buildOfficialKnockoutTeamUpdatePlan(
      OFFICIAL_ROUND_OF_32_FIXTURE_MAP.map((entry) =>
        knockout(
          `fixture-${entry.footballDataId}`,
          null,
          "2026-06-28T19:00:00.000Z",
          entry.footballDataId,
        ),
      ),
      {
        teamIdsByTla: teamIdsByTlaForFixtureMap(),
      },
    );
    const assignedTeamIds = plan.updates.flatMap((update) =>
      [update.home_team_id, update.away_team_id].filter(Boolean),
    );

    expect(assignedTeamIds.filter((teamId) => teamId === "team-mar")).toHaveLength(
      1,
    );
    expect(new Set(assignedTeamIds)).toHaveLength(assignedTeamIds.length);
  });

  it("corrects wrong existing teams only for a fixture in the verified map", () => {
    const plan = buildOfficialKnockoutTeamUpdatePlan(
      [
        {
          ...knockout("germany-paraguay", null, "2026-06-29T20:30:00.000Z", 537415),
          away_team_id: "team-mar",
          home_team_id: "team-ger",
        },
      ],
      {
        teamIdsByTla: teamIdsByTlaForFixtureMap(),
      },
    );

    expect(plan.updates).toEqual([
      {
        away_team_id: "team-par",
        id: "germany-paraguay",
      },
    ]);
    expect(plan.stats.knockoutMappedFixturesCorrected).toBe(1);
  });

  it("skips a mapped fixture safely when a local TLA cannot be resolved", () => {
    const teamIdsByTla = teamIdsByTlaForFixtureMap();
    teamIdsByTla.delete("PAR");
    const plan = buildOfficialKnockoutTeamUpdatePlan(
      [
        knockout("germany-paraguay", null, "2026-06-29T20:30:00.000Z", 537415),
      ],
      {
        teamIdsByTla,
      },
    );

    expect(plan.updates).toEqual([]);
    expect(plan.stats.knockoutMappedFixturesSkippedMissingTeam).toBe(1);
    expect(plan.stats.knockoutTeamSlotsResolved).toBe(0);
  });

  it("populates M90 from winners of M73 and M75", () => {
    const plan = buildOfficialKnockoutTeamUpdatePlan([
      finishedKnockout("m73", 73, 537417, "team-rsa", "team-can", "HOME_TEAM"),
      finishedKnockout("m75", 75, 537418, "team-ned", "team-mar", "AWAY_TEAM"),
      last16("m90", null, "2026-07-04T19:00:00.000Z", 537376),
    ]);

    expect(plan.updates).toEqual([
      {
        away_team_id: "team-mar",
        home_team_id: "team-rsa",
        id: "m90",
      },
    ]);
    expect(plan.stats.roundOf16TeamSlotsResolved).toBe(2);
    expect(plan.stats.roundOf16MatchesUnlocked).toBe(1);
    expect(
      getMatchEditability({
        away_team_id: "team-mar",
        home_team_id: "team-rsa",
        lock_at: "2026-07-04T19:00:00.000Z",
        status: "TIMED",
      }).canEdit,
    ).toBe(true);
  });

  it("populates one M90 side when only M73 has a finished winner", () => {
    const plan = buildOfficialKnockoutTeamUpdatePlan([
      finishedKnockout("m73", 73, 537417, "team-rsa", "team-can", "AWAY_TEAM"),
      knockout("m75", null, "2026-06-30T01:00:00.000Z", 537418),
      last16("m90", null, "2026-07-04T19:00:00.000Z", 537376),
    ]);

    expect(plan.updates).toEqual([
      {
        home_team_id: "team-can",
        id: "m90",
      },
    ]);
    expect(plan.stats.roundOf16TeamSlotsResolved).toBe(1);
    expect(plan.stats.roundOf16MatchesUnlocked).toBe(0);
    expect(
      getMatchEditability({
        away_team_id: null,
        home_team_id: "team-can",
        lock_at: "2026-07-04T19:00:00.000Z",
        status: "TIMED",
      }).reason,
    ).toBe("missing_teams");
  });

  it("does not populate a Round of 16 side from a tied source without an official winner", () => {
    const plan = buildOfficialKnockoutTeamUpdatePlan([
      {
        ...finishedKnockout("m73", 73, 537417, "team-rsa", "team-can", null),
        away_score: 1,
        home_score: 1,
      },
      finishedKnockout("m75", 75, 537418, "team-ned", "team-mar", "HOME_TEAM"),
      last16("m90", null, "2026-07-04T19:00:00.000Z", 537376),
    ]);

    expect(plan.updates).toEqual([
      {
        away_team_id: "team-ned",
        id: "m90",
      },
    ]);
    expect(plan.stats.roundOf16SkippedWaitingForSourceWinner).toBe(1);
  });

  it("respects official winner over score direction for a penalty-style source winner", () => {
    const plan = buildOfficialKnockoutTeamUpdatePlan([
      {
        ...finishedKnockout("m73", 73, 537417, "team-rsa", "team-can", "AWAY_TEAM"),
        away_score: 1,
        home_score: 2,
      },
      finishedKnockout("m75", 75, 537418, "team-ned", "team-mar", "HOME_TEAM"),
      last16("m90", null, "2026-07-04T19:00:00.000Z", 537376),
    ]);

    expect(plan.updates).toEqual([
      {
        away_team_id: "team-ned",
        home_team_id: "team-can",
        id: "m90",
      },
    ]);
  });

  it("corrects a wrong existing mapped Round of 16 side", () => {
    const plan = buildOfficialKnockoutTeamUpdatePlan([
      finishedKnockout("m73", 73, 537417, "team-rsa", "team-can", "HOME_TEAM"),
      finishedKnockout("m75", 75, 537418, "team-ned", "team-mar", "AWAY_TEAM"),
      {
        ...last16("m90", null, "2026-07-04T19:00:00.000Z", 537376),
        away_team_id: "wrong-away",
        home_team_id: "team-rsa",
      },
    ]);

    expect(plan.updates).toEqual([
      {
        away_team_id: "team-mar",
        id: "m90",
      },
    ]);
    expect(plan.stats.roundOf16MappedFixturesCorrected).toBe(1);
  });

  it("skips a Round of 16 target without a trusted target fixture map", () => {
    const plan = buildOfficialKnockoutTeamUpdatePlan(
      [
        finishedKnockout("m73", 73, 537417, "team-rsa", "team-can", "HOME_TEAM"),
        finishedKnockout("m75", 75, 537418, "team-ned", "team-mar", "HOME_TEAM"),
        last16("unmapped-last-16", null, "2026-07-04T19:00:00.000Z", 999999),
      ],
      {
        roundOf16Map: OFFICIAL_ROUND_OF_16_ADVANCEMENT_MAP.filter(
          (entry) => entry.targetFootballDataId !== 999999,
        ),
      },
    );

    expect(plan.updates).toEqual([]);
    expect(plan.stats.roundOf16SkippedMissingTargetFixtureMap).toBe(1);
  });

  it("populates M97 from winners of M89 and M90", () => {
    const plan = buildOfficialKnockoutTeamUpdatePlan([
      finishedKnockout("m89", 89, 537375, "team-ger", "team-fra", "HOME_TEAM", "LAST_16"),
      finishedKnockout("m90", 90, 537376, "team-rsa", "team-mar", "AWAY_TEAM", "LAST_16"),
      knockoutStage("m97", null, "2026-07-09T19:00:00.000Z", 537383, "QUARTER_FINALS"),
    ]);

    expect(plan.updates).toEqual([
      {
        away_team_id: "team-mar",
        home_team_id: "team-ger",
        id: "m97",
      },
    ]);
    expect(plan.stats.knockoutAdvancementTeamSlotsResolved).toBe(2);
    expect(plan.stats.knockoutAdvancementMatchesUnlocked).toBe(1);
  });

  it("populates M98 from winners of M91 and M92", () => {
    const plan = buildOfficialKnockoutTeamUpdatePlan([
      finishedKnockout("m91", 91, 537377, "team-bra", "team-civ", "AWAY_TEAM", "LAST_16"),
      finishedKnockout("m92", 92, 537378, "team-mex", "team-eng", "HOME_TEAM", "LAST_16"),
      knockoutStage("m98", null, "2026-07-10T19:00:00.000Z", 537384, "QUARTER_FINALS"),
    ]);

    expect(plan.updates).toEqual([
      {
        away_team_id: "team-mex",
        home_team_id: "team-civ",
        id: "m98",
      },
    ]);
  });

  it("populates M101 and M102 from quarterfinal winners", () => {
    const plan = buildOfficialKnockoutTeamUpdatePlan([
      finishedKnockout("m97", 97, 537383, "team-ger", "team-mar", "HOME_TEAM", "QUARTER_FINALS"),
      finishedKnockout("m98", 98, 537384, "team-civ", "team-mex", "AWAY_TEAM", "QUARTER_FINALS"),
      finishedKnockout("m99", 99, 537385, "team-por", "team-bel", "AWAY_TEAM", "QUARTER_FINALS"),
      finishedKnockout("m100", 100, 537386, "team-arg", "team-sui", "HOME_TEAM", "QUARTER_FINALS"),
      knockoutStage("m101", null, "2026-07-14T19:00:00.000Z", 537387, "SEMI_FINALS"),
      knockoutStage("m102", null, "2026-07-15T19:00:00.000Z", 537388, "SEMI_FINALS"),
    ]);

    expect(plan.updates).toEqual(
      expect.arrayContaining([
        {
          away_team_id: "team-mex",
          home_team_id: "team-ger",
          id: "m101",
        },
        {
          away_team_id: "team-arg",
          home_team_id: "team-bel",
          id: "m102",
        },
      ]),
    );
  });

  it("populates Final from semifinal winners and Third Place from semifinal losers", () => {
    const plan = buildOfficialKnockoutTeamUpdatePlan([
      finishedKnockout("m101", 101, 537387, "team-ger", "team-mex", "HOME_TEAM", "SEMI_FINALS"),
      finishedKnockout("m102", 102, 537388, "team-bel", "team-arg", "AWAY_TEAM", "SEMI_FINALS"),
      knockoutStage("third-place", null, "2026-07-18T19:00:00.000Z", 537389, "THIRD_PLACE"),
      knockoutStage("final", null, "2026-07-19T19:00:00.000Z", 537390, "FINAL"),
    ]);

    expect(plan.updates).toEqual(
      expect.arrayContaining([
        {
          away_team_id: "team-bel",
          home_team_id: "team-mex",
          id: "third-place",
        },
        {
          away_team_id: "team-arg",
          home_team_id: "team-ger",
          id: "final",
        },
      ]),
    );
  });

  it("fills only one later-round side when only one source is finished", () => {
    const plan = buildOfficialKnockoutTeamUpdatePlan([
      finishedKnockout("m89", 89, 537375, "team-ger", "team-fra", "HOME_TEAM", "LAST_16"),
      knockoutStage("m90", null, "2026-07-04T19:00:00.000Z", 537376, "LAST_16"),
      knockoutStage("m97", null, "2026-07-09T19:00:00.000Z", 537383, "QUARTER_FINALS"),
    ]);

    expect(plan.updates).toEqual([
      {
        home_team_id: "team-ger",
        id: "m97",
      },
    ]);
    expect(plan.stats.knockoutAdvancementSkippedWaitingForSourceResult).toBe(1);
  });

  it("does not fill a later-round side from a tied source without official winner", () => {
    const plan = buildOfficialKnockoutTeamUpdatePlan([
      {
        ...finishedKnockout("m89", 89, 537375, "team-ger", "team-fra", null, "LAST_16"),
        away_score: 1,
        home_score: 1,
      },
      knockoutStage("m97", null, "2026-07-09T19:00:00.000Z", 537383, "QUARTER_FINALS"),
    ]);

    expect(plan.updates).toEqual([]);
    expect(plan.stats.knockoutAdvancementSkippedWaitingForSourceResult).toBe(1);
  });

  it("respects official winner over score direction in later rounds", () => {
    const plan = buildOfficialKnockoutTeamUpdatePlan([
      {
        ...finishedKnockout("m89", 89, 537375, "team-ger", "team-fra", "AWAY_TEAM", "LAST_16"),
        away_score: 1,
        home_score: 2,
      },
      knockoutStage("m90", null, "2026-07-04T19:00:00.000Z", 537376, "LAST_16"),
      knockoutStage("m97", null, "2026-07-09T19:00:00.000Z", 537383, "QUARTER_FINALS"),
    ]);

    expect(plan.updates).toEqual([
      {
        home_team_id: "team-fra",
        id: "m97",
      },
    ]);
  });

  it("corrects a wrong existing mapped later-round side and leaves correct side unchanged", () => {
    const plan = buildOfficialKnockoutTeamUpdatePlan([
      finishedKnockout("m89", 89, 537375, "team-ger", "team-fra", "HOME_TEAM", "LAST_16"),
      finishedKnockout("m90", 90, 537376, "team-rsa", "team-mar", "AWAY_TEAM", "LAST_16"),
      {
        ...knockoutStage("m97", null, "2026-07-09T19:00:00.000Z", 537383, "QUARTER_FINALS"),
        away_team_id: "wrong-away",
        home_team_id: "team-ger",
      },
    ]);

    expect(plan.updates).toEqual([
      {
        away_team_id: "team-mar",
        id: "m97",
      },
    ]);
    expect(plan.stats.knockoutAdvancementMappedFixturesCorrected).toBe(1);
  });

  it("does not assign the same team twice in a target round", () => {
    const plan = buildOfficialKnockoutTeamUpdatePlan([
      finishedKnockout("m89", 89, 537375, "team-ger", "team-fra", "HOME_TEAM", "LAST_16"),
      finishedKnockout("m90", 90, 537376, "team-rsa", "team-mar", "AWAY_TEAM", "LAST_16"),
      finishedKnockout("m91", 91, 537377, "team-mar", "team-civ", "HOME_TEAM", "LAST_16"),
      finishedKnockout("m92", 92, 537378, "team-mex", "team-eng", "HOME_TEAM", "LAST_16"),
      knockoutStage("m97", null, "2026-07-09T19:00:00.000Z", 537383, "QUARTER_FINALS"),
      knockoutStage("m98", null, "2026-07-10T19:00:00.000Z", 537384, "QUARTER_FINALS"),
    ]);
    const assignedTeams = plan.updates.flatMap((update) =>
      [update.home_team_id, update.away_team_id].filter(Boolean),
    );

    expect(assignedTeams.filter((teamId) => teamId === "team-mar")).toHaveLength(
      1,
    );
  });

  it("skips a later-round target without a trusted fixture map", () => {
    const plan = buildOfficialKnockoutTeamUpdatePlan(
      [
        finishedKnockout("m89", 89, 537375, "team-ger", "team-fra", "HOME_TEAM", "LAST_16"),
        finishedKnockout("m90", 90, 537376, "team-rsa", "team-mar", "HOME_TEAM", "LAST_16"),
        knockoutStage("unmapped-quarter", null, "2026-07-09T19:00:00.000Z", 999998, "QUARTER_FINALS"),
      ],
      {
        advancementMap: OFFICIAL_KNOCKOUT_ADVANCEMENT_MAP.filter(
          (entry) => entry.targetFootballDataId !== 999998,
        ),
      },
    );

    expect(plan.updates).toEqual([]);
    expect(plan.stats.knockoutAdvancementSkippedMissingTargetFixture).toBe(1);
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

function customQualifiedThirdGroup(
  groupCode: string,
  teams: {
    first: string;
    fourth: string;
    second: string;
    third: string;
  },
) {
  const { first, fourth, second, third } = teams;

  return [
    match(groupCode, first, second, 1, 0),
    match(groupCode, first, third, 1, 0),
    match(groupCode, first, fourth, 1, 0),
    match(groupCode, second, third, 1, 0),
    match(groupCode, second, fourth, 1, 0),
    match(groupCode, third, fourth, 1, 0),
  ];
}

function customLowThirdGroup(
  groupCode: string,
  teams: {
    first: string;
    fourth: string;
    second: string;
    third: string;
  },
) {
  const { first, fourth, second, third } = teams;

  return [
    match(groupCode, first, second, 1, 0),
    match(groupCode, first, third, 5, 0),
    match(groupCode, first, fourth, 1, 0),
    match(groupCode, second, third, 5, 0),
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
    winner: null,
  };
}

function finishedKnockout(
  id: string,
  matchNumber: number,
  footballDataId: number,
  homeTeamId: string,
  awayTeamId: string,
  winner: "AWAY_TEAM" | "HOME_TEAM" | null,
  stage = "LAST_32",
) {
  return {
    ...knockout(id, matchNumber, "2026-06-28T19:00:00.000Z", footballDataId),
    away_score: winner === "AWAY_TEAM" ? 2 : 0,
    away_team_id: awayTeamId,
    home_score: winner === "HOME_TEAM" ? 2 : 0,
    home_team_id: homeTeamId,
    stage,
    status: "FINISHED",
    winner,
  };
}

function knockoutStage(
  id: string,
  matchNumber: number | null,
  kickoffAt: string,
  footballDataId: number,
  stage: string,
) {
  return {
    ...knockout(id, matchNumber, kickoffAt, footballDataId),
    stage,
  };
}

function last16(
  id: string,
  matchNumber: number | null,
  kickoffAt: string,
  footballDataId: number,
) {
  return {
    ...knockout(id, matchNumber, kickoffAt, footballDataId),
    stage: "LAST_16",
  };
}

function teamIdsByTlaForFixtureMap() {
  return new Map(
    OFFICIAL_ROUND_OF_32_FIXTURE_MAP.flatMap((entry) => [
      [entry.homeTla, `team-${entry.homeTla.toLowerCase()}`] as const,
      [entry.awayTla, `team-${entry.awayTla.toLowerCase()}`] as const,
    ]),
  );
}
