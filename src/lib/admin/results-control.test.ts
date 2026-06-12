import { describe, expect, it } from "vitest";

import {
  AdminResultValidationError,
  finalizeAdminMatchResult,
  getOfficialWinner,
  parseManualResultInput,
  selectAdminResultMatches,
} from "@/lib/admin/results-control";

describe("admin results control", () => {
  it.each([
    [2, 0, "HOME_TEAM"],
    [0, 2, "AWAY_TEAM"],
    [1, 1, "DRAW"],
  ] as const)(
    "computes the official winner for %i-%i",
    (homeScore, awayScore, winner) => {
      expect(getOfficialWinner(homeScore, awayScore)).toBe(winner);
    },
  );

  it("rejects negative and non-integer scores", () => {
    expect(() =>
      parseManualResultInput({
        away_score: "0",
        home_score: "-1",
        match_id: "00000000-0000-4000-8000-000000000001",
      }),
    ).toThrow(AdminResultValidationError);

    expect(() =>
      parseManualResultInput({
        away_score: "0",
        home_score: "1.5",
        match_id: "00000000-0000-4000-8000-000000000001",
      }),
    ).toThrow(AdminResultValidationError);
  });

  it("rejects manual finalization when either team is missing", async () => {
    await expect(
      finalizeAdminMatchResult({
        input: {
          awayScore: 0,
          homeScore: 2,
          matchId: "match-1",
        },
        match: {
          away_team_id: null,
          home_team_id: "team-home",
          id: "match-1",
        },
        now: new Date("2026-06-11T12:00:00.000Z"),
        scorePredictions: async () => 0,
        updateMatch: async () => undefined,
      }),
    ).rejects.toThrow("equipos oficiales");
  });

  it("updates the match and scores predictions through the provided operations", async () => {
    const updates: unknown[] = [];
    const scoringCalls: string[] = [];

    const result = await finalizeAdminMatchResult({
      input: {
        awayScore: 0,
        homeScore: 2,
        matchId: "match-1",
      },
      match: {
        away_team_id: "team-away",
        home_team_id: "team-home",
        id: "match-1",
      },
      now: new Date("2026-06-11T12:00:00.000Z"),
      scorePredictions: async (matchId) => {
        scoringCalls.push(matchId);
        return 7;
      },
      updateMatch: async (matchId, patch) => {
        updates.push({ matchId, patch });
      },
    });

    expect(updates).toEqual([
      {
        matchId: "match-1",
        patch: {
          away_score: 0,
          home_score: 2,
          last_synced_at: "2026-06-11T12:00:00.000Z",
          status: "FINISHED",
          updated_at: "2026-06-11T12:00:00.000Z",
          winner: "HOME_TEAM",
        },
      },
    ]);
    expect(scoringCalls).toEqual(["match-1"]);
    expect(result).toEqual({
      awayScore: 0,
      homeScore: 2,
      predictionsScored: 7,
      winner: "HOME_TEAM",
    });
  });

  it("selects recent matches plus every overdue unfinished match", () => {
    const now = new Date("2026-06-11T12:00:00.000Z");
    const matches = [
      {
        id: "recent-finished",
        kickoff_at: "2026-06-10T12:00:00.000Z",
        match_number: 1,
        status: "FINISHED",
      },
      {
        id: "old-finished",
        kickoff_at: "2026-06-08T12:00:00.000Z",
        match_number: 2,
        status: "FINISHED",
      },
      {
        id: "old-overdue",
        kickoff_at: "2026-06-08T12:00:00.000Z",
        match_number: 3,
        status: "TIMED",
      },
      {
        id: "near-future",
        kickoff_at: "2026-06-11T16:00:00.000Z",
        match_number: 4,
        status: "TIMED",
      },
      {
        id: "far-future",
        kickoff_at: "2026-06-12T12:00:00.000Z",
        match_number: 5,
        status: "TIMED",
      },
    ];

    expect(selectAdminResultMatches(matches, now).map((match) => match.id)).toEqual([
      "old-overdue",
      "recent-finished",
      "near-future",
    ]);
  });
});
