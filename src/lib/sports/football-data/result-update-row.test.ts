import { describe, expect, it } from "vitest";

import {
  getFootballDataResultTeamUpdateFields,
  getFootballDataResultUpdateRow,
} from "@/lib/sports/football-data/result-update-row";
import type { FootballDataMatchCandidate } from "@/lib/sports/football-data/types";

describe("getFootballDataResultTeamUpdateFields", () => {
  it("includes home and away team ids when Football-Data ids resolve locally", () => {
    expect(
      getFootballDataResultTeamUpdateFields(candidate(), new Map([
        [100, "local-home"],
        [200, "local-away"],
      ])),
    ).toEqual({
      away_team_id: "local-away",
      home_team_id: "local-home",
    });
  });

  it("does not include team fields when Football-Data omits team ids", () => {
    expect(
      getFootballDataResultTeamUpdateFields(
        candidate({
          away_team_football_data_id: null,
          home_team_football_data_id: null,
        }),
        new Map([
          [100, "local-home"],
          [200, "local-away"],
        ]),
      ),
    ).toEqual({});
  });

  it("does not set null when a Football-Data team id is missing from local lookup", () => {
    expect(
      getFootballDataResultTeamUpdateFields(candidate(), new Map([[100, "local-home"]])),
    ).toEqual({
      home_team_id: "local-home",
    });
  });
});

describe("getFootballDataResultUpdateRow", () => {
  it("preserves result fields and adds resolved team ids", () => {
    expect(
      getFootballDataResultUpdateRow(candidate(), {
        stadiumId: "stadium-1",
        teamIds: new Map([
          [100, "local-home"],
          [200, "local-away"],
        ]),
      }),
    ).toMatchObject({
      away_score: 1,
      away_team_id: "local-away",
      home_score: 2,
      home_team_id: "local-home",
      kickoff_at: "2026-06-11T19:00:00.000Z",
      minute: null,
      stadium_id: "stadium-1",
      status: "FINISHED",
      winner: "HOME_TEAM",
    });
  });

  it("does not clear existing team ids when provider team ids are null or unknown", () => {
    expect(
      getFootballDataResultUpdateRow(
        candidate({
          away_team_football_data_id: 999,
          home_team_football_data_id: null,
        }),
        {
          stadiumId: null,
          teamIds: new Map(),
        },
      ),
    ).not.toHaveProperty("away_team_id");
    expect(
      getFootballDataResultUpdateRow(
        candidate({
          away_team_football_data_id: 999,
          home_team_football_data_id: null,
        }),
        {
          stadiumId: null,
          teamIds: new Map(),
        },
      ),
    ).not.toHaveProperty("home_team_id");
  });
});

function candidate(
  overrides: Partial<FootballDataMatchCandidate> = {},
): FootballDataMatchCandidate {
  return {
    away_score: 1,
    away_team_football_data_id: 200,
    football_data_id: 5001,
    group_code: null,
    home_score: 2,
    home_team_football_data_id: 100,
    kickoff_at: "2026-06-11T19:00:00.000Z",
    last_synced_at: "2026-06-11T21:00:00.000Z",
    match_number: 73,
    minute: null,
    raw_json: {
      awayTeam: { id: 200, name: "Canada" },
      homeTeam: { id: 100, name: "South Africa" },
    },
    stage: "LAST_32",
    status: "FINISHED",
    venue_name: null,
    winner: "HOME_TEAM",
    ...overrides,
  };
}
