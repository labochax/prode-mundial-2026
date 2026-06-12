import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PlayerMiMundialEmptyState } from "@/components/tournament/player-mi-mundial-empty-state";

describe("PlayerMiMundialEmptyState", () => {
  it("renders a safe unavailable state with back navigation", () => {
    const html = renderToStaticMarkup(
      createElement(PlayerMiMundialEmptyState, {
        description: "Mi Mundial todavía no está disponible para ver.",
        title: "Jugador",
      }),
    );

    expect(html).toContain("Mi Mundial todavía no está disponible para ver.");
    expect(html).toContain('href="/posiciones"');
    expect(html).toContain("Volver a posiciones");
  });

  it("renders the no-saved-prediction state", () => {
    const html = renderToStaticMarkup(
      createElement(PlayerMiMundialEmptyState, {
        description: "Este jugador no guardó Mi Mundial.",
        title: "Jugador",
      }),
    );

    expect(html).toContain("Este jugador no guardó Mi Mundial.");
  });
});
