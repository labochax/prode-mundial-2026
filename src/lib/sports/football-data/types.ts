import type { Json } from "@/lib/supabase/database.types";

export type FootballDataArea = {
  code?: string | null;
  flag?: string | null;
  id?: number | null;
  name?: string | null;
};

export type FootballDataCompetition = {
  code?: string | null;
  id?: number | null;
  name?: string | null;
  type?: string | null;
};

export type FootballDataSeason = {
  currentMatchday?: number | null;
  endDate?: string | null;
  id?: number | null;
  startDate?: string | null;
  winner?: unknown;
};

export type FootballDataTeam = {
  address?: string | null;
  area?: FootballDataArea | null;
  clubColors?: string | null;
  coach?: unknown;
  crest?: string | null;
  founded?: number | null;
  id: number;
  name: string;
  shortName?: string | null;
  tla?: string | null;
  venue?: string | null;
  website?: string | null;
};

export type FootballDataTeamsResponse = {
  competition?: FootballDataCompetition;
  count?: number;
  filters?: Record<string, unknown>;
  season?: FootballDataSeason;
  teams?: FootballDataTeam[];
};

export type FootballDataMatchScoreSide = {
  away?: number | null;
  home?: number | null;
};

export type FootballDataMatchScore = {
  duration?: string | null;
  fullTime?: FootballDataMatchScoreSide | null;
  halfTime?: FootballDataMatchScoreSide | null;
  regularTime?: FootballDataMatchScoreSide | null;
  winner?: "AWAY_TEAM" | "DRAW" | "HOME_TEAM" | null;
};

export type FootballDataMatchTeam = {
  crest?: string | null;
  id?: number | null;
  name?: string | null;
  shortName?: string | null;
  tla?: string | null;
};

export type FootballDataMatchStatus =
  | "AWARDED"
  | "CANCELLED"
  | "EXTRA_TIME"
  | "FINISHED"
  | "IN_PLAY"
  | "PAUSED"
  | "PENALTY_SHOOTOUT"
  | "POSTPONED"
  | "SCHEDULED"
  | "SUSPENDED"
  | "TIMED";

export type FootballDataMatch = {
  area?: FootballDataArea | null;
  awayTeam?: FootballDataMatchTeam | null;
  competition?: FootballDataCompetition | null;
  group?: string | null;
  homeTeam?: FootballDataMatchTeam | null;
  id: number;
  lastUpdated?: string | null;
  matchday?: number | null;
  minute?: number | null;
  score?: FootballDataMatchScore | null;
  season?: FootballDataSeason | null;
  stage?: string | null;
  status?: FootballDataMatchStatus | string | null;
  utcDate: string;
};

export type FootballDataMatchesResponse = {
  competition?: FootballDataCompetition;
  filters?: Record<string, unknown>;
  matches?: FootballDataMatch[];
  resultSet?: {
    count?: number;
    first?: string | null;
    last?: string | null;
    played?: number;
  };
};

export type FootballDataRateLimitInfo = {
  apiVersion: string | null;
  authenticatedClient: string | null;
  requestCounterReset: string | null;
  requestsAvailableMinute: string | null;
  requestsAvailable: string | null;
};

export type FootballDataTeamCandidate = {
  badge_url: string | null;
  flag_url: string | null;
  football_data_id: number;
  name_en: string | null;
  name_es: string;
  raw_json: Json;
  short_name: string | null;
  tla: string | null;
};

export type FootballDataMatchCandidate = {
  away_score: number | null;
  away_team_football_data_id: number | null;
  football_data_id: number;
  group_code: string | null;
  home_score: number | null;
  home_team_football_data_id: number | null;
  kickoff_at: string;
  last_synced_at: string;
  match_number: number | null;
  minute: number | null;
  raw_json: Json;
  stage: string | null;
  status: FootballDataMatchStatus;
  winner: "AWAY_TEAM" | "DRAW" | "HOME_TEAM" | null;
};

export type FootballDataDryRunPreview = {
  matches: FootballDataMatchCandidate[];
  rateLimit: FootballDataRateLimitInfo;
  teams: FootballDataTeamCandidate[];
};

export type FootballDataFixtureSyncCandidates = {
  fetchedAt: string;
  matches: FootballDataMatchCandidate[];
  rateLimit: {
    matches: FootballDataRateLimitInfo;
    teams: FootballDataRateLimitInfo;
  };
  teams: FootballDataTeamCandidate[];
};

export type FootballDataResultsSyncCandidates = {
  fetchedAt: string;
  matches: FootballDataMatchCandidate[];
  rateLimit: FootballDataRateLimitInfo;
};
