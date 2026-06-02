import { describe, expect, it } from "vitest";

import {
  getOfficialFifaMatchNumber,
  getOfficialWorldCupVenueForMatchNumber,
  officialMatchVenueAssignments,
  officialWorldCupVenues,
  resolveOfficialWorldCupMatchVenue,
  validateOfficialWorldCupVenueMap,
} from "@/lib/sports/world-cup-2026/official-venue-map";

describe("official World Cup 2026 venue map", () => {
  it("covers every FIFA match number from 1 through 104 exactly once", () => {
    const validation = validateOfficialWorldCupVenueMap();

    expect(officialWorldCupVenues).toHaveLength(16);
    expect(officialMatchVenueAssignments).toHaveLength(104);
    expect(validation).toEqual({
      duplicateMatchNumbers: [],
      invalidVenueKeys: [],
      missingMatchNumbers: [],
      valid: true,
    });
  });

  it("resolves official venues for group, knockout, third-place, and final matches", () => {
    expect(getOfficialWorldCupVenueForMatchNumber(1)?.fifaName).toBe(
      "Mexico City Stadium",
    );
    expect(getOfficialWorldCupVenueForMatchNumber(75)?.fifaName).toBe(
      "Monterrey Stadium",
    );
    expect(getOfficialWorldCupVenueForMatchNumber(103)?.fifaName).toBe(
      "Miami Stadium",
    );
    expect(getOfficialWorldCupVenueForMatchNumber(104)?.fifaName).toBe(
      "New York New Jersey Stadium",
    );
  });

  it("uses the maintained Football-Data correlation before the broken seed matchday value", () => {
    expect(
      getOfficialFifaMatchNumber({
        footballDataId: 537334,
        matchNumber: 1,
        stage: "GROUP_STAGE",
      }),
    ).toBe(8);
  });

  it("keeps FIFA authoritative and reports a Football-Data venue discrepancy", () => {
    expect(
      resolveOfficialWorldCupMatchVenue({
        footballDataId: 537327,
        matchNumber: 1,
        rawJson: {
          venue: "Miami Stadium",
        },
        stage: "GROUP_STAGE",
      }),
    ).toMatchObject({
      discrepancy: {
        fifaVenue: "Mexico City Stadium",
        footballDataVenue: "Miami Stadium",
      },
      fifaMatchNumber: 1,
      source: "official-fifa-schedule",
      venue: {
        fifaName: "Mexico City Stadium",
      },
    });
  });

  it("counts matching Football-Data venue as the primary source", () => {
    expect(
      resolveOfficialWorldCupMatchVenue({
        footballDataId: 537327,
        matchNumber: 1,
        rawJson: {
          venue: "Estadio Azteca",
        },
        stage: "GROUP_STAGE",
      }),
    ).toMatchObject({
      discrepancy: null,
      fifaMatchNumber: 1,
      source: "football-data-match-venue",
      venue: {
        fifaName: "Mexico City Stadium",
      },
    });
  });

  it("reports a missing assignment instead of guessing for an unknown match", () => {
    expect(
      resolveOfficialWorldCupMatchVenue({
        footballDataId: 999999,
        matchNumber: null,
        rawJson: null,
        stage: "GROUP_STAGE",
      }),
    ).toEqual({
      discrepancy: null,
      fifaMatchNumber: null,
      missingReason: "missing-fifa-match-number",
      source: null,
      venue: null,
    });
  });
});
