"use client";

import { useFormStatus } from "react-dom";

import {
  finalizeMatchAndScoreAction,
  syncResultsFromAdminAction,
} from "@/app/actions/admin-results";
import { ProdeButton } from "@/components/prode/prode-button";
import { ProdeInput } from "@/components/prode/prode-field";

function PendingButton({
  disabled = false,
  idleLabel,
  pendingLabel,
}: {
  disabled?: boolean;
  idleLabel: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <ProdeButton
      className="w-full"
      disabled={disabled || pending}
      size="large"
      type="submit"
    >
      {pending ? pendingLabel : idleLabel}
    </ProdeButton>
  );
}

export function AdminResultsSyncForm() {
  return (
    <form action={syncResultsFromAdminAction}>
      <PendingButton
        idleLabel="Sincronizar Football-Data"
        pendingLabel="Sincronizando..."
      />
    </form>
  );
}

export function AdminFinalizeMatchForm({
  awayName,
  currentAwayScore,
  currentHomeScore,
  disabled,
  homeName,
  matchId,
}: {
  awayName: string;
  currentAwayScore: number | null;
  currentHomeScore: number | null;
  disabled: boolean;
  homeName: string;
  matchId: string;
}) {
  return (
    <form
      action={finalizeMatchAndScoreAction}
      className="grid gap-4"
      onSubmit={(event) => {
        const formData = new FormData(event.currentTarget);
        const homeScore = String(formData.get("home_score") ?? "");
        const awayScore = String(formData.get("away_score") ?? "");
        const confirmed = window.confirm(
          `Confirmar resultado oficial: ${homeName} ${homeScore} - ${awayScore} ${awayName}`,
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input name="match_id" type="hidden" value={matchId} />
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-2 font-technical text-xs font-bold uppercase">
          <span className="truncate">{homeName}</span>
          <ProdeInput
            className="text-center font-display text-3xl"
            defaultValue={currentHomeScore ?? 0}
            disabled={disabled}
            inputMode="numeric"
            max={99}
            min={0}
            name="home_score"
            required
            step={1}
            type="number"
          />
        </label>
        <label className="grid gap-2 font-technical text-xs font-bold uppercase">
          <span className="truncate">{awayName}</span>
          <ProdeInput
            className="text-center font-display text-3xl"
            defaultValue={currentAwayScore ?? 0}
            disabled={disabled}
            inputMode="numeric"
            max={99}
            min={0}
            name="away_score"
            required
            step={1}
            type="number"
          />
        </label>
      </div>
      <PendingButton
        disabled={disabled}
        idleLabel="Finalizar y puntuar"
        pendingLabel="Finalizando..."
      />
    </form>
  );
}
