import { describe, expect, it } from "vitest";

import { buildMatchPredictionStats } from "@/lib/matches/match-prediction-stats";

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
