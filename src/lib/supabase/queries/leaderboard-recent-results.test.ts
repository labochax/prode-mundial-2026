import { describe, expect, it } from "vitest";

import {
  buildRecentResultMarkersByUser,
  mapPredictionPointsToResultMarker,
} from "@/lib/supabase/queries/leaderboard-recent-results";

describe("mapPredictionPointsToResultMarker", () => {
  it.each([
    [3, "exact"],
    [1, "outcome"],
    [0, "miss"],
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

  it("fills missing slots with misses", () => {
    const result = buildRecentResultMarkersByUser([
      prediction("user-1", 3, "2026-06-12T12:00:00.000Z", 1),
    ]);

    expect(result.get("user-1")).toEqual([
      "exact",
      "miss",
      "miss",
      "miss",
      "miss",
    ]);
  });
});

function prediction(
  userId: string,
  points: 0 | 1 | 3,
  kickoffAt: string,
  matchNumber: number,
) {
  return {
    matches: {
      kickoff_at: kickoffAt,
      match_number: matchNumber,
    },
    points,
    user_id: userId,
  };
}
