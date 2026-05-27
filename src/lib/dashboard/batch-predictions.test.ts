import { describe, expect, it } from "vitest";

import {
  buildBatchPredictionPayload,
  getDirtyPredictionIds,
  mergeBatchSaveResult,
  type DashboardPredictionMap,
} from "./batch-predictions";

const saved: DashboardPredictionMap = {
  "match-1": {
    away: 0,
    home: 1,
  },
  "match-2": {
    away: 2,
    home: 2,
  },
  "match-3": {
    away: 1,
    home: 0,
  },
};

describe("getDirtyPredictionIds", () => {
  it("returns match ids whose scores differ from the saved snapshot", () => {
    expect(
      getDirtyPredictionIds(
        {
          ...saved,
          "match-2": {
            away: 3,
            home: 2,
          },
        },
        saved,
      ),
    ).toEqual(["match-2"]);
  });
});

describe("buildBatchPredictionPayload", () => {
  it("serializes dirty editable predictions only", () => {
    expect(
      buildBatchPredictionPayload({
        currentPredictions: {
          ...saved,
          "match-1": {
            away: 1,
            home: 1,
          },
          "match-2": {
            away: 4,
            home: 2,
          },
        },
        dirtyIds: ["match-1", "match-2"],
        editableMatchIds: new Set(["match-1", "match-3"]),
      }),
    ).toEqual([
      {
        match_id: "match-1",
        predicted_away_score: 1,
        predicted_home_score: 1,
      },
    ]);
  });
});

describe("mergeBatchSaveResult", () => {
  it("clears successful saves and keeps failed saves dirty", () => {
    const current = {
      ...saved,
      "match-1": {
        away: 1,
        home: 1,
      },
      "match-2": {
        away: 4,
        home: 2,
      },
    };

    expect(
      mergeBatchSaveResult({
        currentPredictions: current,
        dirtyIds: ["match-1", "match-2"],
        failedMatchIds: ["match-2"],
        savedPredictions: saved,
      }),
    ).toEqual({
      dirtyIds: ["match-2"],
      savedPredictions: {
        ...saved,
        "match-1": {
          away: 1,
          home: 1,
        },
      },
    });
  });
});
