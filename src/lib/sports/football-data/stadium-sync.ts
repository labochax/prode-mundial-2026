import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getMatchVenueNameFromRawJson,
  mapFootballDataVenueToStadiumCandidate,
  normalizeVenueName,
} from "@/lib/sports/football-data/stadiums";
import type { FootballDataMatchCandidate } from "@/lib/sports/football-data/types";
import type { Database } from "@/lib/supabase/database.types";

type SupabaseAdminClient = SupabaseClient<Database>;
type StadiumRow = Database["public"]["Tables"]["stadiums"]["Row"];

export type FootballDataStadiumSyncResult = {
  stadiumIdsByVenue: Map<string, string>;
  stadiumsUpserted: number;
};

function getCandidateVenueName(match: FootballDataMatchCandidate) {
  return match.venue_name ?? getMatchVenueNameFromRawJson(match.raw_json);
}

export function getStadiumIdForMatchCandidate(
  match: FootballDataMatchCandidate,
  stadiumIdsByVenue: Map<string, string>,
) {
  const venueName = getCandidateVenueName(match);

  return venueName ? stadiumIdsByVenue.get(normalizeVenueName(venueName)) ?? null : null;
}

export async function syncFootballDataMatchStadiums(
  client: SupabaseAdminClient,
  matches: FootballDataMatchCandidate[],
): Promise<FootballDataStadiumSyncResult> {
  const venues = [
    ...new Set(
      matches
        .map(getCandidateVenueName)
        .filter((venueName): venueName is string => Boolean(venueName)),
    ),
  ];

  if (venues.length === 0) {
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
  let stadiumsUpserted = 0;

  for (const venueName of venues) {
    const candidate = mapFootballDataVenueToStadiumCandidate(venueName);

    if (!candidate) {
      continue;
    }

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

    stadiumIdsByVenue.set(normalizeVenueName(venueName), stadiumId);
    stadiumIdsByVenue.set(candidateKey, stadiumId);
    resolvedStadiumIdsByName.set(candidateKey, stadiumId);
    stadiumsUpserted = resolvedStadiumIdsByName.size;
  }

  return {
    stadiumIdsByVenue,
    stadiumsUpserted,
  };
}
