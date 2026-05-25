import type { Database } from "@/lib/supabase/database.types";
import {
  normalizeProfileSubgroups,
  normalizeProfileText,
} from "@/lib/profiles/profile-normalization";

export const profileAvatarKinds = ["stitch", "google", "upload"] as const;

export type ProfileAvatarKind = (typeof profileAvatarKinds)[number];

export type ProfileAvatarSelection = {
  kind: ProfileAvatarKind;
  value: string;
};

export type ProfileFormValues = {
  age: string;
  avatarKind: ProfileAvatarKind;
  avatarValue: string;
  city: string;
  country: string;
  displayName: string;
  favoriteTeam: string;
  firstName: string;
  googleAvatarUrl: string | null;
  graduationYearOrCategory: string;
  lastName: string;
  prodeSubgroup: string;
  prodeSubgroups: [string, string, string];
  province: string;
  schoolGroup: string;
};

export type ProfileActionStatus = "idle" | "success" | "error";

export type ProfileActionState = {
  fieldErrors?: Partial<Record<string, string[]>>;
  message: string | null;
  status: ProfileActionStatus;
};

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export const initialProfileActionState: ProfileActionState = {
  message: null,
  status: "idle",
};

export const defaultProfileFormValues: ProfileFormValues = {
  age: "",
  avatarKind: "stitch",
  avatarValue: "messi",
  city: "",
  country: "Argentina",
  displayName: "",
  favoriteTeam: "",
  firstName: "",
  googleAvatarUrl: null,
  graduationYearOrCategory: "",
  lastName: "",
  prodeSubgroup: "",
  prodeSubgroups: ["", "", ""],
  province: "",
  schoolGroup: "",
};

function valueOrEmpty(value: string | number | null | undefined) {
  return value == null ? "" : normalizeProfileText(String(value));
}

function normalizeAvatarKind(value: string | null | undefined): ProfileAvatarKind {
  return profileAvatarKinds.includes(value as ProfileAvatarKind)
    ? (value as ProfileAvatarKind)
    : "stitch";
}

function getProfileSubgroups(profile: ProfileRow): [string, string, string] {
  const legacyPrimary = valueOrEmpty(profile.prode_subgroup);
  const rawSubgroups =
    Array.isArray(profile.prode_subgroups) && profile.prode_subgroups.length > 0
      ? profile.prode_subgroups
      : legacyPrimary
        ? [legacyPrimary]
        : [];
  const normalizedSubgroups = normalizeProfileSubgroups(rawSubgroups);

  return [
    normalizedSubgroups[0] ?? "",
    normalizedSubgroups[1] ?? "",
    normalizedSubgroups[2] ?? "",
  ];
}

export function getProfileFormValues(profile: ProfileRow): ProfileFormValues {
  const normalizedAvatarKind = normalizeAvatarKind(profile.avatar_kind);
  const avatarKind =
    normalizedAvatarKind === "google" && profile.google_avatar_url
      ? "google"
      : "stitch";

  return {
    age: valueOrEmpty(profile.age),
    avatarKind,
    avatarValue:
      avatarKind === "google"
        ? profile.google_avatar_url ?? defaultProfileFormValues.avatarValue
        : profile.avatar_value ?? defaultProfileFormValues.avatarValue,
    city: valueOrEmpty(profile.city),
    country: valueOrEmpty(profile.country) || defaultProfileFormValues.country,
    displayName: valueOrEmpty(profile.display_name),
    favoriteTeam: valueOrEmpty(profile.favorite_team),
    firstName: valueOrEmpty(profile.first_name),
    googleAvatarUrl: profile.google_avatar_url,
    graduationYearOrCategory: valueOrEmpty(profile.graduation_year_or_category),
    lastName: valueOrEmpty(profile.last_name),
    prodeSubgroup: valueOrEmpty(profile.prode_subgroup),
    prodeSubgroups: getProfileSubgroups(profile),
    province: valueOrEmpty(profile.province),
    schoolGroup: valueOrEmpty(profile.school_group),
  };
}
