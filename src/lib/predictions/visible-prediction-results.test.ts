import { describe, expect, it } from "vitest";

import {
  comparePredictionMatchesByMostRecent,
  getPredictionResultMarker,
} from "@/lib/predictions/visible-prediction-results";

describe("getPredictionResultMarker", () => {
  it.each([
    [3, "exact"],
    [1, "outcome"],
    [0, "miss"],
    [null, "empty"],
  ] as const)("maps %s points to %s", (points, marker) => {
    expect(getPredictionResultMarker(points)).toBe(marker);
  });
});

describe("comparePredictionMatchesByMostRecent", () => {
  it("orders the newest matches first and keeps missing kickoff values last", () => {
    const matches = [
      match("without-kickoff", null, 3),
      match("oldest", "2026-06-10T12:00:00.000Z", 1),
      match("newest", "2026-06-12T12:00:00.000Z", 2),
    ];

    expect(
      matches.sort(comparePredictionMatchesByMostRecent).map((match) => match.id),
    ).toEqual(["newest", "oldest", "without-kickoff"]);
  });
});

function match(id: string, kickoffAt: string | null, matchNumber: number) {
  return {
    id,
    kickoff_at: kickoffAt,
    match_number: matchNumber,
  };
}
