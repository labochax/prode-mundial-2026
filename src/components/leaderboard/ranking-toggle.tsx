"use client";

import { Globe2, UsersRound } from "lucide-react";

import type { LeaderboardMode } from "@/lib/leaderboard/leaderboard-types";
import { cn } from "@/lib/utils";

type RankingToggleProps = {
  mode: LeaderboardMode;
  onModeChange: (mode: LeaderboardMode) => void;
};

const rankingModes = [
  {
    icon: Globe2,
    label: "Global",
    value: "global",
  },
  {
    icon: UsersRound,
    label: "Grupos",
    value: "groups",
  },
] as const;

export function RankingToggle({ mode, onModeChange }: RankingToggleProps) {
  return (
    <div
      aria-label="Cambiar modo de ranking"
      className="inline-flex gap-2"
      role="group"
    >
      {rankingModes.map(({ icon: Icon, label, value }) => {
        const isActive = mode === value;

        return (
          <button
            aria-pressed={isActive}
            className={cn(
              "prode-frame prode-pressable inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2 font-technical text-xs font-bold uppercase text-prode-black outline-none focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper",
              isActive
                ? "prode-hard-shadow bg-prode-black text-prode-yellow"
                : "bg-prode-surface hover:bg-prode-yellow",
            )}
            key={value}
            onClick={() => onModeChange(value)}
            type="button"
          >
            <Icon aria-hidden="true" className="size-4 stroke-[3]" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
