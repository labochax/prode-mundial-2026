export const FOOTBALL_DATA_PROVIDER = {
  name: "Football-Data.org",
  purpose: "fixtures-and-results",
} as const;

// Future sync code must run server-side and read FOOTBALL_DATA_API_TOKEN there.
export type {
  FootballDataFixtureSyncCandidates,
  FootballDataMatchCandidate,
  FootballDataMatchStatus,
  FootballDataResultsSyncCandidates,
  FootballDataTeamCandidate,
} from "@/lib/sports/football-data/types";
export {
  mapFootballDataMatchToCandidate,
  mapFootballDataTeamToCandidate,
} from "@/lib/sports/football-data/mappers";
