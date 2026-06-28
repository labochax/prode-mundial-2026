import { describe, expect, it } from "vitest";

import {
  buildLeaderboardRecentResults,
  buildRecentResultMarkersByUser,
  getLeaderboardRecentResults,
  mapPredictionPointsToResultMarker,
} from "@/lib/supabase/queries/leaderboard-recent-results";
import { buildPlayerVisiblePredictions } from "@/lib/supabase/queries/player-visible-predictions";

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
  it("selects the latest five scored predictions and keeps their chronological display order", () => {
    const result = buildRecentResultMarkersByUser([
      prediction("user-1", 1, "2026-06-08T12:00:00.000Z", 1),
      prediction("user-1", 0, "2026-06-09T12:00:00.000Z", 2),
      prediction("user-1", 1, "2026-06-10T12:00:00.000Z", 3),
      prediction("user-1", 0, "2026-06-11T12:00:00.000Z", 4),
      prediction("user-1", 3, "2026-06-12T12:00:00.000Z", 5),
      prediction("user-1", 0, "2026-06-12T12:00:00.000Z", 6),
    ]);

    expect(result.get("user-1")).toEqual([
      "miss",
      "outcome",
      "miss",
      "exact",
      "miss",
    ]);
  });

  it("keeps Jowe's latest five real results in the same order as player detail", () => {
    const result = buildRecentResultMarkersByUser([
      prediction("jowe", 1, "2026-06-08T12:00:00.000Z", 1),
      prediction("jowe", 0, "2026-06-09T12:00:00.000Z", 2),
      prediction("jowe", 3, "2026-06-10T12:00:00.000Z", 3),
      prediction("jowe", 3, "2026-06-11T12:00:00.000Z", 4),
      prediction("jowe", 0, "2026-06-12T12:00:00.000Z", 5),
      prediction("jowe", 0, "2026-06-13T12:00:00.000Z", 6),
    ]);

    expect(result.get("jowe")).toEqual([
      "miss",
      "exact",
      "exact",
      "miss",
      "miss",
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

  it("uses the same scored and visible predictions as player detail", () => {
    const rows = [
      prediction(
        "user-1",
        3,
        "2026-06-11T12:00:00.000Z",
        1,
        "FINISHED",
        "missing-teams-match",
        { away_team_id: null },
      ),
      prediction("user-1", 0, "2026-06-12T12:00:00.000Z", 2),
    ];
    const detailMarkers = buildPlayerVisiblePredictions(
      rows.map((row, index) => ({
        id: `prediction-${index}`,
        matches: {
          ...row.matches,
          away_score: null,
          away_team: team("away-team", "España", "ESP"),
          group_code: "GROUP_A",
          home_score: null,
          home_team: team("home-team", "Argentina", "ARG"),
          stage: "GROUP_STAGE",
        },
        points: row.points,
        predicted_away_score: 0,
        predicted_home_score: 1,
      })),
      new Date("2026-06-13T12:00:00.000Z"),
    ).map((prediction) =>
      prediction.badge.tone === "closed" ? "empty" : prediction.badge.tone,
    );

    expect(buildRecentResultMarkersByUser(rows).get("user-1")).toEqual([
      ...detailMarkers,
      "empty",
      "empty",
      "empty",
      "empty",
    ].slice(0, 5));
  });
});

describe("buildLeaderboardRecentResults", () => {
  it("collects contributions from the latest five scored matches for rank trend", () => {
    const result = buildLeaderboardRecentResults([
      prediction("user-1", 3, "2026-06-08T12:00:00.000Z", 1, "FINISHED", "match-1"),
      prediction("user-1", 1, "2026-06-09T12:00:00.000Z", 2, "FINISHED", "match-2"),
      prediction("user-1", 1, "2026-06-10T12:00:00.000Z", 3, "FINISHED", "match-3"),
      prediction("user-2", 0, "2026-06-10T12:00:00.000Z", 3, "FINISHED", "match-3"),
      prediction("user-1", 0, "2026-06-11T12:00:00.000Z", 4, "FINISHED", "match-4"),
      prediction("user-2", 3, "2026-06-12T12:00:00.000Z", 5, "FINISHED", "match-5"),
      prediction("user-1", 3, "2026-06-13T12:00:00.000Z", 6, "FINISHED", "match-6"),
    ]);

    expect(result.trendWindowContributionsByUserId).toEqual(
      new Map([
        [
          "user-1",
          {
            exactHits: 1,
            outcomeHits: 2,
            points: 5,
            predictedMatchesCount: 4,
          },
        ],
        [
          "user-2",
          {
            exactHits: 1,
            outcomeHits: 0,
            points: 3,
            predictedMatchesCount: 2,
          },
        ],
      ]),
    );
  });
});

describe("getLeaderboardRecentResults", () => {
  it("fetches every paginated prediction page before building recent markers", async () => {
    const firstPageRows = Array.from({ length: 1000 }, (_, index) =>
      prediction(
        `other-user-${index}`,
        index % 2 === 0 ? 0 : 1,
        "2026-06-08T12:00:00.000Z",
        index + 1,
        "FINISHED",
        `first-page-match-${index}`,
      ),
    );
    const joweRows = [
      prediction("jowe", 0, "2026-06-09T12:00:00.000Z", 1001),
      prediction("jowe", 1, "2026-06-10T12:00:00.000Z", 1002),
      prediction("jowe", 0, "2026-06-11T12:00:00.000Z", 1003),
      prediction("jowe", 3, "2026-06-12T12:00:00.000Z", 1004),
      prediction("jowe", 0, "2026-06-13T12:00:00.000Z", 1005),
    ];
    const client = createPagedPredictionsClient([...firstPageRows, ...joweRows]);

    const result = await getLeaderboardRecentResults(
      client as never,
      "pool-1",
    );

    expect(result.recentMarkersByUserId.get("jowe")).toEqual([
      "miss",
      "outcome",
      "miss",
      "exact",
      "miss",
    ]);
    expect(result.trendWindowContributionsByUserId.get("jowe")).toEqual({
      exactHits: 1,
      outcomeHits: 1,
      points: 4,
      predictedMatchesCount: 5,
    });
    expect(client.getRanges()).toEqual([
      [0, 999],
      [1000, 1999],
    ]);
  });
});

function prediction(
  userId: string,
  points: 0 | 1 | 3 | null,
  kickoffAt: string,
  matchNumber: number,
  status: "FINISHED" | "TIMED" = "FINISHED",
  matchId = `match-${matchNumber}`,
  matchOverrides: Partial<{
    away_team_id: string | null;
    home_team_id: string | null;
    lock_at: string;
  }> = {},
) {
  return {
    matches: {
      away_team_id: "away-team",
      id: matchId,
      home_team_id: "home-team",
      kickoff_at: kickoffAt,
      lock_at: "2026-06-01T12:00:00.000Z",
      match_number: matchNumber,
      status,
      ...matchOverrides,
    },
    points,
    user_id: userId,
  };
}

function team(id: string, name: string, tla: string) {
  return {
    id,
    name_en: name,
    name_es: name,
    short_name: name,
    tla,
  };
}

function createPagedPredictionsClient(rows: ReturnType<typeof prediction>[]) {
  const ranges: Array<[number, number]> = [];

  return {
    getRanges: () => ranges,
    from: (tableName: string) => {
      expect(tableName).toBe("predictions");

      const state = {
        from: 0,
        to: 999,
      };

      const builder = {
        eq: () => builder,
        not: () => builder,
        order: () => builder,
        range: (from: number, to: number) => {
          ranges.push([from, to]);
          state.from = from;
          state.to = to;

          return builder;
        },
        select: () => builder,
        then: (
          resolve: (value: { data: typeof rows; error: null }) => unknown,
          reject: (reason?: unknown) => unknown,
        ) =>
          Promise.resolve({
            data: rows.slice(state.from, state.to + 1),
            error: null,
          }).then(resolve, reject),
      };

      return builder;
    },
  };
}
