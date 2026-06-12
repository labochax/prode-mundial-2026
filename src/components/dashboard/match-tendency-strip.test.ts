import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MatchTendencyStrip } from "@/components/dashboard/match-tendency-strip";
import type { MatchPredictionStats } from "@/lib/matches/match-prediction-stats";
import type { PredictionMatch } from "@/lib/matches/prediction-match";

const match = {
  away: { code: "RSA" },
  home: { code: "MEX" },
  tendency: {
    distribution: null,
    status: "unavailable",
  },
} as PredictionMatch;

function render(stats: MatchPredictionStats) {
  return renderToStaticMarkup(
    createElement(MatchTendencyStrip, { match, stats }),
  );
}

describe("MatchTendencyStrip", () => {
  it("renders real aggregate stats when available", () => {
    const html = render({
      counts: { away: 3, draw: 2, home: 5 },
      distribution: { away: 30, draw: 20, home: 50 },
      status: "available",
      topScorelines: [],
      totalPredictions: 10,
    });

    expect(html).toContain("Tendencia: MEX 50% / EMP 20% / RSA 30%");
    expect(html).not.toContain("Todavía no hay suficientes pronósticos");
  });

  it("hides real tendency before lock", () => {
    const html = render({
      counts: { away: 0, draw: 0, home: 0 },
      distribution: null,
      status: "hidden-until-lock",
      topScorelines: [],
      totalPredictions: null,
    });

    expect(html).toContain("Tendencia disponible al cierre");
    expect(html).not.toContain("%");
  });

  it("shows insufficient state and count after lock", () => {
    const html = render({
      counts: { away: 0, draw: 1, home: 1 },
      distribution: null,
      status: "insufficient",
      topScorelines: [],
      totalPredictions: 2,
    });

    expect(html).toContain("Todavía no hay suficientes pronósticos");
    expect(html).toContain("Basado en 2 pronósticos");
  });
});
