import { z } from "zod";

export type OfficialWinner = "AWAY_TEAM" | "DRAW" | "HOME_TEAM";

export type ManualResultInput = {
  awayScore: number;
  homeScore: number;
  matchId: string;
};

export type ManualResultMatch = {
  away_team_id: string | null;
  home_team_id: string | null;
  id: string;
};

export type ManualResultPatch = {
  away_score: number;
  home_score: number;
  last_synced_at: string;
  status: "FINISHED";
  updated_at: string;
  winner: OfficialWinner;
};

export class AdminResultValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminResultValidationError";
  }
}

const manualResultSchema = z.object({
  away_score: z.coerce
    .number({ error: "El marcador visitante debe ser un número." })
    .int("El marcador visitante debe ser entero.")
    .min(0, "El marcador visitante no puede ser negativo.")
    .max(99, "El marcador visitante es demasiado alto."),
  home_score: z.coerce
    .number({ error: "El marcador local debe ser un número." })
    .int("El marcador local debe ser entero.")
    .min(0, "El marcador local no puede ser negativo.")
    .max(99, "El marcador local es demasiado alto."),
  match_id: z.string().uuid("El partido no es válido."),
});

export function parseManualResultInput(raw: {
  away_score: unknown;
  home_score: unknown;
  match_id: unknown;
}): ManualResultInput {
  const parsed = manualResultSchema.safeParse(raw);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message;
    throw new AdminResultValidationError(
      message ?? "Revisá el resultado antes de finalizar.",
    );
  }

  return {
    awayScore: parsed.data.away_score,
    homeScore: parsed.data.home_score,
    matchId: parsed.data.match_id,
  };
}

export function getOfficialWinner(
  homeScore: number,
  awayScore: number,
): OfficialWinner {
  if (homeScore > awayScore) {
    return "HOME_TEAM";
  }

  if (awayScore > homeScore) {
    return "AWAY_TEAM";
  }

  return "DRAW";
}

export async function finalizeAdminMatchResult({
  input,
  match,
  now = new Date(),
  scorePredictions,
  updateMatch,
}: {
  input: ManualResultInput;
  match: ManualResultMatch;
  now?: Date;
  scorePredictions: (matchId: string) => Promise<number>;
  updateMatch: (matchId: string, patch: ManualResultPatch) => Promise<void>;
}) {
  if (!match.home_team_id || !match.away_team_id) {
    throw new AdminResultValidationError(
      "No se puede finalizar un partido sin equipos oficiales asignados.",
    );
  }

  const timestamp = now.toISOString();
  const winner = getOfficialWinner(input.homeScore, input.awayScore);

  await updateMatch(match.id, {
    away_score: input.awayScore,
    home_score: input.homeScore,
    last_synced_at: timestamp,
    status: "FINISHED",
    updated_at: timestamp,
    winner,
  });

  const predictionsScored = await scorePredictions(match.id);

  return {
    awayScore: input.awayScore,
    homeScore: input.homeScore,
    predictionsScored,
    winner,
  };
}

type ResultMatchWindowInput = {
  id: string;
  kickoff_at: string;
  match_number: number | null;
  status: string;
};

export function selectAdminResultMatches<T extends ResultMatchWindowInput>(
  matches: readonly T[],
  now = new Date(),
) {
  const nowTime = now.getTime();
  const recentStart = nowTime - 36 * 60 * 60 * 1000;
  const nearFutureEnd = nowTime + 6 * 60 * 60 * 1000;

  return matches
    .filter((match) => {
      const kickoffTime = new Date(match.kickoff_at).getTime();
      const isInControlWindow =
        kickoffTime >= recentStart && kickoffTime <= nearFutureEnd;
      const isOverdueAndUnfinished =
        kickoffTime <= nowTime && match.status !== "FINISHED";

      return isInControlWindow || isOverdueAndUnfinished;
    })
    .sort((left, right) => {
      const kickoffDiff =
        new Date(left.kickoff_at).getTime() -
        new Date(right.kickoff_at).getTime();

      if (kickoffDiff !== 0) {
        return kickoffDiff;
      }

      return (
        (left.match_number ?? Number.MAX_SAFE_INTEGER) -
          (right.match_number ?? Number.MAX_SAFE_INTEGER) ||
        left.id.localeCompare(right.id)
      );
    });
}
