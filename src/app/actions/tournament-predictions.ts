"use server";

import { revalidatePath } from "next/cache";

import type { Json } from "@/lib/supabase/database.types";
import { ensureCurrentProfile } from "@/lib/supabase/profile-bootstrap";
import { getActiveUpcomingMatchesWithDetails } from "@/lib/supabase/queries/matches";
import { getPredictionsForMatches } from "@/lib/supabase/queries/predictions";
import { getOrJoinDefaultPool } from "@/lib/supabase/queries/pools";
import { getTournamentLockState } from "@/lib/supabase/queries/tournament-predictions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { KnockoutSelectionMap } from "@/lib/tournament/knockout-selection";
import { buildTournamentProjection } from "@/lib/tournament/projection";
import { buildTournamentPredictionPayload } from "@/lib/tournament/tournament-prediction-payload";

export type SaveTournamentPredictionActionState = {
  lockedAt?: string | null;
  message: string;
  savedAt?: string | null;
  status: "error" | "success";
};

type SaveTournamentPredictionInput = {
  selections: KnockoutSelectionMap;
};

function normalizeSelections(value: unknown): KnockoutSelectionMap {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] =>
        typeof entry[0] === "string" && typeof entry[1] === "string",
    ),
  );
}

function getErrorDetails(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return {};
  }

  return {
    code:
      "code" in error && typeof error.code === "string" ? error.code : null,
    details:
      "details" in error && typeof error.details === "string"
        ? error.details
        : null,
    hint:
      "hint" in error && typeof error.hint === "string" ? error.hint : null,
    message:
      "message" in error && typeof error.message === "string"
        ? error.message
        : null,
  };
}

function toTournamentPredictionErrorState(
  error: unknown,
): SaveTournamentPredictionActionState {
  const details = getErrorDetails(error);
  const message = (details.message ?? "").toLowerCase();

  if (message.includes("locked") || message.includes("lock")) {
    return {
      message: "La predicción ya está bloqueada",
      status: "error",
    };
  }

  if (details.code === "42501" || message.includes("row-level security")) {
    return {
      message:
        "La base rechazó el guardado por permisos. Recargá la sesión e intentá de nuevo.",
      status: "error",
    };
  }

  return {
    message: "No pudimos guardar Mi Mundial",
    status: "error",
  };
}

export async function saveTournamentPredictionAction(
  input: SaveTournamentPredictionInput,
): Promise<SaveTournamentPredictionActionState> {
  const selections = normalizeSelections(input?.selections);
  const supabase = await createSupabaseServerClient();
  const current = await ensureCurrentProfile(supabase);

  if (!current) {
    return {
      message: "No hay una sesión activa. Volvé a ingresar para guardar.",
      status: "error",
    };
  }

  try {
    const pool = await getOrJoinDefaultPool(supabase);
    const tournamentLockState = await getTournamentLockState(supabase);

    if (!tournamentLockState.lockAt) {
      return {
        message: "No pudimos calcular el cierre de Mi Mundial.",
        status: "error",
      };
    }

    if (tournamentLockState.isLocked) {
      return {
        lockedAt: tournamentLockState.lockAt,
        message: "Mi Mundial ya está bloqueado.",
        status: "error",
      };
    }

    const { matches } = await getActiveUpcomingMatchesWithDetails(supabase);
    const groupMatchIds = matches
      .filter((match) => (match.stage ?? "").toUpperCase().includes("GROUP"))
      .map((match) => match.id);
    const predictionsByMatchId = await getPredictionsForMatches(
      supabase,
      pool.id,
      groupMatchIds,
    );
    const { projectedBracket } = buildTournamentProjection(
      matches,
      predictionsByMatchId,
    );
    const payloadResult = buildTournamentPredictionPayload(
      projectedBracket,
      selections,
    );

    if (payloadResult.status === "error") {
      return {
        message: payloadResult.message,
        status: "error",
      };
    }

    const payload = payloadResult.payload;
    const { data, error } = await supabase
      .from("tournament_predictions")
      .upsert(
        {
          bracket_json: payload.bracket_json as unknown as Json,
          champion_team_id: payload.champion_team_id,
          fourth_place_team_id: payload.fourth_place_team_id,
          pool_id: pool.id,
          quarterfinal_team_ids: payload.quarterfinal_team_ids,
          round_of_16_team_ids: payload.round_of_16_team_ids,
          runner_up_team_id: payload.runner_up_team_id,
          semifinal_team_ids: payload.semifinal_team_ids,
          third_place_team_id: payload.third_place_team_id,
          user_id: current.user.id,
        },
        {
          onConflict: "pool_id,user_id",
        },
      )
      .select("created_at,locked_at,updated_at")
      .single();

    if (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[saveTournamentPredictionAction:write-error]", {
          ...getErrorDetails(error),
        });
      }

      return toTournamentPredictionErrorState(error);
    }

    revalidatePath("/mi-mundial");

    return {
      lockedAt: data.locked_at,
      message: "Mi Mundial guardado",
      savedAt: data.updated_at,
      status: "success",
    };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[saveTournamentPredictionAction:unexpected-error]", {
        ...getErrorDetails(error),
      });
    }

    return toTournamentPredictionErrorState(error);
  }
}
