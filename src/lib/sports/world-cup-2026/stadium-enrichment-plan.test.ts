import { describe, expect, it } from "vitest";

import { buildOfficialStadiumEnrichmentPlan } from "@/lib/sports/world-cup-2026/stadium-enrichment-plan";

describe("World Cup 2026 stadium enrichment plan", () => {
  it("classifies matching Football-Data venues before using the FIFA fallback", () => {
    const plan = buildOfficialStadiumEnrichmentPlan([
      {
        footballDataId: 537327,
        id: "match-1",
        matchNumber: 1,
        rawJson: {
          venue: "Estadio Azteca",
        },
        stage: "GROUP_STAGE",
      },
      {
        footballDataId: 537334,
        id: "match-8",
        matchNumber: 1,
        rawJson: {},
        stage: "GROUP_STAGE",
      },
    ]);

    expect(plan.assignedFromFootballDataVenue).toBe(1);
    expect(plan.assignedFromOfficialVenueMap).toBe(1);
    expect(plan.assignments).toEqual([
      expect.objectContaining({
        fifaMatchNumber: 1,
        matchId: "match-1",
        source: "football-data-match-venue",
        venueKey: "mexico-city-stadium",
      }),
      expect.objectContaining({
        fifaMatchNumber: 8,
        matchId: "match-8",
        source: "official-fifa-schedule",
        venueKey: "san-francisco-bay-area-stadium",
      }),
    ]);
  });

  it("reports Football-Data discrepancies while keeping the FIFA assignment", () => {
    const plan = buildOfficialStadiumEnrichmentPlan([
      {
        footballDataId: 537327,
        id: "match-1",
        matchNumber: 1,
        rawJson: {
          venue: "Miami Stadium",
        },
        stage: "GROUP_STAGE",
      },
    ]);

    expect(plan.assignments).toEqual([
      expect.objectContaining({
        matchId: "match-1",
        venueKey: "mexico-city-stadium",
      }),
    ]);
    expect(plan.discrepancies).toEqual([
      {
        fifaVenue: "Mexico City Stadium",
        footballDataVenue: "Miami Stadium",
        matchId: "match-1",
        matchNumber: 1,
      },
    ]);
  });

  it("reports missing FIFA numbers without guessing and skips local-only rows", () => {
    const plan = buildOfficialStadiumEnrichmentPlan([
      {
        footballDataId: 999999,
        id: "unknown-official-match",
        matchNumber: null,
        rawJson: {
          venue: "Miami Stadium",
        },
        stage: "GROUP_STAGE",
      },
      {
        footballDataId: null,
        id: "local-seed-match",
        matchNumber: null,
        rawJson: null,
        stage: "GROUP_STAGE",
      },
    ]);

    expect(plan.assignments).toHaveLength(0);
    expect(plan.missingAssignments).toEqual([
      {
        footballDataId: 999999,
        matchId: "unknown-official-match",
        matchNumber: null,
        reason: "missing-fifa-match-number",
      },
    ]);
    expect(plan.skippedLocalMatches).toBe(1);
  });

  it("does not mutate input rows while building a repeatable assignment plan", () => {
    const matches = [
      {
        footballDataId: 537327,
        id: "match-1",
        matchNumber: 1,
        rawJson: {
          venue: "Estadio Azteca",
        },
        stage: "GROUP_STAGE",
      },
    ] as const;
    const snapshot = structuredClone(matches);

    expect(buildOfficialStadiumEnrichmentPlan(matches)).toEqual(
      buildOfficialStadiumEnrichmentPlan(matches),
    );
    expect(matches).toEqual(snapshot);
  });
});
