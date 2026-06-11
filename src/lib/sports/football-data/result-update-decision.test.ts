import { describe, expect, it } from "vitest";

import { getFootballDataResultUpdateDecision } from "@/lib/sports/football-data/result-update-decision";

function existing(
  status: string,
  homeScore: number | null,
  awayScore: number | null,
) {
  return {
    away_score: awayScore,
    home_score: homeScore,
    status,
  };
}

function candidate(
  status:
    | "FINISHED"
    | "IN_PLAY"
    | "SCHEDULED"
    | "TIMED",
  homeScore: number | null,
  awayScore: number | null,
) {
  return {
    away_score: awayScore,
    home_score: homeScore,
    status,
  };
}

describe("getFootballDataResultUpdateDecision", () => {
  it.each(["TIMED", "SCHEDULED"] as const)(
    "protects a locally finalized result from stale %s data",
    (status) => {
      expect(
        getFootballDataResultUpdateDecision(
          existing("FINISHED", 2, 1),
          candidate(status, null, null),
        ),
      ).toEqual({
        reason: "protected-finished-stale",
        shouldApplyUpdate: false,
        shouldScorePredictions: false,
        staleResultsSkipped: 1,
      });
    },
  );

  it("allows a complete official finished result to correct a local final and rescore", () => {
    expect(
      getFootballDataResultUpdateDecision(
        existing("FINISHED", 2, 1),
        candidate("FINISHED", 3, 1),
      ),
    ).toEqual({
      reason: "apply",
      shouldApplyUpdate: true,
      shouldScorePredictions: true,
      staleResultsSkipped: 0,
    });
  });

  it("protects a locally finalized result from an incomplete finished candidate", () => {
    expect(
      getFootballDataResultUpdateDecision(
        existing("FINISHED", 2, 1),
        candidate("FINISHED", null, null),
      ),
    ).toEqual({
      reason: "protected-finished-stale",
      shouldApplyUpdate: false,
      shouldScorePredictions: false,
      staleResultsSkipped: 1,
    });
  });

  it("applies and scores a complete finished result over a timed match", () => {
    expect(
      getFootballDataResultUpdateDecision(
        existing("TIMED", null, null),
        candidate("FINISHED", 1, 0),
      ),
    ).toMatchObject({
      shouldApplyUpdate: true,
      shouldScorePredictions: true,
      staleResultsSkipped: 0,
    });
  });

  it("applies live partial data over a timed match without scoring", () => {
    expect(
      getFootballDataResultUpdateDecision(
        existing("TIMED", null, null),
        candidate("IN_PLAY", 1, 0),
      ),
    ).toMatchObject({
      shouldApplyUpdate: true,
      shouldScorePredictions: false,
      staleResultsSkipped: 0,
    });
  });

  it("protects a live match from scheduled data with null scores", () => {
    expect(
      getFootballDataResultUpdateDecision(
        existing("IN_PLAY", 1, 0),
        candidate("TIMED", null, null),
      ),
    ).toEqual({
      reason: "protected-live-stale",
      shouldApplyUpdate: false,
      shouldScorePredictions: false,
      staleResultsSkipped: 1,
    });
  });
});
