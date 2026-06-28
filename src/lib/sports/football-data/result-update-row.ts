import type { FootballDataMatchCandidate } from "@/lib/sports/football-data/types";
import type { Database } from "@/lib/supabase/database.types";

type MatchUpdate = Database["public"]["Tables"]["matches"]["Update"];
export type FootballDataTeamIdLookup = ReadonlyMap<number, string>;

export function getFootballDataResultTeamUpdateFields(
  match: FootballDataMatchCandidate,
  teamIds: FootballDataTeamIdLookup,
): Pick<MatchUpdate, "away_team_id" | "home_team_id"> {
  const update: Pick<MatchUpdate, "away_team_id" | "home_team_id"> = {};

  if (typeof match.home_team_football_data_id === "number") {
    const homeTeamId = teamIds.get(match.home_team_football_data_id);

    if (homeTeamId) {
      update.home_team_id = homeTeamId;
    }
  }

  if (typeof match.away_team_football_data_id === "number") {
    const awayTeamId = teamIds.get(match.away_team_football_data_id);

    if (awayTeamId) {
      update.away_team_id = awayTeamId;
    }
  }

  return update;
}

export function getFootballDataResultUpdateRow(
  match: FootballDataMatchCandidate,
  options: {
    stadiumId?: string | null;
    teamIds: FootballDataTeamIdLookup;
  },
): MatchUpdate {
  return {
    away_score: match.away_score,
    home_score: match.home_score,
    kickoff_at: match.kickoff_at,
    last_synced_at: match.last_synced_at,
    minute: match.minute,
    raw_json: match.raw_json,
    status: match.status,
    ...(options.stadiumId ? { stadium_id: options.stadiumId } : {}),
    ...getFootballDataResultTeamUpdateFields(match, options.teamIds),
    winner: match.winner,
  } satisfies MatchUpdate;
}
