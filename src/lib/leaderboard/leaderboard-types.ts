import type { StitchAvatarAsset } from "@/lib/design/stitch-assets";

export type LeaderboardMode = "friends" | "global";
export type LeaderboardResultMarker = "exact" | "miss" | "outcome";
export type LeaderboardTrendDirection = "down" | "same" | "up";

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
  id: string;
  isCurrentPlayer?: boolean;
  lastFive: LeaderboardResultMarker[];
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
