import { NextResponse, type NextRequest } from "next/server";

import {
  runFootballDataSmartSync,
  type FootballDataCronMode,
} from "@/lib/sports/football-data/smart-sync";
import { FootballDataApiError } from "@/lib/sports/football-data/client";
import { SportsApiConfigError } from "@/lib/sports/env.server";

export const dynamic = "force-dynamic";

const allowedModes = new Set<FootballDataCronMode>([
  "fixtures",
  "results",
  "smart",
]);

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    return {
      message:
        "CRON_SECRET no está configurado. Definilo antes de ejecutar la ruta cron.",
      ok: false,
      status: 500,
    } as const;
  }

  const bearerToken = getBearerToken(request);
  const querySecret = request.nextUrl.searchParams.get("secret")?.trim();

  if (bearerToken === cronSecret || querySecret === cronSecret) {
    return {
      ok: true,
    } as const;
  }

  return {
    message: "No autorizado.",
    ok: false,
    status: 401,
  } as const;
}

function getMode(request: NextRequest): FootballDataCronMode | null {
  const mode = request.nextUrl.searchParams.get("mode") ?? "smart";

  return allowedModes.has(mode as FootballDataCronMode)
    ? (mode as FootballDataCronMode)
    : null;
}

function getSafeError(error: unknown) {
  if (error instanceof SportsApiConfigError) {
    return error.message;
  }

  if (error instanceof FootballDataApiError) {
    if (error.status === 429) {
      return "Football-Data respondió con límite de uso. El próximo intento debe esperar el reset de cuota.";
    }

    if (error.status === 401 || error.status === 403) {
      return "Football-Data rechazó el token configurado.";
    }

    return error.message;
  }

  if (
    error instanceof TypeError ||
    (error instanceof Error && error.message.toLowerCase().includes("fetch"))
  ) {
    return "No pudimos conectar con Football-Data.";
  }

  return "No pudimos ejecutar la sincronización automática.";
}

export async function GET(request: NextRequest) {
  const authorization = isAuthorized(request);

  if (!authorization.ok) {
    return NextResponse.json(
      {
        error: authorization.message,
        ok: false,
      },
      {
        status: authorization.status,
      },
    );
  }

  const mode = getMode(request);

  if (!mode) {
    return NextResponse.json(
      {
        error: "Modo inválido. Usá smart, fixtures o results.",
        ok: false,
      },
      {
        status: 400,
      },
    );
  }

  try {
    const summary = await runFootballDataSmartSync(mode);

    return NextResponse.json({
      ok: true,
      summary,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[cron-football-data]", {
        message: error instanceof Error ? error.message : "unknown",
        name: error instanceof Error ? error.name : "unknown",
      });
    }

    return NextResponse.json(
      {
        error: getSafeError(error),
        ok: false,
      },
      {
        status: 500,
      },
    );
  }
}
