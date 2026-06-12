import { describe, expect, it } from "vitest";

import { findCurrentUserStanding } from "@/lib/supabase/queries/shell-standing";

describe("findCurrentUserStanding", () => {
  it("returns the current user's total points and global rank", () => {
    expect(
      findCurrentUserStanding(
        [
          { rank: 1, total_points: 42, user_id: "user-2" },
          { rank: 2, total_points: 33, user_id: "user-1" },
        ],
        "user-1",
      ),
    ).toEqual({ rank: 2, totalPoints: 33 });
  });

  it("falls back to zero points without a rank when the user is absent", () => {
    expect(findCurrentUserStanding([], "user-1")).toEqual({
      rank: null,
      totalPoints: 0,
    });
  });
});
