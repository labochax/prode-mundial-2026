import { describe, expect, it } from "vitest";

import { calculateProvisionalPredictionPoints } from "@/lib/scoring/provisional-points";

describe("calculateProvisionalPredictionPoints", () => {
  it("awards exact points for a 1-1 Prode score decided later by penalties", () => {
    expect(
      calculateProvisionalPredictionPoints({
        actual: { away: 1, home: 1 },
        prediction: { away: 1, home: 1 },
        status: "FINISHED",
      }),
    ).toEqual({
      points: 3,
      provisional: false,
    });
  });

  it("does not award outcome points for a home win prediction when the Prode score is a draw", () => {
    expect(
      calculateProvisionalPredictionPoints({
        actual: { away: 1, home: 1 },
        prediction: { away: 0, home: 1 },
        status: "FINISHED",
      }),
    ).toEqual({
      points: 0,
      provisional: false,
    });
  });
});
