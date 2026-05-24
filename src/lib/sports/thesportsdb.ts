export const THE_SPORTS_DB_PROVIDER = {
  name: "TheSportsDB",
  purpose: "visual-assets",
} as const;

// Future asset sync code must avoid leaking THESPORTSDB_API_KEY to the client.
export type {
  TheSportsDbTeamAssetCandidate,
  TheSportsDbVenueAssetCandidate,
} from "@/lib/sports/thesportsdb/types";
export {
  mapTheSportsDbTeamToAssetCandidate,
  mapTheSportsDbVenueToAssetCandidate,
} from "@/lib/sports/thesportsdb/mappers";
