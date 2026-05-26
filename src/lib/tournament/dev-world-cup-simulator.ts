import type {
  SavedTournamentBracketJson,
  SavedTournamentBracketMatch,
} from "@/lib/tournament/tournament-prediction-payload";

export type DevWorldCupMatchUpdate = {
  awayScore: number;
  awayTeamId: string;
  homeScore: number;
  homeTeamId: string;
  matchNumber: number;
  winner: "AWAY_TEAM" | "HOME_TEAM";
};

export type DevWorldCupKnockoutMatchTarget = {
  footballDataId?: number | null;
  id: string;
  kickoffAt?: string | null;
  matchNumber: number | null;
  stage: string | null;
};

export type DevWorldCupDatabaseMatchUpdate = DevWorldCupMatchUpdate & {
  id: string;
};

export type DevWorldCupResetMatch = {
  away_team_id: string | null;
  home_team_id: string | null;
  id: string;
  match_number: number | null;
  stage: string | null;
};

export type DevWorldCupResetMatchUpdate = {
  away_score: null;
  away_team_id?: null;
  home_score: null;
  home_team_id?: null;
  id: string;
  minute: null;
  status: "TIMED";
  winner: null;
};

export type DevWorldCupResetSummary = {
  bonusReset: number;
  matchesReset: number;
  predictionsConserved: number;
};

export type DevWorldCupSimulationResult =
  | {
      status: "success";
      updates: DevWorldCupMatchUpdate[];
    }
  | {
      message: string;
      status: "error";
    };

const REQUIRED_KNOCKOUT_MATCH_NUMBERS = Array.from(
  { length: 32 },
  (_, index) => 73 + index,
);

const KNOCKOUT_STAGE_SPECS = [
  {
    matchNumbers: Array.from({ length: 16 }, (_, index) => 73 + index),
    stageKey: "round-32",
  },
  {
    matchNumbers: Array.from({ length: 8 }, (_, index) => 89 + index),
    stageKey: "round-16",
  },
  {
    matchNumbers: Array.from({ length: 4 }, (_, index) => 97 + index),
    stageKey: "quarter-finals",
  },
  {
    matchNumbers: Array.from({ length: 2 }, (_, index) => 101 + index),
    stageKey: "semi-finals",
  },
  {
    matchNumbers: [103],
    stageKey: "third-place",
  },
  {
    matchNumbers: [104],
    stageKey: "final",
  },
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSavedBracketMatch(value: unknown): value is SavedTournamentBracketMatch {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.matchNumber === "number" &&
    typeof value.selectedTeamId === "string" &&
    isRecord(value.home) &&
    isRecord(value.away) &&
    isRecord(value.home.team) &&
    isRecord(value.away.team) &&
    typeof value.home.team.id === "string" &&
    typeof value.away.team.id === "string"
  );
}

function isSavedTournamentBracketJson(
  value: unknown,
): value is SavedTournamentBracketJson {
  return (
    isRecord(value) &&
    Array.isArray(value.projectedRoundOf32) &&
    isRecord(value.rounds) &&
    Array.isArray(value.rounds.roundOf16) &&
    Array.isArray(value.rounds.quarterfinals) &&
    Array.isArray(value.rounds.semifinals) &&
    Array.isArray(value.rounds.thirdPlace) &&
    Array.isArray(value.rounds.final)
  );
}

function isPlaceholderTeamId(teamId: string) {
  const normalized = teamId.trim().toLowerCase();

  return (
    normalized.length === 0 ||
    normalized.startsWith("placeholder-") ||
    normalized.includes("por-definir") ||
    normalized.includes("por_definir")
  );
}

