import { describe, expect, it } from "vitest";

import { isTournamentPredictionPublicByTime } from "@/lib/tournament/tournament-prediction-visibility";

describe("isTournamentPredictionPublicByTime", () => {
  it("matches the RLS time condition after lock", () => {
    expect(
      isTournamentPredictionPublicByTime(
        "2026-06-11T12:00:00.000Z",
        new Date("2026-06-11T12:00:00.000Z").getTime(),
      ),
    ).toBe(true);
  });

  it("keeps other predictions private before lock", () => {
    expect(
      isTournamentPredictionPublicByTime(
        "2026-06-11T12:00:00.000Z",
        new Date("2026-06-11T11:59:59.000Z").getTime(),
      ),
    ).toBe(false);
  });

  it("returns false without a valid lock time", () => {
    expect(isTournamentPredictionPublicByTime(null, 0)).toBe(false);
  });
});
