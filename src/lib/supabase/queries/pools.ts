import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type SupabaseDatabaseClient = SupabaseClient<Database>;
type PoolRow = Database["public"]["Tables"]["pools"]["Row"];
type PoolMembershipRow = Database["public"]["Tables"]["pool_memberships"]["Row"];

export const DEFAULT_POOL_SLUG = "prode-mundial-2026";

export type DefaultPoolMembershipResult = {
  membership: PoolMembershipRow;
  membershipStatus: "created" | "existing";
  pool: PoolRow;
};

export async function getOrJoinDefaultPoolWithMembership(
  client: SupabaseDatabaseClient,
): Promise<DefaultPoolMembershipResult> {
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("No hay una sesión activa.");
  }

  const { data: pool, error: poolError } = await client
    .from("pools")
    .select("*")
    .eq("slug", DEFAULT_POOL_SLUG)
    .single();

  if (poolError) {
    throw poolError;
  }

  const { data: membership, error: membershipError } = await client
    .from("pool_memberships")
    .select("*")
    .eq("pool_id", pool.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    throw membershipError;
  }

  if (membership) {
    return {
      membership,
      membershipStatus: "existing",
      pool,
    };
  }

  const { data: createdMembership, error: insertError } = await client
    .from("pool_memberships")
    .insert({
      pool_id: pool.id,
      role: "member",
      user_id: user.id,
    })
    .select("*")
    .single();

  if (insertError && insertError.code !== "23505") {
    throw insertError;
  }

  if (createdMembership) {
    return {
      membership: createdMembership,
      membershipStatus: "created",
      pool,
    };
  }

  const { data: existingMembershipAfterRace, error: raceReadError } = await client
    .from("pool_memberships")
    .select("*")
    .eq("pool_id", pool.id)
    .eq("user_id", user.id)
    .single();

  if (raceReadError) {
    throw raceReadError;
  }

  return {
    membership: existingMembershipAfterRace,
    membershipStatus: "existing",
    pool,
  };
}

export async function getOrJoinDefaultPool(
  client: SupabaseDatabaseClient,
): Promise<PoolRow> {
  const { pool } = await getOrJoinDefaultPoolWithMembership(client);

  return pool;
}

export async function getPoolMembershipForUser(
  client: SupabaseDatabaseClient,
  poolId: string,
  userId: string,
) {
  const { data, error } = await client
    .from("pool_memberships")
    .select("*")
    .eq("pool_id", poolId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
