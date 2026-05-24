import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type SupabaseDatabaseClient = SupabaseClient<Database>;

export async function getMatches(client: SupabaseDatabaseClient) {
  const { data, error } = await client.from("matches").select("*").order("kickoff_at", {
    ascending: true,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function getMatchById(client: SupabaseDatabaseClient, matchId: string) {
  const { data, error } = await client.from("matches").select("*").eq("id", matchId).maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
