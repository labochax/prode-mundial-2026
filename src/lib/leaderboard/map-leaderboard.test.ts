import { describe, expect, it } from "vitest";

import {
  mapPoolLeaderboardRows,
} from "@/lib/leaderboard/map-leaderboard";
import { rankLeaderboardPlayersByTotalPoints } from "@/lib/leaderboard/leaderboard-points";
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

  it("falls back to five neutral markers when no recent marker map exists", () => {
    const [player] = mapPoolLeaderboardRows([row], "user-bocha");

    expect(player.lastFive).toEqual([
      "empty",
      "empty",
      "empty",
      "empty",
      "empty",
    ]);
  });
});

describe("rankLeaderboardPlayersByTotalPoints", () => {
  it("uses competition ranks while keeping stable tie-break order", () => {
    const players = rankLeaderboardPlayersByTotalPoints([
      player("user-ana", "Ana", 52, 1, 4, 8),
      player("user-bruno", "Bruno", 52, 3, 1, 8),
      player("user-carla", "Carla", 40, 1, 1, 8),
    ]);

    expect(players.map((player) => [player.id, player.rank])).toEqual([
      ["user-bruno", 1],
      ["user-ana", 1],
      ["user-carla", 3],
    ]);
  });
});

function player(
  id: string,
  name: string,
  totalPoints: number,
  exactHits: number,
  outcomeHits: number,
  predictedMatchesCount: number,
) {
  return {
    avatar: {
      alt: "Avatar",
      height: 64,
      kind: "stitch" as const,
      src: "/stitch/avatars/messi.png",
      width: 64,
    },
    exactHits,
    groupName: "Prode Mundial 2026",
    groups: {
      age: null,
      city: null,
      country: null,
      favoriteTeam: null,
      province: null,
      school: null,
      subgroups: [],
    },
    id,
    lastFive: ["empty", "empty", "empty", "empty", "empty"] as const,
    matchPoints: totalPoints,
    miMundialBonusPoints: 0,
    name,
    outcomeHits,
    predictedMatchesCount,
    rank: 0,
    totalPoints,
    trend: { direction: "same" as const, value: 0 },
  };
}
