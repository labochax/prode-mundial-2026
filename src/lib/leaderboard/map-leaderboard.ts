import {
  defaultStitchAvatar,
  stitchAvatarAssets,
} from "@/lib/design/stitch-assets";
import type {
  LeaderboardAvatar,
  LeaderboardPlayer,
  LeaderboardResultMarker,
} from "@/lib/leaderboard/leaderboard-types";
import type { LeaderboardRankTrend } from "@/lib/leaderboard/leaderboard-points";
import type { LeaderboardProfileGroups } from "@/lib/supabase/queries/leaderboard-profiles";
import type { PoolLeaderboardRow } from "@/lib/supabase/queries/leaderboard";
import { getFallbackRecentResultMarkers } from "@/lib/supabase/queries/leaderboard-recent-results";

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

export function mapPoolLeaderboardRows(
  rows: PoolLeaderboardRow[],
  currentUserId: string,
  groupsByUserId: Map<string, LeaderboardProfileGroups> = new Map(),
  recentMarkersByUserId: Map<string, LeaderboardResultMarker[]> = new Map(),
  trendsByUserId: Map<string, LeaderboardRankTrend> = new Map(),
): LeaderboardPlayer[] {
  return rows.map((row) => {
    const groups = groupsByUserId.get(row.user_id) ?? defaultLeaderboardGroups;
    const lastFive =
      recentMarkersByUserId.get(row.user_id) ?? getFallbackRecentResultMarkers();

    return {
      avatar: resolveLeaderboardAvatar(row),
      exactHits: row.exact_hits,
      groupName: groups.subgroups[0] ?? "Prode Mundial 2026",
      groups,
      id: row.user_id,
      isCurrentPlayer: row.user_id === currentUserId,
      lastFive,
      matchPoints: row.match_points,
      miMundialBonusPoints: row.mi_mundial_bonus_points,
      name: row.display_name,
      outcomeHits: row.outcome_hits,
      predictedMatchesCount: row.predicted_matches_count,
      rank: Number(row.rank),
      totalPoints: row.total_points,
      trend: trendsByUserId.get(row.user_id) ?? { direction: "same", value: 0 },
    };
  });
}
