import type { Json } from "@/lib/supabase/database.types";

export type TheSportsDbTeam = {
  idTeam?: string | null;
  strBadge?: string | null;
  strCountry?: string | null;
  strDescriptionEN?: string | null;
  strFanart1?: string | null;
  strFanart2?: string | null;
  strFanart3?: string | null;
  strFanart4?: string | null;
  strLogo?: string | null;
  strSport?: string | null;
  strTeam?: string | null;
  strTeamBadge?: string | null;
  strTeamShort?: string | null;
};

export type TheSportsDbTeamsResponse = {
  teams?: TheSportsDbTeam[] | null;
};

export type TheSportsDbVenue = {
  idVenue?: string | null;
  strCountry?: string | null;
  strDescriptionEN?: string | null;
  strFanart1?: string | null;
  strLocation?: string | null;
  strThumb?: string | null;
  strVenue?: string | null;
};

export type TheSportsDbVenuesResponse = {
  venues?: TheSportsDbVenue[] | null;
};

export type TheSportsDbTeamAssetCandidate = {
  badge_url: string | null;
  flag_url: string | null;
  raw_json: Json;
  sportsdb_id: string;
  team_name: string;
};

export type TheSportsDbVenueAssetCandidate = {
  city: string | null;
  country: string | null;
  image_url: string | null;
  raw_json: Json;
  sportsdb_id: string;
  stadium_name: string;
};
