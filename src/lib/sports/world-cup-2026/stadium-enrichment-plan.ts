import type { Json } from "@/lib/supabase/database.types";
import {
  resolveOfficialWorldCupMatchVenue,
  type OfficialWorldCupVenue,
} from "@/lib/sports/world-cup-2026/official-venue-map";

export type OfficialStadiumEnrichmentMatch = {
  footballDataId: number | null;
  id: string;
  matchNumber: number | null;
  rawJson: Json | null;
  stage: string | null;
};

export type OfficialStadiumEnrichmentAssignment = {
  fifaMatchNumber: number;
  matchId: string;
  source: "football-data-match-venue" | "official-fifa-schedule";
  venue: OfficialWorldCupVenue;
  venueKey: string;
};

export type OfficialStadiumEnrichmentDiscrepancy = {
  fifaVenue: string;
  footballDataVenue: string;
  matchId: string;
  matchNumber: number;
};

export type OfficialStadiumEnrichmentMissingAssignment = {
  footballDataId: number;
  matchId: string;
  matchNumber: number | null;
  reason: "missing-fifa-match-number" | "missing-fifa-venue";
};

export type OfficialStadiumEnrichmentPlan = {
  assignedFromFootballDataVenue: number;
  assignedFromOfficialVenueMap: number;
  assignments: OfficialStadiumEnrichmentAssignment[];
  checkedMatches: number;
  discrepancies: OfficialStadiumEnrichmentDiscrepancy[];
  missingAssignments: OfficialStadiumEnrichmentMissingAssignment[];
  skippedLocalMatches: number;
};

export function buildOfficialStadiumEnrichmentPlan(
  matches: readonly OfficialStadiumEnrichmentMatch[],
): OfficialStadiumEnrichmentPlan {
  const plan: OfficialStadiumEnrichmentPlan = {
    assignedFromFootballDataVenue: 0,
    assignedFromOfficialVenueMap: 0,
    assignments: [],
    checkedMatches: 0,
    discrepancies: [],
    missingAssignments: [],
    skippedLocalMatches: 0,
  };

  for (const match of matches) {
    if (typeof match.footballDataId !== "number") {
      plan.skippedLocalMatches += 1;
      continue;
    }

    plan.checkedMatches += 1;

    const resolution = resolveOfficialWorldCupMatchVenue({
      footballDataId: match.footballDataId,
      matchNumber: match.matchNumber,
      rawJson: match.rawJson,
      stage: match.stage,
    });

    if (
      !resolution.venue ||
      !resolution.source ||
      !resolution.fifaMatchNumber ||
      resolution.missingReason
    ) {
      plan.missingAssignments.push({
        footballDataId: match.footballDataId,
        matchId: match.id,
        matchNumber: resolution.fifaMatchNumber ?? match.matchNumber,
        reason: resolution.missingReason ?? "missing-fifa-venue",
      });
      continue;
    }

    plan.assignments.push({
      fifaMatchNumber: resolution.fifaMatchNumber,
      matchId: match.id,
      source: resolution.source,
      venue: resolution.venue,
      venueKey: resolution.venue.key,
    });

    if (resolution.source === "football-data-match-venue") {
      plan.assignedFromFootballDataVenue += 1;
    } else {
      plan.assignedFromOfficialVenueMap += 1;
    }

    if (resolution.discrepancy) {
      plan.discrepancies.push({
        ...resolution.discrepancy,
        matchId: match.id,
        matchNumber: resolution.fifaMatchNumber,
      });
    }
  }

  return plan;
}
