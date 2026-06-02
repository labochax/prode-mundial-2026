import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getMatchVenueNameFromRawJson,
  mapOfficialWorldCupVenueToStadiumCandidate,
  normalizeVenueName,
} from "@/lib/sports/football-data/stadiums";
import type { FootballDataMatchCandidate } from "@/lib/sports/football-data/types";
import type { Database } from "@/lib/supabase/database.types";
import { resolveOfficialWorldCupMatchVenue } from "@/lib/sports/world-cup-2026/official-venue-map";

type SupabaseAdminClient = SupabaseClient<Database>;
type StadiumRow = Database["public"]["Tables"]["stadiums"]["Row"];

export type FootballDataStadiumSyncResult = {
  stadiumIdsByVenue: Map<string, string>;
  stadiumsUpserted: number;
};

function getMatchStadiumResolution(match: FootballDataMatchCandidate) {
  return resolveOfficialWorldCupMatchVenue({
    footballDataId: match.football_data_id,
    footballDataVenue: match.venue_name,
    matchNumber: match.match_number,
    rawJson: match.raw_json,
    stage: match.stage,
  });
}

export function getStadiumIdForMatchCandidate(
  match: FootballDataMatchCandidate,
  stadiumIdsByVenue: Map<string, string>,
) {
  const resolution = getMatchStadiumResolution(match);

  return resolution.venue
    ? stadiumIdsByVenue.get(normalizeVenueName(resolution.venue.fifaName)) ?? null
    : null;
}

export async function syncFootballDataMatchStadiums(
  client: SupabaseAdminClient,
  matches: FootballDataMatchCandidate[],
): Promise<FootballDataStadiumSyncResult> {
  const venueResolutions = [
    ...new Map(
      matches
        .map((match) => ({
          footballDataVenue:
            match.venue_name ?? getMatchVenueNameFromRawJson(match.raw_json),
          resolution: getMatchStadiumResolution(match),
        }))
        .filter(
          (
            item,
          ): item is typeof item & {
            resolution: typeof item.resolution & {
              fifaMatchNumber: number;
              source: "football-data-match-venue" | "official-fifa-schedule";
              venue: NonNullable<typeof item.resolution.venue>;
            };
          } =>
            Boolean(
              item.resolution.venue &&
                item.resolution.source &&
                item.resolution.fifaMatchNumber,
            ),
        )
        .map((item) => [item.resolution.venue.key, item]),
    ).values(),
  ];

  if (venueResolutions.length === 0) {
    return {
      stadiumIdsByVenue: new Map(),
      stadiumsUpserted: 0,
    };
  }

  const { data, error } = await client.from("stadiums").select("*");

  if (error) {
    throw error;
  }

  const stadiumsByName = new Map(
    (data as StadiumRow[]).map((stadium) => [normalizeVenueName(stadium.name), stadium]),
  );
  const stadiumIdsByVenue = new Map<string, string>();
  const resolvedStadiumIdsByName = new Map<string, string>();

  for (const { footballDataVenue, resolution } of venueResolutions) {
    const candidate = mapOfficialWorldCupVenueToStadiumCandidate(
      resolution.venue,
      {
        fifaMatchNumber: resolution.fifaMatchNumber,
        footballDataVenue,
        source: resolution.source,
      },
    );
    const candidateKey = normalizeVenueName(candidate.name);
    const existing = stadiumsByName.get(candidateKey);
    let stadiumId = resolvedStadiumIdsByName.get(candidateKey);

    if (!stadiumId && existing) {
      const { error: updateError } = await client
        .from("stadiums")
        .update(candidate)
        .eq("id", existing.id);

      if (updateError) {
        throw updateError;
      }

      stadiumId = existing.id;
    } else if (!stadiumId) {
      const { data: inserted, error: insertError } = await client
        .from("stadiums")
        .insert(candidate)
        .select("id")
        .single();

      if (insertError) {
        throw insertError;
      }

      stadiumId = inserted.id;
      stadiumsByName.set(candidateKey, {
        ...candidate,
        created_at: "",
        id: stadiumId,
        image_url: null,
        updated_at: "",
      });
    }

    stadiumIdsByVenue.set(candidateKey, stadiumId);
    resolvedStadiumIdsByName.set(candidateKey, stadiumId);
  }

  return {
    stadiumIdsByVenue,
    stadiumsUpserted: resolvedStadiumIdsByName.size,
  };
}
