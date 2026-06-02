import type { Json } from "@/lib/supabase/database.types";
import {
  getOfficialWorldCupVenueByName,
  normalizeOfficialVenueName,
  officialWorldCupVenues,
  type OfficialWorldCupVenue,
} from "@/lib/sports/world-cup-2026/official-venue-map";

export type OfficialWorldCupStadium = {
  aliases: readonly string[];
  city: string;
  country: string;
  name: string;
};

export type FootballDataStadiumCandidate = {
  city: string | null;
  country: string | null;
  name: string;
  raw_json: Json;
};

const countryNameInSpanish = {
  Canada: "Canadá",
  Mexico: "México",
  "United States": "Estados Unidos",
} as const;

export const officialWorldCupStadiums = officialWorldCupVenues.map(
  (venue) =>
    ({
      aliases: venue.aliases,
      city: venue.city,
      country: countryNameInSpanish[venue.country],
      name: venue.fifaName,
    }) satisfies OfficialWorldCupStadium,
);

function isRecord(
  value: Json | null | undefined,
): value is Record<string, Json | undefined> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeVenueName(value: string | null | undefined) {
  return normalizeOfficialVenueName(value);
}

export function getOfficialWorldCupStadium(
  venueName: string | null | undefined,
) {
  const venue = getOfficialWorldCupVenueByName(venueName);

  return venue
    ? {
        aliases: venue.aliases,
        city: venue.city,
        country: countryNameInSpanish[venue.country],
        name: venue.fifaName,
      }
    : null;
}

export function getMatchVenueNameFromRawJson(rawJson: Json | null) {
  if (!isRecord(rawJson)) {
    return null;
  }

  const venue = rawJson.venue;

  return typeof venue === "string" && venue.trim().length > 0
    ? venue.trim()
    : null;
}

export function mapOfficialWorldCupVenueToStadiumCandidate(
  venue: OfficialWorldCupVenue,
  options: {
    fifaMatchNumber?: number | null;
    footballDataVenue?: string | null;
    source: "football-data-match-venue" | "official-fifa-schedule";
  },
): FootballDataStadiumCandidate {
  return {
    city: venue.city,
    country: countryNameInSpanish[venue.country],
    name: venue.fifaName,
    raw_json: {
      fifa_match_number: options.fifaMatchNumber ?? null,
      fifa_venue: venue.fifaName,
      football_data_venue: options.footballDataVenue ?? null,
      source: options.source,
    },
  };
}

export function mapFootballDataVenueToStadiumCandidate(
  venueName: string | null | undefined,
): FootballDataStadiumCandidate | null {
  const normalizedVenueName = venueName?.trim();

  if (!normalizedVenueName) {
    return null;
  }

  const officialVenue = getOfficialWorldCupVenueByName(normalizedVenueName);

  if (officialVenue) {
    return mapOfficialWorldCupVenueToStadiumCandidate(officialVenue, {
      footballDataVenue: normalizedVenueName,
      source: "football-data-match-venue",
    });
  }

  return {
    city: null,
    country: null,
    name: normalizedVenueName,
    raw_json: {
      football_data_venue: normalizedVenueName,
      source: "football-data-match-venue",
    },
  };
}
