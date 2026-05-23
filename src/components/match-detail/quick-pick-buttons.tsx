"use client";

import { Flag, Scale } from "lucide-react";

import { cn } from "@/lib/utils";

export type QuickPickValue = "away" | "draw" | "home";

type QuickPickButtonsProps = {
  awayTeamName: string;
  homeTeamName: string;
  onSelect: (value: QuickPickValue) => void;
  selected: QuickPickValue | null;
};

export function QuickPickButtons({
  awayTeamName,
  homeTeamName,
  onSelect,
  selected,
}: QuickPickButtonsProps) {
  const quickPickOptions = [
    {
      icon: Flag,
      label: homeTeamName,
      value: "home",
    },
    {
      icon: Scale,
      label: "Empate",
      value: "draw",
    },
    {
      icon: Flag,
      label: awayTeamName,
      value: "away",
    },
  ] as const;

  return (
    <section className="prode-frame prode-hard-shadow bg-[#e5e3ce] p-4 sm:p-5">
      <h3 className="mb-4 inline-block border-b-[3px] border-prode-black pb-2 font-technical text-xs font-bold uppercase">
        Selección rápida
      </h3>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {quickPickOptions.map(({ icon: Icon, label, value }) => {
          const isSelected = selected === value;

          return (
            <button
              aria-pressed={isSelected}
              className={cn(
                "prode-frame prode-pressable flex min-h-28 flex-col items-center justify-center gap-2 bg-prode-surface p-3 text-prode-black outline-none focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper",
                isSelected && "prode-hard-shadow bg-prode-yellow",
              )}
              key={value}
              onClick={() => onSelect(value)}
              type="button"
            >
              <Icon aria-hidden="true" className="size-8 stroke-[2.5]" />
              <span className="max-w-full truncate font-technical text-xs font-bold uppercase">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
