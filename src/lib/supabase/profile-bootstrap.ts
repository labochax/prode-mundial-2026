import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type SupabaseDatabaseClient = SupabaseClient<Database>;
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

function readMetadataString(user: User, key: string): string | null {
  const value = user.user_metadata?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getProfileInsertFromUser(user: User): ProfileInsert {
  const email = user.email ?? readMetadataString(user, "email");
  const fullName =
    readMetadataString(user, "full_name") ??
    readMetadataString(user, "name") ??
    readMetadataString(user, "preferred_username");
  const googleAvatarUrl =
    readMetadataString(user, "avatar_url") ??
    readMetadataString(user, "picture") ??
    readMetadataString(user, "photo_url");
  const fallbackDisplayName = email?.split("@")[0] ?? "Jugador";

  return {
    id: user.id,
    email,
    full_name: fullName,
    display_name: fullName ?? fallbackDisplayName,
    google_avatar_url: googleAvatarUrl,
    avatar_kind: googleAvatarUrl ? "google" : "stitch",
    onboarding_completed: false,
  };
}

async function getProfileByUserId(client: SupabaseDatabaseClient, userId: string) {
  const { data, error } = await client.from("profiles").select("*").eq("id", userId).maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export function getProfileRedirectPath(profile: Pick<Profile, "onboarding_completed"> | null) {
  return profile?.onboarding_completed ? "/dashboard" : "/onboarding";
}

export async function ensureCurrentProfile(client: SupabaseDatabaseClient) {
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

  const existingProfile = await getProfileByUserId(client, user.id);

  if (existingProfile) {
    return {
      profile: existingProfile,
      user,
    };
  }

  const { data: createdProfile, error: insertError } = await client
    .from("profiles")
    .insert(getProfileInsertFromUser(user))
    .select("*")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      const profile = await getProfileByUserId(client, user.id);

      if (profile) {
        return {
          profile,
          user,
        };
      }
    }

    throw insertError;
  }

  return {
    profile: createdProfile,
    user,
  };
}
