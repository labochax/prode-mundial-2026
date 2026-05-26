import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import {
  getTournamentLockState as getPureTournamentLockState,
  type TournamentLockState,
} from "@/lib/tournament/tournament-lock";

type SupabaseDatabaseClient = SupabaseClient<Database>;
export type TournamentPredictionRow =
  Database["public"]["Tables"]["tournament_predictions"]["Row"];

export async function getCurrentTournamentPrediction(
  client: SupabaseDatabaseClient,
  poolId: string,
): Promise<TournamentPredictionRow | null> {
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return null;
  }

  const { data, error } = await client
    .from("tournament_predictions")
    .select("*")
    .eq("pool_id", poolId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getTournamentLockAt(
  client: SupabaseDatabaseClient,
): Promise<string | null> {
  const { data, error } = await client.rpc("get_tournament_lock_at");

  if (error) {
    return null;
  }

  return data;
}

export async function getTournamentLockState(
  client: SupabaseDatabaseClient,
): Promise<TournamentLockState> {
  const lockAt = await getTournamentLockAt(client);
  const { data, error } = await client
    .from("matches")
    .select("football_data_id,raw_json,status");

  if (error) {
    throw error;
  }

  return getPureTournamentLockState({
    lockAt,
    matches: data ?? [],
  });
}
