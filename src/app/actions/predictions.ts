"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getMatchEditability } from "@/lib/matches/match-editability";
import { ensureCurrentProfile } from "@/lib/supabase/profile-bootstrap";
import { getOrJoinDefaultPool } from "@/lib/supabase/queries/pools";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SavePredictionActionState = {
  message: string | null;
  status: "error" | "idle" | "success";
};

export type SavePredictionsBatchActionState = {
  failedCount: number;
  failures: Array<{
    matchId: string;
    reason: string;
  }>;
  message: string | null;
  savedCount: number;
  savedMatchIds: string[];
  status: "error" | "idle" | "partial" | "success";
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

const predictionsBatchSchema = z
  .array(predictionSchema)
  .min(1, "No hay cambios para guardar.")
  .max(150, "Hay demasiados cambios para guardar juntos.");

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

function getPredictionErrorMessage(error: unknown) {
  return getPredictionErrorState(error).message ?? "No pudimos guardar.";
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
      .select("id,lock_at,status,home_team_id,away_team_id")
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

    const editability = getMatchEditability(match);

    if (!editability.canEdit) {
      return {
        message:
          editability.notice ??
          "Este partido ya cerró. No se puede editar el pronóstico.",
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
          revalidatePath("/mi-mundial");
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
    revalidatePath("/mi-mundial");
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

export async function savePredictionsBatchAction(
  formData: FormData,
): Promise<SavePredictionsBatchActionState> {
  const rawJson = getString(formData, "predictions_json");
  let rawPayload: unknown;

  try {
    rawPayload = JSON.parse(rawJson);
  } catch {
    return {
      failedCount: 0,
      failures: [],
      message: "No pudimos leer los cambios para guardar.",
      savedCount: 0,
      savedMatchIds: [],
      status: "error",
    };
  }

  const parsed = predictionsBatchSchema.safeParse(rawPayload);

  if (!parsed.success) {
    const firstError =
      parsed.error.issues[0]?.message ?? "Revisá los marcadores antes de guardar.";

    return {
      failedCount: 0,
      failures: [],
      message: firstError,
      savedCount: 0,
      savedMatchIds: [],
      status: "error",
    };
  }

  const dedupedPredictions = [
    ...new Map(
      parsed.data.map((prediction) => [prediction.match_id, prediction]),
    ).values(),
  ];
  const supabase = await createSupabaseServerClient();
  const current = await ensureCurrentProfile(supabase);

  if (!current) {
    return {
      failedCount: dedupedPredictions.length,
      failures: dedupedPredictions.map((prediction) => ({
        matchId: prediction.match_id,
        reason: "No hay una sesión activa.",
      })),
      message: "No hay una sesión activa. Volvé a ingresar para guardar.",
      savedCount: 0,
      savedMatchIds: [],
      status: "error",
    };
  }

  try {
    const pool = await getOrJoinDefaultPool(supabase);
    const matchIds = dedupedPredictions.map((prediction) => prediction.match_id);
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select("id,lock_at,status,home_team_id,away_team_id")
      .in("id", matchIds);

    if (matchesError) {
      logPredictionDebug("batch-match-read-error", {
        ...getErrorDetails(matchesError),
      });

      return {
        failedCount: dedupedPredictions.length,
        failures: dedupedPredictions.map((prediction) => ({
          matchId: prediction.match_id,
          reason: getPredictionErrorMessage(matchesError),
        })),
        message: getPredictionErrorMessage(matchesError),
        savedCount: 0,
        savedMatchIds: [],
        status: "error",
      };
    }

    const matchesById = new Map((matches ?? []).map((match) => [match.id, match]));
    const failures: SavePredictionsBatchActionState["failures"] = [];
    const savedMatchIds: string[] = [];

    for (const prediction of dedupedPredictions) {
      const match = matchesById.get(prediction.match_id);

      if (!match) {
        failures.push({
          matchId: prediction.match_id,
          reason: "No encontramos ese partido en la base local.",
        });
        continue;
      }

      const editability = getMatchEditability(match);

      if (!editability.canEdit) {
        failures.push({
          matchId: prediction.match_id,
          reason:
            editability.notice ??
            "Este partido ya cerró. No se puede editar el pronóstico.",
        });
        continue;
      }

      const { data: existingPrediction, error: existingPredictionError } =
        await supabase
          .from("predictions")
          .select("id")
          .eq("pool_id", pool.id)
          .eq("user_id", current.user.id)
          .eq("match_id", prediction.match_id)
          .maybeSingle();

      if (existingPredictionError) {
        logPredictionDebug("batch-existing-read-error", {
          ...getErrorDetails(existingPredictionError),
        });
        failures.push({
          matchId: prediction.match_id,
          reason: getPredictionErrorMessage(existingPredictionError),
        });
        continue;
      }

      const predictionPayload = {
        predicted_away_score: prediction.predicted_away_score,
        predicted_home_score: prediction.predicted_home_score,
      };
      const { error } = existingPrediction
        ? await supabase
            .from("predictions")
            .update(predictionPayload)
            .eq("id", existingPrediction.id)
        : await supabase.from("predictions").insert({
            ...predictionPayload,
            match_id: prediction.match_id,
            pool_id: pool.id,
            user_id: current.user.id,
          });

      if (error) {
        logPredictionDebug("batch-write-error", {
          ...getErrorDetails(error),
          mode: existingPrediction ? "update" : "insert",
        });

        if (!existingPrediction && error.code === "23505") {
          const { error: retryError } = await supabase
            .from("predictions")
            .update(predictionPayload)
            .eq("pool_id", pool.id)
            .eq("user_id", current.user.id)
            .eq("match_id", prediction.match_id);

          if (!retryError) {
            savedMatchIds.push(prediction.match_id);
            continue;
          }

          logPredictionDebug("batch-race-update-error", {
            ...getErrorDetails(retryError),
          });
          failures.push({
            matchId: prediction.match_id,
            reason: getPredictionErrorMessage(retryError),
          });
          continue;
        }

        failures.push({
          matchId: prediction.match_id,
          reason: getPredictionErrorMessage(error),
        });
        continue;
      }

      savedMatchIds.push(prediction.match_id);
    }

    if (savedMatchIds.length > 0) {
      revalidatePath("/dashboard");
      revalidatePath("/mi-mundial");

      for (const matchId of savedMatchIds) {
        revalidatePath(`/partidos/${matchId}`);
      }
    }

    if (savedMatchIds.length === 0) {
      return {
        failedCount: failures.length,
        failures,
        message:
          failures[0]?.reason ??
          "No pudimos guardar las predicciones. Probá de nuevo.",
        savedCount: 0,
        savedMatchIds: [],
        status: "error",
      };
    }

    if (failures.length > 0) {
      return {
        failedCount: failures.length,
        failures,
        message: `Se guardaron ${savedMatchIds.length}. No se pudieron guardar ${failures.length}.`,
        savedCount: savedMatchIds.length,
        savedMatchIds,
        status: "partial",
      };
    }

    return {
      failedCount: 0,
      failures: [],
      message: `Predicciones guardadas: ${savedMatchIds.length}`,
      savedCount: savedMatchIds.length,
      savedMatchIds,
      status: "success",
    };
  } catch (error) {
    logPredictionDebug("batch-unexpected-error", {
      ...getErrorDetails(error),
    });

    return {
      failedCount: dedupedPredictions.length,
      failures: dedupedPredictions.map((prediction) => ({
        matchId: prediction.match_id,
        reason: getPredictionErrorMessage(error),
      })),
      message: getPredictionErrorMessage(error),
      savedCount: 0,
      savedMatchIds: [],
      status: "error",
    };
  }
}
