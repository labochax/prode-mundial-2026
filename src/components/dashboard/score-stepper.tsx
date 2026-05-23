"use client";

import { Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

type ScoreStepperProps = {
  disabled?: boolean;
  label: string;
  onChange: (value: number) => void;
  size?: "default" | "large";
  value: number;
};

export function ScoreStepper({
  disabled,
  label,
  onChange,
  size = "default",
  value,
}: ScoreStepperProps) {
  const decrement = () => onChange(Math.max(0, value - 1));
  const increment = () => onChange(value + 1);

  return (
    <div className="flex flex-col items-center gap-2">
      <input
        aria-label={`${label}: ${value} goles`}
        className={cn(
          "prode-frame bg-prode-surface text-center font-display leading-none text-prode-black outline-none focus-visible:bg-prode-yellow focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper",
          size === "large"
            ? "size-24 text-6xl sm:size-32 sm:text-7xl"
            : "size-20 text-5xl sm:size-[5.5rem]",
        )}
        inputMode="numeric"
        max={99}
        min={0}
        readOnly
        type="number"
        value={value}
      />

      <div className="flex items-center gap-2">
        <button
          aria-label={`Restar gol a ${label}`}
          className={cn(
            "flex size-9 items-center justify-center rounded-full border-[3px] border-prode-black bg-[#f7f4df] text-prode-black outline-none transition-colors hover:bg-[#e5e3ce] focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper disabled:cursor-not-allowed disabled:opacity-50",
            "motion-safe:transition-transform motion-safe:hover:translate-x-px motion-safe:hover:translate-y-px",
          )}
          disabled={disabled || value === 0}
          onClick={decrement}
          type="button"
        >
          <Minus aria-hidden="true" className="size-4 stroke-[4]" />
        </button>

        <button
          aria-label={`Sumar gol a ${label}`}
          className={cn(
            "flex size-9 items-center justify-center rounded-full border-[3px] border-prode-black bg-prode-yellow text-prode-black outline-none transition-colors hover:bg-[#e9f200] focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper disabled:cursor-not-allowed disabled:opacity-50",
            "motion-safe:transition-transform motion-safe:hover:translate-x-px motion-safe:hover:translate-y-px",
          )}
          disabled={disabled}
          onClick={increment}
          type="button"
        >
          <Plus aria-hidden="true" className="size-4 stroke-[4]" />
        </button>
      </div>
    </div>
  );
}
