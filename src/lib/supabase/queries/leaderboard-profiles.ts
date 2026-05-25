import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizeProfileSubgroups } from "@/lib/profiles/profile-normalization";
import type { Database } from "@/lib/supabase/database.types";

type SupabaseDatabaseClient = SupabaseClient<Database>;
type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  | "age"
  | "city"
  | "country"
  | "favorite_team"
  | "id"
  | "prode_subgroup"
  | "prode_subgroups"
  | "province"
  | "school_group"
>;

export type LeaderboardProfileGroups = {
  age: number | null;
  city: string | null;
  country: string | null;
  favoriteTeam: string | null;
  province: string | null;
  school: string | null;
  subgroups: string[];
};

export async function getPoolLeaderboardProfileGroups(
  client: SupabaseDatabaseClient,
  poolId: string,
) {
  const { data, error } = await client
    .from("pool_memberships")
    .select(
      `
        user_id,
        profile:profiles!pool_memberships_user_id_fkey(
          id,
          age,
          favorite_team,
          school_group,
          country,
          province,
          city,
          prode_subgroup,
          prode_subgroups
        )
      `,
    )
    .eq("pool_id", poolId);

  if (error) {
    throw error;
  }

  const groupsByUserId = new Map<string, LeaderboardProfileGroups>();

  for (const membership of data ?? []) {
    const profile = membership.profile as ProfileRow | null;

    if (!profile) {
      continue;
    }

    groupsByUserId.set(membership.user_id, {
      age: profile.age,
      city: profile.city,
      country: profile.country,
      favoriteTeam: profile.favorite_team,
      province: profile.province,
      school: profile.school_group,
      subgroups: normalizeProfileSubgroups([
        ...(profile.prode_subgroups ?? []),
        profile.prode_subgroup ?? "",
      ]),
    });
  }

  return groupsByUserId;
}
