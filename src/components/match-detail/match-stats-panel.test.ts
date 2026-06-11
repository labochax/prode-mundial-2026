import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MatchStatsPanel } from "@/components/match-detail/match-stats-panel";
import type { PredictionMatch } from "@/lib/matches/prediction-match";

const match = {
  away: { code: "ESP", id: "esp", name: "España" },
  detail: {
    metadata: {
      city: "Buenos Aires, Argentina",
      dateTime: "jueves, 11 de junio de 2026",
      groupPhase: "Grupo A",
      stadium: "Estadio oficial",
      venueStatus: "official-fixture",
    },
  },
  home: { code: "ARG", id: "arg", name: "Argentina" },
} as PredictionMatch;

describe("MatchStatsPanel", () => {
  it("renders match data first and removes direct-history UX", () => {
    const html = renderToStaticMarkup(
      createElement(MatchStatsPanel, {
        match,
        stats: {
          counts: { away: 0, draw: 0, home: 0 },
          distribution: null,
          status: "hidden-until-lock",
          topScorelines: [],
          totalPredictions: null,
        },
      }),
    );

    expect(html.indexOf("Datos del partido")).toBeLessThan(
      html.indexOf("Tendencia Prode"),
    );
    expect(html).not.toContain("Historial directo");
    expect(html).not.toContain("Sin datos");
  });
});
