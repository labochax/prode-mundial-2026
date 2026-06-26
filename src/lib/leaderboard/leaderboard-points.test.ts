import { describe, expect, test } from "vitest";

import {
  mergeMiMundialBonusPoints,
  rankLeaderboardByTotalPoints,
} from "@/lib/leaderboard/leaderboard-points";

const baseRows = [
  {
    avatar_kind: "stitch",
    avatar_value: "mate",
    display_name: "Ana",
    exact_hits: 2,
    outcome_hits: 4,
    predicted_matches_count: 8,
    rank: 1,
    total_points: 12,
    user_id: "user-ana",
  },
  {
    avatar_kind: "stitch",
    avatar_value: "pelota",
    display_name: "Bruno",
    exact_hits: 5,
    outcome_hits: 1,
    predicted_matches_count: 8,
    rank: 2,
    total_points: 10,
    user_id: "user-bruno",
  },
  {
    avatar_kind: "stitch",
    avatar_value: "copa",
    display_name: "Carla",
    exact_hits: 1,
    outcome_hits: 6,
    predicted_matches_count: 8,
    rank: 3,
    total_points: 11,
    user_id: "user-carla",
  },
];

describe("mergeMiMundialBonusPoints", () => {
  test("adds Mi Mundial bonus to match points and preserves both values", () => {
    const rows = mergeMiMundialBonusPoints(baseRows, [
      {
        bonus_points: 7,
        user_id: "user-ana",
      },
    ]);

    expect(rows.find((row) => row.user_id === "user-ana")).toMatchObject({
      match_points: 12,
      mi_mundial_bonus_points: 7,
      total_points: 19,
    });
  });

  test("defaults missing Mi Mundial bonus to zero", () => {
    const rows = mergeMiMundialBonusPoints(baseRows, []);

    expect(rows.find((row) => row.user_id === "user-bruno")).toMatchObject({
      match_points: 10,
      mi_mundial_bonus_points: 0,
      total_points: 10,
    });
  });

  test("sorts by total points before existing hit tie-breakers", () => {
    const rows = mergeMiMundialBonusPoints(baseRows, [
      {
        bonus_points: 6,
        user_id: "user-carla",
      },
      {
        bonus_points: 1,
        user_id: "user-bruno",
      },
    ]);

    expect(rows.map((row) => [row.user_id, row.rank, row.total_points])).toEqual([
      ["user-carla", 1, 17],
      ["user-ana", 2, 12],
      ["user-bruno", 3, 11],
    ]);
  });

  test("keeps exact and outcome hits as tie-breakers after total points", () => {
    const rows = mergeMiMundialBonusPoints(
      [
        {
          ...baseRows[0],
          display_name: "Ana",
          exact_hits: 1,
          outcome_hits: 6,
          total_points: 10,
          user_id: "user-ana",
        },
        {
          ...baseRows[1],
          display_name: "Bruno",
          exact_hits: 3,
          outcome_hits: 1,
          total_points: 10,
          user_id: "user-bruno",
        },
      ],
      [],
    );

    expect(rows.map((row) => row.user_id)).toEqual([
      "user-bruno",
      "user-ana",
    ]);
  });
});

describe("rankLeaderboardByTotalPoints", () => {
  test("uses competition ranking when players share total points", () => {
    const rows = rankLeaderboardByTotalPoints([
      rankingRow("user-80", "Alma", 80, 2, 2, 8),
      rankingRow("user-70", "Beto", 70, 2, 2, 8),
      rankingRow("user-52-a", "Carla", 52, 1, 8, 9),
      rankingRow("user-52-b", "Dario", 52, 5, 1, 9),
      rankingRow("user-40", "Elena", 40, 1, 1, 8),
    ]);

    expect(rows.map((row) => [row.user_id, row.rank])).toEqual([
      ["user-80", 1],
      ["user-70", 2],
      ["user-52-b", 3],
      ["user-52-a", 3],
      ["user-40", 5],
    ]);
  });

  test("keeps deterministic tie-break ordering without changing the shared rank", () => {
    const rows = rankLeaderboardByTotalPoints([
      rankingRow("user-ana", "Ana", 52, 1, 9, 9),
      rankingRow("user-bruno", "Bruno", 52, 3, 1, 9),
    ]);

    expect(rows.map((row) => [row.user_id, row.rank])).toEqual([
      ["user-bruno", 1],
      ["user-ana", 1],
    ]);
  });

  test("preserves bonus breakdown when ranking a filtered group", () => {
    const rows = mergeMiMundialBonusPoints(baseRows, [
      {
        bonus_points: 3,
        user_id: "user-bruno",
      },
    ]);

    const filteredRows = rankLeaderboardByTotalPoints(
      rows.filter((row) => row.user_id !== "user-ana"),
    );

    expect(filteredRows).toMatchObject([
      {
        match_points: 10,
        mi_mundial_bonus_points: 3,
        rank: 1,
        total_points: 13,
        user_id: "user-bruno",
      },
      {
        match_points: 11,
        mi_mundial_bonus_points: 0,
        rank: 2,
        total_points: 11,
        user_id: "user-carla",
      },
    ]);
  });
});

function rankingRow(
  userId: string,
  displayName: string,
  totalPoints: number,
  exactHits: number,
  outcomeHits: number,
  predictedMatchesCount: number,
) {
  return {
    avatar_kind: "stitch",
    avatar_value: null,
    display_name: displayName,
    exact_hits: exactHits,
    match_points: totalPoints,
    mi_mundial_bonus_points: 0,
    outcome_hits: outcomeHits,
    predicted_matches_count: predictedMatchesCount,
    rank: 0,
    total_points: totalPoints,
    user_id: userId,
  };
}
