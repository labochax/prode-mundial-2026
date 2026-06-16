import { describe, expect, it } from "vitest";

import { mapPoolLeaderboardRows } from "@/lib/leaderboard/map-leaderboard";
import type { LeaderboardResultMarker } from "@/lib/leaderboard/leaderboard-types";
import type { PoolLeaderboardRow } from "@/lib/supabase/queries/leaderboard";

const row = {
  avatar_kind: "stitch",
  avatar_value: "mate",
  display_name: "Bocha",
  exact_hits: 1,
  match_points: 7,
  mi_mundial_bonus_points: 0,
  outcome_hits: 4,
  predicted_matches_count: 5,
  rank: 1,
  total_points: 7,
  user_id: "user-bocha",
} as PoolLeaderboardRow;

describe("mapPoolLeaderboardRows", () => {
  it("uses real recent markers instead of deriving from aggregate totals", () => {
    const recentMarkers = new Map<string, LeaderboardResultMarker[]>([
      ["user-bocha", ["miss", "miss", "miss", "miss", "outcome"]],
    ]);

    const [player] = mapPoolLeaderboardRows(
      [row],
      "user-bocha",
      new Map(),
      recentMarkers,
    );

    expect(player.lastFive).toEqual([
      "miss",
      "miss",
      "miss",
      "miss",
      "outcome",
    ]);
  });

  it("falls back to five misses when no recent marker map exists", () => {
    const [player] = mapPoolLeaderboardRows([row], "user-bocha");

    expect(player.lastFive).toEqual(["miss", "miss", "miss", "miss", "miss"]);
  });
});
