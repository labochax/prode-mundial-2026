import { describe, expect, it } from "vitest";

import {
  mapSupabaseMatchToPredictionMatch,
  type MatchWithRelations,
} from "@/lib/matches/prediction-match";
import type { Database } from "@/lib/supabase/database.types";

type PredictionRow = Database["public"]["Tables"]["predictions"]["Row"];
type TeamRow = Database["public"]["Tables"]["teams"]["Row"];

function team(id: string, name: string): TeamRow {
  return {
    badge_url: null,
    created_at: "2026-01-01T00:00:00Z",
    flag_url: null,
    football_data_id: null,
    id,
    name_en: name,
    name_es: name,
    raw_json: null,
    short_name: name.slice(0, 3),
    sportsdb_id: null,
    tla: name.slice(0, 3).toUpperCase(),
    updated_at: "2026-01-01T00:00:00Z",
  };
}

function matchFixture(
  overrides: Partial<MatchWithRelations> = {},
): MatchWithRelations {
  return {
    away_score: null,
    away_team: team("away", "Visitante"),
    away_team_id: "away",
    created_at: "2026-01-01T00:00:00Z",
    football_data_id: 73,
    group_code: null,
    home_score: null,
    home_team: team("home", "Local"),
    home_team_id: "home",
    id: "00000000-0000-4000-8000-000000000073",
    kickoff_at: "2026-07-01T19:00:00Z",
    last_synced_at: null,
    lock_at: "2026-07-01T18:50:00Z",
    match_number: 73,
    minute: null,
    raw_json: null,
    stadium: null,
    stadium_id: null,
    stage: "LAST_32",
    status: "TIMED",
    updated_at: "2026-01-01T00:00:00Z",
    winner: null,
    ...overrides,
  };
}

function prediction(points: number): PredictionRow {
  return {
    away_score: null,
    created_at: "2026-01-01T00:00:00Z",
    id: "00000000-0000-4000-8000-100000000001",
    match_id: "00000000-0000-4000-8000-000000000073",
    points,
    pool_id: "00000000-0000-4000-8000-200000000001",
    predicted_away_score: 0,
    predicted_home_score: 1,
    scored_at: "2026-07-01T21:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    user_id: "00000000-0000-4000-8000-300000000001",
  } as PredictionRow;
}

describe("mapSupabaseMatchToPredictionMatch", () => {
  it("marks unresolved knockout fixtures as unavailable for predictions", () => {
    const mapped = mapSupabaseMatchToPredictionMatch(
      matchFixture({
        away_team: null,
        away_team_id: null,
        home_team: null,
        home_team_id: null,
      }),
      null,
    );

    expect(mapped.availability).toMatchObject({
      canPredict: false,
      ctaHref: "/mi-mundial",
      ctaLabel: "Ver Mi Mundial",
      status: "official-teams-pending",
    });
  });

  it("keeps finished official knockout breakdown visible while blocking edits", () => {
    const mapped = mapSupabaseMatchToPredictionMatch(
      matchFixture({
        away_score: 0,
        home_score: 2,
        status: "FINISHED",
      }),
      prediction(1),
    );

    expect(mapped.availability).toMatchObject({
      canPredict: false,
      status: "started-or-finished",
    });
    expect(mapped.pointsBreakdown?.shortLabel).toBe("Resultado +1");
  });
});
