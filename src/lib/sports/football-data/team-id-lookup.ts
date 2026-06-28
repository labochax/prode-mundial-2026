import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { FootballDataTeamIdLookup } from "@/lib/sports/football-data/result-update-row";
import type { FootballDataMatchCandidate } from "@/lib/sports/football-data/types";
import type { Database } from "@/lib/supabase/database.types";

type SupabaseAdminClient = SupabaseClient<Database>;

export function getRelatedTeamIds(matches: FootballDataMatchCandidate[]) {
  return matches.flatMap((match) =>
    [
      match.home_team_football_data_id,
      match.away_team_football_data_id,
    ].filter((value): value is number => typeof value === "number"),
  );
}

export async function getTeamIdLookup(
  client: SupabaseAdminClient,
  footballDataTeamIds: number[],
): Promise<FootballDataTeamIdLookup> {
  const uniqueIds = [...new Set(footballDataTeamIds)];

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const { data, error } = await client
    .from("teams")
    .select("id, football_data_id")
    .in("football_data_id", uniqueIds);

  if (error) {
    throw error;
  }

  return new Map(
    data
      .filter((team) => typeof team.football_data_id === "number")
      .map((team) => [team.football_data_id as number, team.id]),
  );
}
