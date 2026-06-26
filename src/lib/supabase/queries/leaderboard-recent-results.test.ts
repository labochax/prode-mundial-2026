import { describe, expect, it } from "vitest";

import {
  buildLeaderboardRecentResults,
  buildRecentResultMarkersByUser,
  mapPredictionPointsToResultMarker,
} from "@/lib/supabase/queries/leaderboard-recent-results";

describe("mapPredictionPointsToResultMarker", () => {
  it.each([
    [3, "exact"],
    [1, "outcome"],
    [0, "miss"],
    [null, "empty"],
  ] as const)("maps %i points to %s", (points, marker) => {
    expect(mapPredictionPointsToResultMarker(points)).toBe(marker);
  });
});

describe("buildRecentResultMarkersByUser", () => {
  it("orders real scored predictions by kickoff desc then match number desc and limits to five", () => {
    const result = buildRecentResultMarkersByUser([
      prediction("user-1", 0, "2026-06-10T12:00:00.000Z", 1),
      prediction("user-1", 1, "2026-06-12T12:00:00.000Z", 2),
      prediction("user-1", 3, "2026-06-12T12:00:00.000Z", 4),
      prediction("user-1", 0, "2026-06-11T12:00:00.000Z", 3),
      prediction("user-1", 1, "2026-06-09T12:00:00.000Z", 5),
      prediction("user-1", 3, "2026-06-08T12:00:00.000Z", 6),
    ]);

    expect(result.get("user-1")).toEqual([
      "exact",
      "outcome",
      "miss",
      "miss",
      "outcome",
    ]);
  });

  it("fills missing slots with neutral markers", () => {
    const result = buildRecentResultMarkersByUser([
      prediction("user-1", 3, "2026-06-12T12:00:00.000Z", 1),
    ]);

    expect(result.get("user-1")).toEqual([
      "exact",
      "empty",
      "empty",
      "empty",
      "empty",
    ]);
  });

  it("only uses scored predictions from finished matches", () => {
    const result = buildRecentResultMarkersByUser([
      prediction("user-1", 3, "2026-06-12T12:00:00.000Z", 1),
      prediction("user-1", null, "2026-06-13T12:00:00.000Z", 2),
      prediction("user-1", 0, "2026-06-14T12:00:00.000Z", 3, "TIMED"),
    ]);

    expect(result.get("user-1")).toEqual([
      "exact",
      "empty",
      "empty",
      "empty",
      "empty",
    ]);
  });
});

describe("buildLeaderboardRecentResults", () => {
  it("collects points from the latest scored match for rank trend", () => {
    const result = buildLeaderboardRecentResults([
      prediction("user-1", 3, "2026-06-11T12:00:00.000Z", 1, "FINISHED", "match-1"),
      prediction("user-1", 1, "2026-06-12T12:00:00.000Z", 2, "FINISHED", "match-2"),
      prediction("user-2", 0, "2026-06-12T12:00:00.000Z", 2, "FINISHED", "match-2"),
    ]);

    expect(result.latestScoredMatchPointsByUserId).toEqual(
      new Map([
        ["user-1", 1],
        ["user-2", 0],
      ]),
    );
  });
});

function prediction(
  userId: string,
  points: 0 | 1 | 3 | null,
  kickoffAt: string,
  matchNumber: number,
  status: "FINISHED" | "TIMED" = "FINISHED",
  matchId = `match-${matchNumber}`,
) {
  return {
    matches: {
      id: matchId,
      kickoff_at: kickoffAt,
      match_number: matchNumber,
      status,
    },
    points,
    user_id: userId,
  };
}
