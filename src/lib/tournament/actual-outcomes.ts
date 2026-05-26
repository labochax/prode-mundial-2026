import type { TournamentBonusActualOutcome } from "@/lib/tournament/bonus-scoring";

export type ActualTournamentMatch = {
  away_score: number | null;
  away_team_id: string | null;
  football_data_id?: number | null;
  home_score: number | null;
  home_team_id: string | null;
  id?: string | null;
  kickoff_at?: string | null;
  match_number: number | null;
  stage?: string | null;
  status: string;
  winner: string | null;
};

export type ActualTournamentOutcomeDiagnostics = {
  missingAwayTeamMatchNumbers: number[];
  missingHomeTeamMatchNumbers: number[];
  missingMatchNumbers: number[];
  missingWinnerMatchNumbers: number[];
  notFinishedMatchNumbers: number[];
};

export type ActualTournamentOutcomeResult =
  | {
      outcome: TournamentBonusActualOutcome;
      status: "complete";
    }
  | {
      diagnostics: ActualTournamentOutcomeDiagnostics;
      outcome: TournamentBonusActualOutcome;
      reason: string;
      status: "incomplete";
    };

export const UNRESOLVED_KNOCKOUT_TEAMS_REASON =
  "No se puede calcular el bonus porque los cruces de eliminación todavía no tienen equipos oficiales asignados. Usá el simulador dev para completar resultados de prueba.";

const ROUND_OF_32_MATCHES = range(73, 88);
const ROUND_OF_16_MATCHES = range(89, 96);
const QUARTERFINAL_MATCHES = range(97, 100);
const SEMIFINAL_MATCHES = range(101, 102);
const THIRD_PLACE_MATCH = 103;
const FINAL_MATCH = 104;
const REQUIRED_KNOCKOUT_MATCHES = [
  ...ROUND_OF_32_MATCHES,
  ...ROUND_OF_16_MATCHES,
  ...QUARTERFINAL_MATCHES,
  ...SEMIFINAL_MATCHES,
  THIRD_PLACE_MATCH,
  FINAL_MATCH,
];

type StageMatchNumberSpec = {
  matchNumbers: number[];
  stageKey: string;
};

const STAGE_MATCH_NUMBER_SPECS: StageMatchNumberSpec[] = [
  { matchNumbers: ROUND_OF_32_MATCHES, stageKey: "round-32" },
  { matchNumbers: ROUND_OF_16_MATCHES, stageKey: "round-16" },
  { matchNumbers: QUARTERFINAL_MATCHES, stageKey: "quarter-finals" },
  { matchNumbers: SEMIFINAL_MATCHES, stageKey: "semi-finals" },
  { matchNumbers: [THIRD_PLACE_MATCH], stageKey: "third-place" },
  { matchNumbers: [FINAL_MATCH], stageKey: "final" },
];

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function isFinished(match: ActualTournamentMatch) {
  return match.status === "FINISHED";
}

