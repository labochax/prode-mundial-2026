import { describe, expect, it } from "vitest";

import {
  buildMatchPredictionStats,
  buildMatchPredictionStatsByMatchIds,
  isMatchPredictionStatsVisible,
} from "@/lib/matches/match-prediction-stats";

describe("buildMatchPredictionStats", () => {
  it("counts home, draw, away and treats saved 0-0 as a draw", () => {
    const stats = buildMatchPredictionStats(
      [
        { predicted_away_score: 0, predicted_home_score: 2 },
        { predicted_away_score: 0, predicted_home_score: 0 },
        { predicted_away_score: 3, predicted_home_score: 1 },
      ],
      { isVisible: true },
    );

    expect(stats.counts).toEqual({ away: 1, draw: 1, home: 1 });
    expect(stats.distribution).toEqual({ away: 33, draw: 33, home: 34 });
    expect(
      stats.distribution &&
        stats.distribution.home +
          stats.distribution.draw +
          stats.distribution.away,
    ).toBe(100);
    expect(stats.status).toBe("available");
  });

  it("sorts the top three exact scorelines by count descending", () => {
    const stats = buildMatchPredictionStats(
      [
        { predicted_away_score: 1, predicted_home_score: 2 },
        { predicted_away_score: 1, predicted_home_score: 2 },
        { predicted_away_score: 0, predicted_home_score: 0 },
        { predicted_away_score: 0, predicted_home_score: 0 },
        { predicted_away_score: 0, predicted_home_score: 0 },
        { predicted_away_score: 0, predicted_home_score: 1 },
        { predicted_away_score: 2, predicted_home_score: 1 },
      ],
      { isVisible: true },
    );

    expect(stats.topScorelines).toEqual([
      { away: 0, count: 3, home: 0 },
      { away: 1, count: 2, home: 2 },
      { away: 0, count: 1, home: 1 },
    ]);
  });

  it("hides distribution and scorelines before lock", () => {
    const stats = buildMatchPredictionStats(
      [
        { predicted_away_score: 0, predicted_home_score: 1 },
        { predicted_away_score: 0, predicted_home_score: 0 },
        { predicted_away_score: 2, predicted_home_score: 1 },
      ],
      { isVisible: false },
    );

    expect(stats).toMatchObject({
      counts: { away: 0, draw: 0, home: 0 },
      distribution: null,
      status: "hidden-until-lock",
      topScorelines: [],
      totalPredictions: null,
    });
  });

  it("returns insufficient after lock when fewer than three predictions exist", () => {
    const stats = buildMatchPredictionStats(
      [
        { predicted_away_score: 0, predicted_home_score: 1 },
        { predicted_away_score: 0, predicted_home_score: 0 },
      ],
      { isVisible: true },
    );

    expect(stats).toMatchObject({
      counts: { away: 0, draw: 1, home: 1 },
      distribution: null,
      status: "insufficient",
      topScorelines: [],
      totalPredictions: 2,
    });
  });
});

describe("buildMatchPredictionStatsByMatchIds", () => {
  it("aggregates multiple matches and treats saved 0-0 as a draw", () => {
    const stats = buildMatchPredictionStatsByMatchIds(
      [
        {
          match_id: "match-1",
          predicted_away_score: 0,
          predicted_home_score: 0,
        },
        {
          match_id: "match-1",
          predicted_away_score: 0,
          predicted_home_score: 2,
        },
        {
          match_id: "match-1",
          predicted_away_score: 2,
          predicted_home_score: 1,
        },
        {
          match_id: "match-2",
          predicted_away_score: 1,
          predicted_home_score: 1,
        },
      ],
      [
        { isVisible: true, matchId: "match-1" },
        { isVisible: true, matchId: "match-2" },
        { isVisible: false, matchId: "match-3" },
      ],
    );

    expect(stats.get("match-1")).toMatchObject({
      counts: { away: 1, draw: 1, home: 1 },
      distribution: { away: 33, draw: 33, home: 34 },
      status: "available",
      totalPredictions: 3,
    });
    expect(stats.get("match-2")).toMatchObject({
      distribution: null,
      status: "insufficient",
      totalPredictions: 1,
    });
    expect(stats.get("match-3")).toMatchObject({
      distribution: null,
      status: "hidden-until-lock",
      totalPredictions: null,
    });
  });
});

describe("isMatchPredictionStatsVisible", () => {
  const futureLock = "2026-06-20T12:00:00.000Z";
  const beforeLock = new Date("2026-06-20T11:00:00.000Z").getTime();

  it("hides a scheduled match before lock", () => {
    expect(
      isMatchPredictionStatsVisible({
        lockAt: futureLock,
        now: beforeLock,
        status: "TIMED",
      }),
    ).toBe(false);
  });

  it.each(["IN_PLAY", "FINISHED"])(
    "reveals a %s match even when lock time is unexpectedly in the future",
    (status) => {
      expect(
        isMatchPredictionStatsVisible({
          lockAt: futureLock,
          now: beforeLock,
          status,
        }),
      ).toBe(true);
    },
  );
});
