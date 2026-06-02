"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const scoringSchema = z.object({
  away_score: z.coerce
    .number({
      error: "El marcador visitante debe ser un número.",
    })
    .int("El marcador visitante debe ser entero.")
    .min(0, "El marcador visitante no puede ser negativo.")
    .max(99, "El marcador visitante es demasiado alto."),
  home_score: z.coerce
    .number({
      error: "El marcador local debe ser un número.",
    })
    .int("El marcador local debe ser entero.")
    .min(0, "El marcador local no puede ser negativo.")
    .max(99, "El marcador local es demasiado alto."),
  match_id: z.string().uuid("El partido no es válido."),
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function getWinner(homeScore: number, awayScore: number) {
  if (homeScore > awayScore) {
    return "HOME_TEAM";
  }

  if (awayScore > homeScore) {
    return "AWAY_TEAM";
  }

  return "DRAW";
}

function redirectWithParams(params: Record<string, string>): never {
  const searchParams = new URLSearchParams(params);

  redirect(`/admin/sync?${searchParams.toString()}`);
}

export async function finalizeAndScoreMatchAction(formData: FormData) {
  const shouldLogDev = process.env.NODE_ENV !== "production";

  if (!shouldLogDev) {
    redirectWithParams({
      error: "produccion",
    });
  }

  const parsed = scoringSchema.safeParse({
    away_score: getString(formData, "away_score"),
    home_score: getString(formData, "home_score"),
    match_id: getString(formData, "match_id"),
  });

  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)
      .flat()
      .find((value): value is string => typeof value === "string");

    redirectWithParams({
      error: firstError ?? "Revisá el resultado antes de puntuar.",
    });
  }

  const { away_score: awayScore, home_score: homeScore, match_id: matchId } =
    parsed.data;

  let admin;

  try {
    admin = createSupabaseAdminClient();
  } catch (error) {
    if (shouldLogDev) {
      console.error("[finalizeAndScoreMatchAction:admin-client]", error);
    }

    redirectWithParams({
      error: "No pudimos iniciar la herramienta local de puntaje.",
    });
  }

  const { error: updateError } = await admin
    .from("matches")
    .update({
      away_score: awayScore,
      home_score: homeScore,
      status: "FINISHED",
      winner: getWinner(homeScore, awayScore),
    })
    .eq("id", matchId);

  if (updateError) {
    if (shouldLogDev) {
      console.error("[finalizeAndScoreMatchAction:update]", updateError);
    }

    redirectWithParams({
      error: "No pudimos finalizar el partido local.",
    });
  }

  const { data: scoredCount, error: scoringError } = await admin.rpc(
    "score_match_predictions",
    {
      target_match_id: matchId,
    },
  );

  if (scoringError) {
    if (shouldLogDev) {
      console.error("[finalizeAndScoreMatchAction:scoring]", scoringError);
    }

    redirectWithParams({
      error: "El resultado se guardó, pero falló el cálculo de puntos.",
    });
  }

  revalidatePath("/posiciones");
  revalidatePath("/dashboard");
  revalidatePath("/predicciones");
  revalidatePath("/predicciones/grupos");
  revalidatePath(`/partidos/${matchId}`);
  revalidatePath("/admin/sync");

  redirectWithParams({
    estado: "puntuado",
    partido: matchId,
    predicciones: String(scoredCount ?? 0),
  });
}