function hasMissingTeamSlot(match: ActualTournamentMatch | undefined) {
  return Boolean(
    match && isFinished(match) && (!match.home_team_id || !match.away_team_id),
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

function compareMatchesBySchedule(
  left: ActualTournamentMatch,
  right: ActualTournamentMatch,
) {
  const leftKickoff = left.kickoff_at
    ? new Date(left.kickoff_at).getTime()
    : Number.POSITIVE_INFINITY;
  const rightKickoff = right.kickoff_at
    ? new Date(right.kickoff_at).getTime()
    : Number.POSITIVE_INFINITY;

  return (
    leftKickoff - rightKickoff ||
    (left.football_data_id ?? Number.MAX_SAFE_INTEGER) -
      (right.football_data_id ?? Number.MAX_SAFE_INTEGER) ||
    (left.id ?? "").localeCompare(right.id ?? "")
  );
}

function normalizeActualTournamentMatches(
  matches: ActualTournamentMatch[],
): ActualTournamentMatch[] {
  const normalized = matches.map((match) => ({ ...match }));
  const usedMatchNumbers = new Set(
    normalized
      .map((match) => match.match_number)
      .filter((matchNumber): matchNumber is number =>
        REQUIRED_KNOCKOUT_MATCHES.includes(matchNumber ?? -1),
      ),
  );

  for (const spec of STAGE_MATCH_NUMBER_SPECS) {
    const stageMatches = normalized
      .filter((match) => {
        if (typeof match.match_number === "number") {
          return spec.matchNumbers.includes(match.match_number);
        }

        return getStageKey(match.stage) === spec.stageKey;
      })
      .sort(compareMatchesBySchedule);

    for (const [index, match] of stageMatches.entries()) {
      if (typeof match.match_number === "number") {
        continue;
      }

      const matchNumber = spec.matchNumbers[index];

      if (!matchNumber || usedMatchNumbers.has(matchNumber)) {
        continue;
      }

      match.match_number = matchNumber;
      usedMatchNumbers.add(matchNumber);
    }
  }

  return normalized;
}

function getWinnerTeamId(match: ActualTournamentMatch | undefined) {
  if (!match || !isFinished(match)) {
    return null;
  }

  if (match.winner === "HOME_TEAM") {
    return match.home_team_id;
  }

  if (match.winner === "AWAY_TEAM") {
    return match.away_team_id;
  }

  if (
    typeof match.home_score === "number" &&
    typeof match.away_score === "number"
  ) {
    if (match.home_score > match.away_score) {
      return match.home_team_id;
    }

    if (match.away_score > match.home_score) {
      return match.away_team_id;
    }
  }

  return null;
}

function getLoserTeamId(match: ActualTournamentMatch | undefined) {
  const winner = getWinnerTeamId(match);

  if (!match || !winner) {
    return null;
  }

  if (winner === match.home_team_id) {
    return match.away_team_id;
  }

  if (winner === match.away_team_id) {
    return match.home_team_id;
  }

  return null;
}

function collectWinnersByMatchNumber(
  matchesByNumber: Map<number, ActualTournamentMatch>,
  matchNumbers: number[],
) {
  return matchNumbers
    .map((matchNumber) => getWinnerTeamId(matchesByNumber.get(matchNumber)))
    .filter((teamId): teamId is string => Boolean(teamId));
}

function getIncompleteReason(outcome: TournamentBonusActualOutcome) {
  if ((outcome.actualRoundOf16TeamIds?.length ?? 0) < 16) {
    return "Faltan resultados completos de 16avos.";
  }

  if ((outcome.actualQuarterfinalTeamIds?.length ?? 0) < 8) {
    return "Faltan resultados completos de Octavos.";
  }

  if ((outcome.actualSemifinalTeamIds?.length ?? 0) < 4) {
    return "Faltan resultados completos de Cuartos.";
  }

  if (!outcome.actualChampionTeamId || !outcome.actualRunnerUpTeamId) {
    return "Falta el resultado completo de la Final.";
  }

  if (!outcome.actualThirdPlaceTeamId || !outcome.actualFourthPlaceTeamId) {
    return "Falta el resultado completo del 3.º puesto.";
  }

  return null;
}

function getDiagnostics(
  matchesByNumber: Map<number, ActualTournamentMatch>,
) {
  const diagnostics: ActualTournamentOutcomeDiagnostics = {
    missingAwayTeamMatchNumbers: [],
    missingHomeTeamMatchNumbers: [],
    missingMatchNumbers: [],
    missingWinnerMatchNumbers: [],
    notFinishedMatchNumbers: [],
  };

  for (const matchNumber of REQUIRED_KNOCKOUT_MATCHES) {
    const match = matchesByNumber.get(matchNumber);

    if (!match) {
      diagnostics.missingMatchNumbers.push(matchNumber);
      continue;
    }

    if (!isFinished(match)) {
      diagnostics.notFinishedMatchNumbers.push(matchNumber);
      continue;
    }

    if (!match.home_team_id) {
      diagnostics.missingHomeTeamMatchNumbers.push(matchNumber);
    }

    if (!match.away_team_id) {
      diagnostics.missingAwayTeamMatchNumbers.push(matchNumber);
    }

    if (
      match.home_team_id &&
      match.away_team_id &&
      !getWinnerTeamId(match)
    ) {
      diagnostics.missingWinnerMatchNumbers.push(matchNumber);
    }
  }

  return diagnostics;
}

function getRelevantMatchNumbersForOutcome(outcome: TournamentBonusActualOutcome) {
  if ((outcome.actualRoundOf16TeamIds?.length ?? 0) < 16) {
    return {
      label: "16avos",
      matchNumbers: ROUND_OF_32_MATCHES,
    };
  }

  if ((outcome.actualQuarterfinalTeamIds?.length ?? 0) < 8) {
    return {
      label: "Octavos",
      matchNumbers: ROUND_OF_16_MATCHES,
    };
  }

  if ((outcome.actualSemifinalTeamIds?.length ?? 0) < 4) {
    return {
      label: "Cuartos",
      matchNumbers: QUARTERFINAL_MATCHES,
    };
  }

  if (!outcome.actualChampionTeamId || !outcome.actualRunnerUpTeamId) {
    return {
      label: "Final",
      matchNumbers: [FINAL_MATCH],
    };
  }

  if (!outcome.actualThirdPlaceTeamId || !outcome.actualFourthPlaceTeamId) {
    return {
      label: "3.º puesto",
      matchNumbers: [THIRD_PLACE_MATCH],
    };
  }

  return null;
}

function formatMatchList(matchNumbers: number[]) {
  return matchNumbers.map((matchNumber) => `M${matchNumber}`).join(", ");
}

function getTeamSlotDiagnostic(
  matchNumber: number,
  diagnostics: ActualTournamentOutcomeDiagnostics,
) {
  const missingHome =
    diagnostics.missingHomeTeamMatchNumbers.includes(matchNumber);
  const missingAway =
    diagnostics.missingAwayTeamMatchNumbers.includes(matchNumber);

  if (missingHome && missingAway) {
    return `M${matchNumber} no tiene equipos asignados`;
  }

  if (missingHome) {
    return `M${matchNumber} no tiene local asignado`;
  }

  if (missingAway) {
    return `M${matchNumber} no tiene visitante asignado`;
  }

  return null;
}

function getDiagnosticReason(
  outcome: TournamentBonusActualOutcome,
  fallbackReason: string,
  diagnostics: ActualTournamentOutcomeDiagnostics,
) {
  const relevant = getRelevantMatchNumbersForOutcome(outcome);

  if (!relevant) {
    return fallbackReason;
  }

  const relevantSet = new Set(relevant.matchNumbers);
  const missingTeamSlots = relevant.matchNumbers
    .map((matchNumber) => getTeamSlotDiagnostic(matchNumber, diagnostics))
    .filter((item): item is string => Boolean(item));

  if (missingTeamSlots.length > 0) {
    return `Faltan equipos oficiales en ${relevant.label}: ${missingTeamSlots
      .slice(0, 3)
      .join("; ")}.`;
  }

  const notFinished = diagnostics.notFinishedMatchNumbers.filter((matchNumber) =>
    relevantSet.has(matchNumber),
  );

  if (notFinished.length > 0) {
    return `Faltan resultados completos de ${relevant.label}: ${formatMatchList(
      notFinished.slice(0, 6),
    )} no está finalizado.`;
  }

  const missingWinners = diagnostics.missingWinnerMatchNumbers.filter(
    (matchNumber) => relevantSet.has(matchNumber),
  );

  if (missingWinners.length > 0) {
    return `Faltan ganadores oficiales en ${relevant.label}: ${formatMatchList(
      missingWinners.slice(0, 6),
    )}.`;
  }

  const missingMatches = diagnostics.missingMatchNumbers.filter((matchNumber) =>
    relevantSet.has(matchNumber),
  );

  if (missingMatches.length > 0) {
    return `Faltan partidos de ${relevant.label}: ${formatMatchList(
      missingMatches.slice(0, 6),
    )}.`;
  }

  return fallbackReason;
}

export function deriveActualTournamentOutcome(
  matches: ActualTournamentMatch[],
): ActualTournamentOutcomeResult {
  const normalizedMatches = normalizeActualTournamentMatches(matches);
  const matchesByNumber = new Map(
    normalizedMatches
      .filter(
        (match): match is ActualTournamentMatch & { match_number: number } =>
          typeof match.match_number === "number",
      )
      .map((match) => [match.match_number, match]),
  );
  const finalMatch = matchesByNumber.get(FINAL_MATCH);
  const thirdPlaceMatch = matchesByNumber.get(THIRD_PLACE_MATCH);
  const outcome: TournamentBonusActualOutcome = {
    actualChampionTeamId: getWinnerTeamId(finalMatch),
    actualFourthPlaceTeamId: getLoserTeamId(thirdPlaceMatch),
    actualQuarterfinalTeamIds: collectWinnersByMatchNumber(
      matchesByNumber,
      ROUND_OF_16_MATCHES,
    ),
    actualRoundOf16TeamIds: collectWinnersByMatchNumber(
      matchesByNumber,
      ROUND_OF_32_MATCHES,
    ),
    actualRunnerUpTeamId: getLoserTeamId(finalMatch),
    actualSemifinalTeamIds: collectWinnersByMatchNumber(
      matchesByNumber,
      QUARTERFINAL_MATCHES,
    ),
    actualThirdPlaceTeamId: getWinnerTeamId(thirdPlaceMatch),
  };
  const reason = getIncompleteReason(outcome);

  if (reason) {
    const diagnostics = getDiagnostics(matchesByNumber);

    return {
      diagnostics,
      outcome,
      reason: getDiagnosticReason(outcome, reason, diagnostics),
      status: "incomplete",
    };
  }

  return {
    outcome,
    status: "complete",
  };
}
