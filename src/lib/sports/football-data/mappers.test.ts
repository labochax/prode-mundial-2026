import { describe, expect, it } from "vitest";

import { mapFootballDataMatchToCandidate } from "@/lib/sports/football-data/mappers";
import type { FootballDataMatch } from "@/lib/sports/football-data/types";

describe("mapFootballDataMatchToCandidate", () => {
  it("uses regularTime as the Prode score for penalty shootout matches and preserves the winner", () => {
    const candidate = mapFootballDataMatchToCandidate(
      match({
        score: {
          duration: "PENALTY_SHOOTOUT",
          fullTime: { away: 4, home: 3 },
          regularTime: { away: 1, home: 1 },
          winner: "AWAY_TEAM",
        },
        status: "FINISHED",
      }),
    );

    expect(candidate).toMatchObject({
      away_score: 1,
      home_score: 1,
      winner: "AWAY_TEAM",
    });
  });

  it("does not store penalty-inflated fullTime scores when regularTime is missing", () => {
    const candidate = mapFootballDataMatchToCandidate(
      match({
        score: {
          duration: "PENALTY_SHOOTOUT",
          fullTime: { away: 4, home: 3 },
          regularTime: null,
          winner: "AWAY_TEAM",
        },
        status: "FINISHED",
      }),
    );

    expect(candidate).toMatchObject({
      away_score: null,
      home_score: null,
      winner: "AWAY_TEAM",
    });
  });

  it("keeps using fullTime for non-penalty finished matches", () => {
    const candidate = mapFootballDataMatchToCandidate(
      match({
        score: {
          duration: "REGULAR",
          fullTime: { away: 1, home: 2 },
          regularTime: { away: 0, home: 0 },
          winner: "HOME_TEAM",
        },
        status: "FINISHED",
      }),
    );

    expect(candidate).toMatchObject({
      away_score: 1,
      home_score: 2,
      winner: "HOME_TEAM",
    });
  });
});

function match(overrides: Partial<FootballDataMatch>): FootballDataMatch {
  return {
    awayTeam: { id: 2, name: "Morocco", tla: "MAR" },
    homeTeam: { id: 1, name: "Netherlands", tla: "NED" },
    id: 537418,
    stage: "LAST_32",
    utcDate: "2026-06-30T01:00:00Z",
    ...overrides,
  };
}
