import { describe, expect, it } from "vitest";

import {
  getMatchVenueNameFromRawJson,
  getOfficialWorldCupStadium,
  normalizeVenueName,
  officialWorldCupStadiums,
} from "@/lib/sports/football-data/stadiums";
import { mapFootballDataMatchToCandidate } from "@/lib/sports/football-data/mappers";

describe("Football-Data stadium mapping", () => {
  it("keeps the 16 official World Cup 2026 venues in the catalog", () => {
    expect(officialWorldCupStadiums).toHaveLength(16);
  });

  it("normalizes accents, punctuation, and repeated spaces", () => {
    expect(normalizeVenueName("  Estadio  Azteca ")).toBe("estadio azteca");
    expect(normalizeVenueName("Levi's Stadium")).toBe("levis stadium");
  });

  it("maps FIFA host labels and common stadium aliases to the official venue catalog", () => {
    expect(getOfficialWorldCupStadium("Estadio Azteca")).toMatchObject({
      city: "Ciudad de México",
      name: "Mexico City Stadium",
    });
    expect(getOfficialWorldCupStadium("BC Place")).toMatchObject({
      city: "Vancouver",
      name: "BC Place Vancouver",
    });
    expect(getOfficialWorldCupStadium("MetLife Stadium")).toMatchObject({
      city: "Nueva York / Nueva Jersey",
      name: "New York New Jersey Stadium",
    });
  });

  it("returns null instead of guessing unknown venues", () => {
    expect(getOfficialWorldCupStadium("Estadio Centenario")).toBeNull();
    expect(getOfficialWorldCupStadium(null)).toBeNull();
  });

  it("reads only a match-level venue from stored raw payloads", () => {
    expect(
      getMatchVenueNameFromRawJson({
        homeTeam: {
          name: "Argentina",
          venue: "Estadio Monumental",
        },
        venue: "Miami Stadium",
      }),
    ).toBe("Miami Stadium");
    expect(
      getMatchVenueNameFromRawJson({
        homeTeam: {
          name: "Argentina",
          venue: "Estadio Monumental",
        },
      }),
    ).toBeNull();
  });

  it("keeps the match-level Football-Data venue in the sync candidate", () => {
    expect(
      mapFootballDataMatchToCandidate({
        id: 1,
        utcDate: "2026-06-11T19:00:00Z",
        venue: "Estadio Azteca",
      }).venue_name,
    ).toBe("Estadio Azteca");
  });
});
