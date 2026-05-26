import type { StitchAvatarAsset } from "@/lib/design/stitch-assets";

export type LeaderboardMode = "global" | "groups";
export type LeaderboardResultMarker = "exact" | "miss" | "outcome";
export type LeaderboardTrendDirection = "down" | "same" | "up";
export type LeaderboardGroupDimension =
  | "ageGroup"
  | "city"
  | "country"
  | "favoriteTeam"
  | "province"
  | "school"
  | "subgroup";

export type LeaderboardGoogleAvatar = {
  alt: string;
  kind: "google";
  src: string;
};

export type LeaderboardStitchAvatar = StitchAvatarAsset & {
  kind: "stitch";
};

export type LeaderboardAvatar =
  | LeaderboardGoogleAvatar
  | LeaderboardStitchAvatar;

export type LeaderboardPlayer = {
  avatar: LeaderboardAvatar;
  exactHits: number;
  groupName: string;
  groups: {
    age: number | null;
    city: string | null;
    country: string | null;
    favoriteTeam: string | null;
    province: string | null;
    school: string | null;
    subgroups: string[];
  };
  id: string;
  isCurrentPlayer?: boolean;
  lastFive: LeaderboardResultMarker[];
  matchPoints: number;
  miMundialBonusPoints: number;
  name: string;
  outcomeHits: number;
  predictedMatchesCount: number;
  rank: number;
  totalPoints: number;
  trend: {
    direction: LeaderboardTrendDirection;
    value: number;
  };
};
