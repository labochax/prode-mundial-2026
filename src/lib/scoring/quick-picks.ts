export type QuickPickOutcome = "away" | "draw" | "home";

export type QuickPickScore = {
  away: number;
  home: number;
};

type WeightedScore = {
  loser?: number;
  score: number;
  weight: number;
};

const teamWinScores = [
  { loser: 0, score: 1, weight: 40 },
  { loser: 1, score: 2, weight: 30 },
  { loser: 0, score: 2, weight: 18 },
  { loser: 1, score: 3, weight: 6 },
  { loser: 2, score: 3, weight: 6 },
] as const satisfies readonly WeightedScore[];

const drawScores = [
  { score: 1, weight: 55 },
  { score: 0, weight: 30 },
  { score: 2, weight: 15 },
] as const satisfies readonly WeightedScore[];

function pickWeightedScore(scores: readonly WeightedScore[]) {
  const totalWeight = scores.reduce((total, score) => total + score.weight, 0);
  let cursor = Math.random() * totalWeight;

  for (const score of scores) {
    cursor -= score.weight;
    if (cursor <= 0) {
      return score;
    }
  }

  return scores[0];
}

export function generateQuickPickScore(
  outcome: QuickPickOutcome,
): QuickPickScore {
  if (outcome === "draw") {
    const draw = pickWeightedScore(drawScores).score;
    return { away: draw, home: draw };
  }

  const winner = pickWeightedScore(teamWinScores);
  const loser = winner.loser ?? 0;

  return outcome === "home"
    ? { away: loser, home: winner.score }
    : { away: winner.score, home: loser };
}
