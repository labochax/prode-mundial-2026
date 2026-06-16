import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PlayerVisiblePredictionsSection } from "@/components/tournament/player-visible-predictions-section";
import type { PlayerVisiblePrediction } from "@/lib/supabase/queries/player-visible-predictions";

describe("PlayerVisiblePredictionsSection", () => {
  it("renders the empty state without edit controls", () => {
    const html = renderToStaticMarkup(
      createElement(PlayerVisiblePredictionsSection, {
        predictions: [],
      }),
    );

    expect(html).toContain("Predicciones visibles");
    expect(html).toContain("Todavía no hay predicciones visibles para este jugador.");
    expect(html).not.toContain("<button");
    expect(html).not.toContain("Guardar");
  });

  it("renders visible predictions with final score and points badge", () => {
    const html = renderToStaticMarkup(
      createElement(PlayerVisiblePredictionsSection, {
        predictions: [
          {
            awayScore: 0,
            awayTeamCode: "ESP",
            awayTeamName: "España",
            badge: { label: "Exacto +3", tone: "exact" },
            finalAwayScore: 0,
            finalHomeScore: 1,
            homeScore: 1,
            homeTeamCode: "ARG",
            homeTeamName: "Argentina",
            kickoffAt: "2026-06-11T12:00:00.000Z",
            matchId: "match-1",
            matchNumber: 1,
            predictionId: "prediction-1",
            stageLabel: "Grupo A",
          },
        ] satisfies PlayerVisiblePrediction[],
      }),
    );

    expect(html).toContain("ARG 1 - 0 ESP");
    expect(html).toContain("Final: ARG 1 - 0 ESP");
    expect(html).toContain("Exacto +3");
    expect(html).not.toContain("<button");
    expect(html).not.toContain("Guardar");
  });
});
