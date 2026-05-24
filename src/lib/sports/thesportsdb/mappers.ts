import type { Json } from "@/lib/supabase/database.types";
import type {
  TheSportsDbTeam,
  TheSportsDbTeamAssetCandidate,
  TheSportsDbVenue,
  TheSportsDbVenueAssetCandidate,
} from "@/lib/sports/thesportsdb/types";

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

function normalizeText(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized && normalized.length > 0 ? normalized : null;
}

export function mapTheSportsDbTeamToAssetCandidate(
  team: TheSportsDbTeam,
): TheSportsDbTeamAssetCandidate | null {
  const sportsdbId = normalizeText(team.idTeam);
  const teamName = normalizeText(team.strTeam);

  if (!sportsdbId || !teamName) {
    return null;
  }

  return {
    badge_url: normalizeText(team.strTeamBadge) ?? normalizeText(team.strBadge),
    flag_url: normalizeText(team.strLogo),
    raw_json: toJson(team),
    sportsdb_id: sportsdbId,
    team_name: teamName,
  };
}

export function mapTheSportsDbVenueToAssetCandidate(
  venue: TheSportsDbVenue,
): TheSportsDbVenueAssetCandidate | null {
  const sportsdbId = normalizeText(venue.idVenue);
  const stadiumName = normalizeText(venue.strVenue);

  if (!sportsdbId || !stadiumName) {
    return null;
  }

  return {
    city: normalizeText(venue.strLocation),
    country: normalizeText(venue.strCountry),
    image_url: normalizeText(venue.strThumb) ?? normalizeText(venue.strFanart1),
    raw_json: toJson(venue),
    sportsdb_id: sportsdbId,
    stadium_name: stadiumName,
  };
}
