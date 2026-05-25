import type { SupabaseClient } from "@supabase/supabase-js";

import type { MatchWithRelations } from "@/lib/matches/prediction-match";
import type { Database, Json } from "@/lib/supabase/database.types";

type SupabaseDatabaseClient = SupabaseClient<Database>;
export type ActiveMatchSource = "official" | "seed";
export type ActiveMatchesWithDetails = {
  matches: MatchWithRelations[];
  source: ActiveMatchSource;
};

const matchWithRelationsSelect = `
  *,
  home_team:teams!matches_home_team_id_fkey(*),
  away_team:teams!matches_away_team_id_fkey(*),
  stadium:stadiums(*)
`;

function isRecord(
  value: Json | undefined,
): value is Record<string, Json | undefined> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSeedFixture(
  match: Pick<MatchWithRelations, "football_data_id" | "raw_json">,
) {
  return (
    match.football_data_id === null ||
    (isRecord(match.raw_json) && typeof match.raw_json.seed_note === "string")
  );
}

function isOfficialFixture(
  match: Pick<MatchWithRelations, "football_data_id" | "raw_json">,
) {
  return match.football_data_id !== null && !isSeedFixture(match);
}

function getActiveMatches(matches: MatchWithRelations[]): ActiveMatchesWithDetails {
  const officialMatches = matches.filter(isOfficialFixture);

  if (officialMatches.length > 0) {
    return {
      matches: officialMatches,
      source: "official",
    };
  }

  return {
    matches: matches.filter(isSeedFixture),
    source: "seed",
  };
}

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

export async function getActiveUpcomingMatchesWithDetails(
  client: SupabaseDatabaseClient,
) {
  const matches = await getUpcomingMatchesWithDetails(client);

  return getActiveMatches(matches);
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

export async function getNextActiveMatchAfter(
  client: SupabaseDatabaseClient,
  currentKickoffAt: string,
) {
  const { matches } = await getActiveUpcomingMatchesWithDetails(client);

  return (
    matches.find(
      (match) =>
        new Date(match.kickoff_at).getTime() >
        new Date(currentKickoffAt).getTime(),
    ) ?? null
  );
}
