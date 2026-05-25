import {
  defaultStitchAvatar,
  stitchAvatarAssets,
} from "@/lib/design/stitch-assets";
import type {
  LeaderboardAvatar,
  LeaderboardPlayer,
  LeaderboardResultMarker,
} from "@/lib/leaderboard/leaderboard-types";
import type { LeaderboardProfileGroups } from "@/lib/supabase/queries/leaderboard-profiles";
import type { Database } from "@/lib/supabase/database.types";

type PoolLeaderboardRow =
  Database["public"]["Functions"]["get_pool_leaderboard"]["Returns"][number];

const defaultLeaderboardGroups: LeaderboardPlayer["groups"] = {
  age: null,
  city: null,
  country: null,
  favoriteTeam: null,
  province: null,
  school: null,
  subgroups: [],
};

function isHttpUrl(value: string | null) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function resolveLeaderboardAvatar(row: PoolLeaderboardRow): LeaderboardAvatar {
  if (row.avatar_kind === "google" && isHttpUrl(row.avatar_value)) {
    return {
      alt: `Foto de perfil de ${row.display_name}`,
      kind: "google",
      src: row.avatar_value,
    };
  }

  if (row.avatar_kind === "stitch") {
    const stitchAvatar =
      stitchAvatarAssets.find((avatar) => avatar.id === row.avatar_value) ??
      defaultStitchAvatar;

    return {
      ...stitchAvatar,
      kind: "stitch",
    };
  }

  return {
    ...defaultStitchAvatar,
    kind: "stitch",
  };
}

function getDerivedRecentMarkers(row: PoolLeaderboardRow): LeaderboardResultMarker[] {
  const markers: LeaderboardResultMarker[] = [];

  for (let index = 0; index < row.exact_hits && markers.length < 5; index += 1) {
    markers.push("exact");
  }

  for (let index = 0; index < row.outcome_hits && markers.length < 5; index += 1) {
    markers.push("outcome");
  }

  while (markers.length < 5) {
    markers.push("miss");
  }

  return markers;
}

export function mapPoolLeaderboardRows(
  rows: PoolLeaderboardRow[],
  currentUserId: string,
  groupsByUserId: Map<string, LeaderboardProfileGroups> = new Map(),
): LeaderboardPlayer[] {
  return rows.map((row) => {
    const groups = groupsByUserId.get(row.user_id) ?? defaultLeaderboardGroups;

    return {
      avatar: resolveLeaderboardAvatar(row),
      exactHits: row.exact_hits,
      groupName: groups.subgroups[0] ?? "Prode Mundial 2026",
      groups,
      id: row.user_id,
      isCurrentPlayer: row.user_id === currentUserId,
      lastFive: getDerivedRecentMarkers(row),
      name: row.display_name,
      outcomeHits: row.outcome_hits,
      predictedMatchesCount: row.predicted_matches_count,
      rank: Number(row.rank),
      totalPoints: row.total_points,
      trend: {
        direction: "same",
        value: 0,
      },
    };
  });
}
