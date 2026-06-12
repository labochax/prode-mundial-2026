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
  compactScoreSummaryLabel: string;
  displayName: string;
  groupLabel: string;
  scoreSummaryLabel: string;
};

const defaultIdentity: ShellPlayerIdentity = {
  avatar: {
    ...defaultStitchAvatar,
    kind: "stitch",
  },
  compactScoreSummaryLabel: "0 pts",
  displayName: "Jugador invitado",
  groupLabel: "Grupo privado",
  scoreSummaryLabel: "0 puntos",
};

type ShellPlayerStanding = {
  rank: number | null;
  totalPoints: number;
};

function getEmailPrefix(email: string | null) {
  return email?.split("@")[0] || null;
}

function getStitchAvatar(value: string | null) {
  return stitchAvatarAssets.find((avatar) => avatar.id === value) ?? defaultStitchAvatar;
}

function formatPointsLabel(totalPoints: number) {
  const points = Number.isFinite(totalPoints) ? Math.max(0, totalPoints) : 0;

  return points === 1 ? "1 punto" : `${points} puntos`;
}

function formatCompactPointsLabel(totalPoints: number) {
  const points = Number.isFinite(totalPoints) ? Math.max(0, totalPoints) : 0;

  return points === 1 ? "1 pt" : `${points} pts`;
}

function formatScoreSummary(standing: ShellPlayerStanding) {
  const rank = standing.rank && standing.rank > 0 ? standing.rank : null;

  return {
    compactScoreSummaryLabel: `${formatCompactPointsLabel(standing.totalPoints)}${
      rank ? ` · #${rank}` : ""
    }`,
    scoreSummaryLabel: `${formatPointsLabel(standing.totalPoints)}${
      rank ? ` · Puesto #${rank}` : ""
    }`,
  };
}

export function getShellPlayerIdentity(
  profile: ProfileRow | null,
  standing: ShellPlayerStanding = { rank: null, totalPoints: 0 },
): ShellPlayerIdentity {
  const scoreSummary = formatScoreSummary(standing);

  if (!profile) {
    return {
      ...defaultIdentity,
      ...scoreSummary,
    };
  }

  const displayName =
    profile.display_name || profile.full_name || getEmailPrefix(profile.email) || "Jugador";
  const groupLabel =
    profile.prode_subgroups[0] ||
    profile.prode_subgroup ||
    profile.school_group ||
    "Grupo privado";

  if (profile.avatar_kind === "google" && profile.google_avatar_url) {
    return {
      avatar: {
        alt: `Foto de perfil de ${displayName}`,
        kind: "google",
        src: profile.google_avatar_url,
      },
      ...scoreSummary,
      displayName,
      groupLabel,
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
    ...scoreSummary,
    displayName,
    groupLabel,
  };
}
