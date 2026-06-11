"use client";

import { RotateCcw, Save } from "lucide-react";

import { cn } from "@/lib/utils";

type DashboardBatchSaveBarProps = {
  dirtyCount: number;
  disabled?: boolean;
  isPending?: boolean;
  message: string | null;
  missingDefaultCount: number;
  onDiscard: () => void;
  onSave: () => void;
  status: "error" | "idle" | "partial" | "success";
};

export function DashboardBatchSaveBar({
  dirtyCount,
  disabled,
  isPending,
  message,
  missingDefaultCount,
  onDiscard,
  onSave,
  status,
}: DashboardBatchSaveBarProps) {
  const pendingCount = dirtyCount + missingDefaultCount;

  if (pendingCount <= 0 && !message) {
    return null;
  }

  const hasDirtyChanges = dirtyCount > 0;
  const hasPendingPredictions = pendingCount > 0;
  const pendingLabel =
    dirtyCount > 0 && missingDefaultCount > 0
      ? `${dirtyCount} cambios + ${missingDefaultCount} pendientes 0-0`
      : dirtyCount > 0
        ? `${dirtyCount} cambios sin guardar`
        : `${missingDefaultCount} predicciones pendientes`;

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
              {hasPendingPredictions ? pendingLabel : "Predicciones guardadas"}
            </p>
            {message && (
              <p className="mt-1 line-clamp-2 font-body text-xs leading-4 text-prode-black/75 sm:text-sm sm:leading-5">
                {message}
              </p>
            )}
          </div>

          {hasPendingPredictions && (
            <div className="grid gap-2 sm:flex sm:shrink-0 sm:items-center">
              {hasDirtyChanges && (
                <button
                  className="prode-frame prode-pressable inline-flex min-h-10 items-center justify-center gap-2 bg-[#f7f4df] px-3 py-2 font-technical text-[0.68rem] font-black uppercase outline-none focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper"
                  disabled={isPending}
                  onClick={onDiscard}
                  type="button"
                >
                  <RotateCcw aria-hidden="true" className="size-4" />
                  Descartar
                </button>
              )}
              <button
                className="prode-frame prode-hard-shadow prode-pressable inline-flex min-h-10 items-center justify-center gap-2 bg-prode-yellow px-3 py-2 font-technical text-[0.68rem] font-black uppercase outline-none focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper disabled:cursor-not-allowed disabled:opacity-60"
                disabled={disabled || isPending}
                onClick={onSave}
                type="button"
              >
                <Save aria-hidden="true" className="size-4" />
                {isPending ? "Guardando..." : "Guardar predicciones"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