function normalizeStage(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getStageKey(value: string | null | undefined) {
  const stage = normalizeStage(value);

  if (
    stage.includes("ROUND_OF_32") ||
    stage.includes("LAST_32") ||
    stage.includes("ROUND_32") ||
    stage.includes("16AVOS") ||
    stage.includes("DIECISEISAVOS")
  ) {
    return "round-32";
  }

  if (
    stage.includes("ROUND_OF_16") ||
    stage.includes("LAST_16") ||
    stage.includes("OCTAVOS")
  ) {
    return "round-16";
  }

  if (stage.includes("QUARTER") || stage.includes("CUARTOS")) {
    return "quarter-finals";
  }

  if (stage.includes("SEMI")) {
    return "semi-finals";
  }

  if (stage.includes("THIRD") || stage.includes("TERCER")) {
    return "third-place";
  }

  if (stage === "FINAL") {
    return "final";
  }

  return null;
}

function isGroupStage(value: string | null | undefined) {
  return normalizeStage(value).includes("GROUP");
}

function isKnockoutStage(value: string | null | undefined) {
  return Boolean(getStageKey(value));
}

function isDevResetTarget(match: DevWorldCupResetMatch) {
  return (
    (typeof match.match_number === "number" &&
      match.match_number >= 1 &&
      match.match_number <= 104) ||
    isGroupStage(match.stage) ||
    isKnockoutStage(match.stage)
  );
}

function isKnockoutResetTarget(match: DevWorldCupResetMatch) {
  return (
    (typeof match.match_number === "number" &&
      match.match_number >= 73 &&
      match.match_number <= 104) ||
    isKnockoutStage(match.stage)
  );
}

function compareTargetsBySchedule(
  left: DevWorldCupKnockoutMatchTarget,
  right: DevWorldCupKnockoutMatchTarget,
) {
  const leftKickoff = left.kickoffAt
    ? new Date(left.kickoffAt).getTime()
    : Number.POSITIVE_INFINITY;
  const rightKickoff = right.kickoffAt
    ? new Date(right.kickoffAt).getTime()
    : Number.POSITIVE_INFINITY;

  return (
    leftKickoff - rightKickoff ||
    (left.footballDataId ?? Number.MAX_SAFE_INTEGER) -
      (right.footballDataId ?? Number.MAX_SAFE_INTEGER) ||
    left.id.localeCompare(right.id)
  );
}

function getSavedMatches(bracketJson: SavedTournamentBracketJson) {
  return [
    ...bracketJson.projectedRoundOf32,
    ...bracketJson.rounds.roundOf16,
    ...bracketJson.rounds.quarterfinals,
    ...bracketJson.rounds.semifinals,
    ...bracketJson.rounds.thirdPlace,
    ...bracketJson.rounds.final,
  ];
}

function toMatchUpdate(
  match: SavedTournamentBracketMatch,
): DevWorldCupMatchUpdate | null {
  const homeTeamId = match.home.team.id;
  const awayTeamId = match.away.team.id;
  const selectedTeamId = match.selectedTeamId;

  if (
    isPlaceholderTeamId(homeTeamId) ||
    isPlaceholderTeamId(awayTeamId) ||
    isPlaceholderTeamId(selectedTeamId ?? "")
  ) {
    return null;
  }

  if (selectedTeamId === homeTeamId) {
    return {
      awayScore: 0,
      awayTeamId,
      homeScore: 2,
      homeTeamId,
      matchNumber: match.matchNumber,
      winner: "HOME_TEAM",
    };
  }

  if (selectedTeamId === awayTeamId) {
    return {
      awayScore: 2,
      awayTeamId,
      homeScore: 0,
      homeTeamId,
      matchNumber: match.matchNumber,
      winner: "AWAY_TEAM",
    };
  }

  return null;
}

export function buildDevWorldCupMatchUpdatesFromSavedBracket(
  bracketJson: unknown,
): DevWorldCupSimulationResult {
  if (!isSavedTournamentBracketJson(bracketJson)) {
    return {
      message: "Guardá una llave completa de Mi Mundial antes de autocompletar.",
      status: "error",
    };
  }

  const updatesByMatchNumber = new Map<number, DevWorldCupMatchUpdate>();

  for (const match of getSavedMatches(bracketJson)) {
    if (!isSavedBracketMatch(match)) {
      return {
        message: "Guardá una llave completa de Mi Mundial antes de autocompletar.",
        status: "error",
      };
    }

    const update = toMatchUpdate(match);

    if (!update) {
      return {
        message:
          "La llave guardada todavía tiene equipos por definir. Completá Mi Mundial con cruces resueltos.",
        status: "error",
      };
    }

    updatesByMatchNumber.set(update.matchNumber, update);
  }

  const updates = REQUIRED_KNOCKOUT_MATCH_NUMBERS.map((matchNumber) =>
    updatesByMatchNumber.get(matchNumber),
  );

  if (updates.some((update) => !update)) {
    return {
      message: "Guardá una llave completa de Mi Mundial antes de autocompletar.",
      status: "error",
    };
  }

  return {
    status: "success",
    updates: updates as DevWorldCupMatchUpdate[],
  };
}

export function buildDevWorldCupKnockoutDatabaseUpdates(
  updates: DevWorldCupMatchUpdate[],
  targets: DevWorldCupKnockoutMatchTarget[],
):
  | {
      status: "success";
      updates: DevWorldCupDatabaseMatchUpdate[];
    }
  | {
      message: string;
      status: "error";
    } {
  const updatesByMatchNumber = new Map(
    updates.map((update) => [update.matchNumber, update]),
  );
  const databaseUpdates: DevWorldCupDatabaseMatchUpdate[] = [];

  for (const spec of KNOCKOUT_STAGE_SPECS) {
    const stageTargets = targets
      .filter((target) => {
        if (typeof target.matchNumber === "number") {
          return spec.matchNumbers.some(
            (matchNumber) => matchNumber === target.matchNumber,
          );
        }

        return getStageKey(target.stage) === spec.stageKey;
      })
      .sort(compareTargetsBySchedule);

    if (stageTargets.length < spec.matchNumbers.length) {
      return {
        message:
          "No encontramos todos los partidos oficiales de eliminatorias para autocompletar.",
        status: "error",
      };
    }

    for (const [index, matchNumber] of spec.matchNumbers.entries()) {
      const target = stageTargets[index];
      const update = updatesByMatchNumber.get(matchNumber);

      if (!target || !update) {
        return {
          message:
            "Guardá una llave completa de Mi Mundial antes de autocompletar.",
          status: "error",
        };
      }

      databaseUpdates.push({
        ...update,
        id: target.id,
      });
    }
  }

  return {
    status: "success",
    updates: databaseUpdates,
  };
}

export function buildDevWorldCupResetMatchUpdates(
  matches: DevWorldCupResetMatch[],
): DevWorldCupResetMatchUpdate[] {
  return matches.filter(isDevResetTarget).map((match) => {
    const update: DevWorldCupResetMatchUpdate = {
      away_score: null,
      home_score: null,
      id: match.id,
      minute: null,
      status: "TIMED",
      winner: null,
    };

    if (isKnockoutResetTarget(match)) {
      update.away_team_id = null;
      update.home_team_id = null;
    }

    return update;
  });
}

export function getTournamentPredictionBonusResetPatch() {
  return {
    bonus_points: 0,
    scored_at: null,
  };
}

export function getDevWorldCupResetSuccessMessage(summary: DevWorldCupResetSummary) {
  return `Datos de prueba eliminados. Partidos reiniciados: ${summary.matchesReset}. Predicciones conservadas: ${summary.predictionsConserved}. Bonus Mi Mundial reiniciado: ${summary.bonusReset}.`;
}
