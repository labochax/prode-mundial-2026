import { describe, expect, it } from "vitest";

import {
  buildPlayerVisiblePredictions,
  getPlayerVisiblePredictionBadge,
  isPlayerMatchPredictionVisible,
} from "@/lib/supabase/queries/player-visible-predictions";

const now = new Date("2026-06-11T19:00:00.000Z");

describe("isPlayerMatchPredictionVisible", () => {
  it("filters out unlocked future matches", () => {
    expect(
      isPlayerMatchPredictionVisible(
        match({
          lock_at: "2026-06-11T20:00:00.000Z",
          status: "TIMED",
        }),
        now,
      ),
    ).toBe(false);
  });

  it("includes locked but unfinished matches", () => {
    expect(
      isPlayerMatchPredictionVisible(
        match({
          lock_at: "2026-06-11T18:50:00.000Z",
          status: "TIMED",
        }),
        now,
      ),
    ).toBe(true);
  });

  it("includes finished matches", () => {
    expect(
      isPlayerMatchPredictionVisible(
        match({
          lock_at: "2026-06-11T20:00:00.000Z",
          status: "FINISHED",
        }),
        now,
      ),
    ).toBe(true);
  });
});

describe("getPlayerVisiblePredictionBadge", () => {
  it.each([
    [3, "exact", "Exacto +3"],
    [1, "outcome", "Resultado +1"],
    [0, "miss", "Fallado +0"],
    [null, "closed", "Cerrado"],
  ] as const)("maps %s points to %s", (points, tone, label) => {
    expect(getPlayerVisiblePredictionBadge(points)).toEqual({ label, tone });
  });
});

describe("buildPlayerVisiblePredictions", () => {
  it("orders visible predictions by kickoff and match number ascending", () => {
    const rows = [
      prediction({
        id: "prediction-3",
        match: match({
          id: "match-3",
          kickoff_at: "2026-06-12T12:00:00.000Z",
          match_number: 3,
          status: "FINISHED",
        }),
      }),
      prediction({
        id: "prediction-1",
        match: match({
          id: "match-1",
          kickoff_at: "2026-06-11T12:00:00.000Z",
          match_number: 2,
          status: "FINISHED",
        }),
      }),
      prediction({
        id: "prediction-2",
        match: match({
          id: "match-2",
          kickoff_at: "2026-06-11T12:00:00.000Z",
          match_number: 4,
          status: "FINISHED",
        }),
      }),
    ];

    expect(
      buildPlayerVisiblePredictions(rows, now).map((item) => item.predictionId),
    ).toEqual(["prediction-1", "prediction-2", "prediction-3"]);
  });
});

function match(overrides: Partial<NonNullable<TestPredictionRow["matches"]>> = {}) {
  return {
    away_score: null,
    away_team: {
      id: "away-team",
      name_en: "Spain",
      name_es: "España",
      short_name: "Spain",
      tla: "ESP",
    },
    away_team_id: "away-team",
    group_code: "GROUP_A",
    home_score: null,
    home_team: {
      id: "home-team",
      name_en: "Argentina",
      name_es: "Argentina",
      short_name: "Argentina",
      tla: "ARG",
    },
    home_team_id: "home-team",
    id: "match-1",
    kickoff_at: "2026-06-11T12:00:00.000Z",
    lock_at: "2026-06-11T11:50:00.000Z",
    match_number: 1,
    stage: "GROUP_STAGE",
    status: "TIMED",
    ...overrides,
  };
}

type TestPredictionRow = Parameters<typeof buildPlayerVisiblePredictions>[0][number];

function prediction(
  overrides: Partial<TestPredictionRow> & {
    match?: NonNullable<TestPredictionRow["matches"]>;
  } = {},
): TestPredictionRow {
  return {
    id: "prediction-1",
    matches: overrides.match ?? match(),
    points: null,
    predicted_away_score: 0,
    predicted_home_score: 1,
    ...overrides,
  };
}
