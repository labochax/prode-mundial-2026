"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ensureCurrentProfile } from "@/lib/supabase/profile-bootstrap";
import { getOrJoinDefaultPool } from "@/lib/supabase/queries/pools";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SavePredictionActionState = {
  message: string | null;
  status: "error" | "idle" | "success";
};

const predictionSchema = z.object({
  match_id: z.string().uuid("El partido no es válido."),
  predicted_away_score: z.coerce
    .number({
      error: "El marcador visitante debe ser un número.",
    })
    .int("El marcador visitante debe ser entero.")
    .min(0, "El marcador visitante no puede ser negativo.")
    .max(99, "El marcador visitante es demasiado alto."),
  predicted_home_score: z.coerce
    .number({
      error: "El marcador local debe ser un número.",
    })
    .int("El marcador local debe ser entero.")
    .min(0, "El marcador local no puede ser negativo.")
    .max(99, "El marcador local es demasiado alto."),
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "";
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

function logPredictionDebug(
  event: string,
  payload: Record<string, unknown>,
) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.error(`[savePredictionAction:${event}]`, payload);
}

function getPredictionErrorState(error: unknown): SavePredictionActionState {
  const message = getErrorMessage(error).toLowerCase();
  const details = getErrorDetails(error);

  if (message.includes("locked") || message.includes("lock")) {
    return {
      message: "Este partido ya cerró. No se puede editar el pronóstico.",
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
    message: "No pudimos guardar la predicción. Probá de nuevo.",
    status: "error",
  };
}

export async function savePredictionAction(
  _previousState: SavePredictionActionState,
  formData: FormData,
): Promise<SavePredictionActionState> {
  const parsed = predictionSchema.safeParse({
    match_id: getString(formData, "match_id"),
    predicted_away_score: getString(formData, "predicted_away_score"),
    predicted_home_score: getString(formData, "predicted_home_score"),
  });

  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)
      .flat()
      .find((value): value is string => typeof value === "string");

    return {
      message: firstError ?? "Revisá el marcador antes de guardar.",
      status: "error",
    };
  }

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
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("id,lock_at")
      .eq("id", parsed.data.match_id)
      .maybeSingle();

    if (matchError) {
      logPredictionDebug("match-read-error", {
        ...getErrorDetails(matchError),
      });

      return getPredictionErrorState(matchError);
    }

    if (!match) {
      return {
        message: "No encontramos ese partido en la base local.",
        status: "error",
      };
    }

    if (new Date(match.lock_at).getTime() <= Date.now()) {
      return {
        message: "Este partido ya cerró. No se puede editar el pronóstico.",
        status: "error",
      };
    }

    const { data: existingPrediction, error: existingPredictionError } =
      await supabase
        .from("predictions")
        .select("id")
        .eq("pool_id", pool.id)
        .eq("user_id", current.user.id)
        .eq("match_id", parsed.data.match_id)
        .maybeSingle();

    if (existingPredictionError) {
      logPredictionDebug("existing-read-error", {
        ...getErrorDetails(existingPredictionError),
      });

      return getPredictionErrorState(existingPredictionError);
    }

    const predictionPayload = {
      predicted_away_score: parsed.data.predicted_away_score,
      predicted_home_score: parsed.data.predicted_home_score,
    };

    const { error } = existingPrediction
      ? await supabase
          .from("predictions")
          .update(predictionPayload)
          .eq("id", existingPrediction.id)
      : await supabase.from("predictions").insert({
          ...predictionPayload,
          match_id: parsed.data.match_id,
          pool_id: pool.id,
          user_id: current.user.id,
        });

    if (error) {
      logPredictionDebug("write-error", {
        ...getErrorDetails(error),
        mode: existingPrediction ? "update" : "insert",
      });

      if (!existingPrediction && error.code === "23505") {
        const { error: retryError } = await supabase
          .from("predictions")
          .update(predictionPayload)
          .eq("pool_id", pool.id)
          .eq("user_id", current.user.id)
          .eq("match_id", parsed.data.match_id);

        if (!retryError) {
          revalidatePath("/dashboard");
          revalidatePath(`/partidos/${parsed.data.match_id}`);

          return {
            message: "Predicción guardada",
            status: "success",
          };
        }

        logPredictionDebug("race-update-error", {
          ...getErrorDetails(retryError),
        });

        return getPredictionErrorState(retryError);
      }

      return getPredictionErrorState(error);
    }

    revalidatePath("/dashboard");
    revalidatePath(`/partidos/${parsed.data.match_id}`);

    return {
      message: "Predicción guardada",
      status: "success",
    };
  } catch (error) {
    logPredictionDebug("unexpected-error", {
      ...getErrorDetails(error),
    });

    return getPredictionErrorState(error);
  }
}
