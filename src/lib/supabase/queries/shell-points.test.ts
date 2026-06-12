import { describe, expect, it } from "vitest";

import { calculateShellTotalPoints } from "@/lib/supabase/queries/shell-points";

describe("calculateShellTotalPoints", () => {
  it("adds match points and Mi Mundial bonus using leaderboard semantics", () => {
    expect(
      calculateShellTotalPoints(
        [{ points: 3 }, { points: 1 }, { points: null }],
        10,
      ),
    ).toBe(14);
  });

  it("defaults missing or invalid points to zero", () => {
    expect(calculateShellTotalPoints([], null)).toBe(0);
    expect(calculateShellTotalPoints([{ points: null }], undefined)).toBe(0);
  });
});
