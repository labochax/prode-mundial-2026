"use client";

import { RotateCcw, Save } from "lucide-react";

import { cn } from "@/lib/utils";

type DashboardBatchSaveBarProps = {
  dirtyCount: number;
  disabled?: boolean;
  isPending?: boolean;
  message: string | null;
  onDiscard: () => void;
  onSave: () => void;
  status: "error" | "idle" | "partial" | "success";
};

export function DashboardBatchSaveBar({
  dirtyCount,
  disabled,
  isPending,
  message,
  onDiscard,
  onSave,
  status,
}: DashboardBatchSaveBarProps) {
  if (dirtyCount <= 0 && !message) {
    return null;
  }

  const hasDirtyChanges = dirtyCount > 0;

  return (
    <div className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] left-1/2 z-[70] w-[min(calc(100vw-1rem),42rem)] -translate-x-1/2 md:bottom-6 md:left-[calc(50%+7rem)] md:w-[min(42rem,calc(100vw-24rem))]">
      <div
        className={cn(
          "prode-frame prode-hard-shadow border-[3px] px-3 py-2 text-prode-black",
          status === "error" || status === "partial"
            ? "bg-[#ffd8d2]"
            : status === "success"
              ? "bg-prode-yellow"
              : "bg-white",
        )}
        role="status"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-technical text-sm font-black uppercase leading-tight">
              {hasDirtyChanges
                ? `${dirtyCount} cambios sin guardar`
                : "Predicciones guardadas"}
            </p>
            {message && (
              <p className="mt-1 line-clamp-2 font-body text-xs leading-4 text-prode-black/75 sm:text-sm sm:leading-5">
                {message}
              </p>
            )}
          </div>

          {hasDirtyChanges && (
            <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:items-center">
              <button
                className="prode-frame prode-pressable inline-flex min-h-10 items-center justify-center gap-2 bg-[#f7f4df] px-3 py-2 font-technical text-[0.68rem] font-black uppercase outline-none focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper"
                disabled={isPending}
                onClick={onDiscard}
                type="button"
              >
                <RotateCcw aria-hidden="true" className="size-4" />
                Descartar
              </button>
              <button
                className="prode-frame prode-hard-shadow prode-pressable inline-flex min-h-10 items-center justify-center gap-2 bg-prode-yellow px-3 py-2 font-technical text-[0.68rem] font-black uppercase outline-none focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper disabled:cursor-not-allowed disabled:opacity-60"
                disabled={disabled || isPending}
                onClick={onSave}
                type="button"
              >
                <Save aria-hidden="true" className="size-4" />
                {isPending ? "Guardando..." : "Guardar"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}