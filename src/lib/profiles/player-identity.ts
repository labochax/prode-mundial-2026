import {
  defaultStitchAvatar,
  stitchAvatarAssets,
  type StitchImageAsset,
} from "@/lib/design/stitch-assets";
import type { Database } from "@/lib/supabase/database.types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

type StitchPlayerAvatar = StitchImageAsset & {
  kind: "stitch";
};

type GooglePlayerAvatar = {
  alt: string;
  kind: "google";
  src: string;
};

export type ShellPlayerIdentity = {
  avatar: StitchPlayerAvatar | GooglePlayerAvatar;
  displayName: string;
  groupLabel: string;
  pointsLabel: string;
};

const defaultIdentity: ShellPlayerIdentity = {
  avatar: {
    ...defaultStitchAvatar,
    kind: "stitch",
  },
  displayName: "Jugador invitado",
  groupLabel: "Grupo privado",
  pointsLabel: "0 puntos",
};

function getEmailPrefix(email: string | null) {
  return email?.split("@")[0] || null;
}

function getStitchAvatar(value: string | null) {
  return stitchAvatarAssets.find((avatar) => avatar.id === value) ?? defaultStitchAvatar;
}

export function getShellPlayerIdentity(profile: ProfileRow | null): ShellPlayerIdentity {
  if (!profile) {
    return defaultIdentity;
  }

  const displayName =
    profile.display_name || profile.full_name || getEmailPrefix(profile.email) || "Jugador";
  const groupLabel = profile.prode_subgroup || profile.school_group || "Grupo privado";

  if (profile.avatar_kind === "google" && profile.google_avatar_url) {
    return {
      avatar: {
        alt: `Foto de perfil de ${displayName}`,
        kind: "google",
        src: profile.google_avatar_url,
      },
      displayName,
      groupLabel,
      pointsLabel: defaultIdentity.pointsLabel,
    };
  }

  const stitchAvatar = getStitchAvatar(profile.avatar_value);

  return {
    avatar: {
      alt: stitchAvatar.alt,
      height: stitchAvatar.height,
      kind: "stitch",
      src: stitchAvatar.src,
      width: stitchAvatar.width,
    },
    displayName,
    groupLabel,
    pointsLabel: defaultIdentity.pointsLabel,
  };
}
