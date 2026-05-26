export type DevMatchScoringClient = {
  rpc: (
    functionName: "score_match_predictions",
    args: { target_match_id: string },
  ) => PromiseLike<{ data: number | null; error: unknown }>;
};

export type DevMatchScoringSummary = {
  matchesReviewed: number;
  predictionsScored: number;
};

function uniqueNonEmptyIds(matchIds: readonly string[]) {
  return [...new Set(matchIds.filter((matchId) => matchId.trim().length > 0))];
}

export async function scoreDevCompletedMatches(
  client: DevMatchScoringClient,
  matchIds: readonly string[],
): Promise<DevMatchScoringSummary> {
  const uniqueMatchIds = uniqueNonEmptyIds(matchIds);
  let predictionsScored = 0;

  for (const matchId of uniqueMatchIds) {
    const { data, error } = await client.rpc("score_match_predictions", {
      target_match_id: matchId,
    });

    if (error) {
      throw error;
    }

    predictionsScored += data ?? 0;
  }

  return {
    matchesReviewed: uniqueMatchIds.length,
    predictionsScored,
  };
}

export function getPredictionScoringResetPatch() {
  return {
    points: null,
    scored_at: null,
  };
}
