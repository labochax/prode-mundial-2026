import { describe, expect, it } from "vitest";

import {
  getPredictionScoringResetPatch,
  scoreDevCompletedMatches,
} from "@/lib/tournament/dev-match-scoring";

describe("scoreDevCompletedMatches", () => {
  it("scores each unique finalized match through the database scoring RPC", async () => {
    const calls: string[] = [];
    const client = {
      rpc: async (
        functionName: string,
        args: { target_match_id: string },
      ) => {
        calls.push(`${functionName}:${args.target_match_id}`);

        return {
          data: args.target_match_id === "match-a" ? 2 : 3,
          error: null,
        };
      },
    };

    const result = await scoreDevCompletedMatches(client, [
      "match-a",
      "match-b",
      "match-a",
    ]);

    expect(calls).toEqual([
      "score_match_predictions:match-a",
      "score_match_predictions:match-b",
    ]);
    expect(result).toEqual({
      matchesReviewed: 2,
      predictionsScored: 5,
    });
  });

  it("returns the regular prediction reset patch without deleting predictions", () => {
    expect(getPredictionScoringResetPatch()).toEqual({
      points: null,
      scored_at: null,
    });
  });
});
