import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ReadOnlyTournamentBracket } from "@/components/tournament/read-only-tournament-bracket";
import type { DerivedKnockoutRounds } from "@/lib/tournament/knockout-selection";

const slot = (id: string, name: string) => ({
  groupCode: "A",
  isPlaceholder: false as const,
  originLabel: "1° Grupo A",
  qualificationType: "Ganador de grupo" as const,
  slotLabel: "1°A",
  sourceRank: 1 as const,
  team: { code: id, id, name },
});

const champion = slot("ARG", "Argentina");
const runnerUp = slot("ESP", "España");
const thirdPlace = slot("URU", "Uruguay");
const fourthPlace = slot("BRA", "Brasil");
const final = {
  away: runnerUp,
  home: champion,
  id: "match-104",
  matchNumber: 104,
  roundKey: "final" as const,
  roundLabel: "Final" as const,
  slotLabel: "Partido 104",
};
const thirdPlaceMatch = {
  away: fourthPlace,
  home: thirdPlace,
  id: "match-103",
  matchNumber: 103,
  roundKey: "thirdPlace" as const,
  roundLabel: "3.º puesto" as const,
  slotLabel: "Partido 103",
};
const rounds = {
  final: [final],
  quarterfinals: [],
  roundOf16: [],
  roundOf32: [],
  semifinals: [],
  summary: { champion, fourthPlace, runnerUp, thirdPlace },
  thirdPlace: [thirdPlaceMatch],
} satisfies DerivedKnockoutRounds;

describe("ReadOnlyTournamentBracket", () => {
  it("renders placements and bonus without edit/save controls", () => {
    const html = renderToStaticMarkup(
      createElement(ReadOnlyTournamentBracket, {
        bonusPoints: 23,
        rounds,
      }),
    );

    expect(html).toContain("Resumen de Mi Mundial");
    expect(html).toContain("Argentina");
    expect(html).toContain("España");
    expect(html).toContain("Uruguay");
    expect(html).toContain("Brasil");
    expect(html).toContain("Bonus Mi Mundial: 23 puntos");
    expect(html).not.toContain("Guardar Mi Mundial");
    expect(html).not.toContain("<button");
  });
});
