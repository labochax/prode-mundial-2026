import type { SupabaseClient } from "@supabase/supabase-js";

import type { MatchWithRelations } from "@/lib/matches/prediction-match";
import type { Database } from "@/lib/supabase/database.types";

type SupabaseDatabaseClient = SupabaseClient<Database>;

const matchWithRelationsSelect = `
  *,
  home_team:teams!matches_home_team_id_fkey(*),
  away_team:teams!matches_away_team_id_fkey(*),
  stadium:stadiums(*)
`;

export async function getMatches(client: SupabaseDatabaseClient) {
  const { data, error } = await client.from("matches").select("*").order("kickoff_at", {
    ascending: true,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function getUpcomingMatchesWithDetails(client: SupabaseDatabaseClient) {
  const { data, error } = await client
    .from("matches")
    .select(matchWithRelationsSelect)
    .order("kickoff_at", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data as MatchWithRelations[];
}

export async function getMatchById(client: SupabaseDatabaseClient, matchId: string) {
  const { data, error } = await client.from("matches").select("*").eq("id", matchId).maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getMatchWithDetailsById(
  client: SupabaseDatabaseClient,
  matchId: string,
) {
  const { data, error } = await client
    .from("matches")
    .select(matchWithRelationsSelect)
    .eq("id", matchId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as MatchWithRelations | null;
}

export async function getNextMatchAfter(
  client: SupabaseDatabaseClient,
  currentKickoffAt: string,
) {
  const { data, error } = await client
    .from("matches")
    .select(matchWithRelationsSelect)
    .gt("kickoff_at", currentKickoffAt)
    .order("kickoff_at", {
      ascending: true,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as MatchWithRelations | null;
}
