import type { Database, Json } from "@/lib/supabase/database.types";
import {
  stitchFlagAssets,
  type StitchFlagAsset,
} from "@/lib/design/stitch-assets";
import { getMatchStageLabel } from "@/lib/matches/dashboard-stage";
import {
  getMatchEditability,
  type MatchEditabilityReason,
} from "@/lib/matches/match-editability";

type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
type PredictionRow = Database["public"]["Tables"]["predictions"]["Row"];
type StadiumRow = Database["public"]["Tables"]["stadiums"]["Row"];
type TeamRow = Database["public"]["Tables"]["teams"]["Row"];

export type MatchWithRelations = MatchRow & {
  away_team: TeamRow | null;
  home_team: TeamRow | null;
  stadium: StadiumRow | null;
};

export type PredictionMatchTeam = {
  badgeUrl?: string | null;
  code: string;
  detailFlag?: StitchFlagAsset;
  flag?: StitchFlagAsset;
  id: string;
  name: string;
};

export type PredictionMatchAvailability = {
  canPredict: boolean;
  ctaHref: "/mi-mundial" | null;
  ctaLabel: "Ver Mi Mundial" | null;
  helper: string | null;
  notice: string | null;
  status:
    | "available"
    | "locked-by-time"
    | "official-teams-pending"
    | "started-or-finished"
    | "stopped";
};

export type PredictionMatchDetail = {
  metadata: {
    city: string;
    dateTime: string;
    groupPhase: string;
    stadium: string;
    venueStatus: "official-fixture" | "pending";
  };
  timerLabel: string;
};

export type PredictionMatch = {
  availability: PredictionMatchAvailability;
  away: PredictionMatchTeam;
  detail: PredictionMatchDetail;
  groupLabel: string;
  home: PredictionMatchTeam;
  id: string;
  initialPrediction: {
    away: number;
    home: number;
  };
  initialState: "empty" | "saved";
  kickoffAt: string;
  lockAt: string;
  locked: boolean;
  lockLabel: string;
  pointsBreakdown: PredictionPointsBreakdown | null;
  status: {
    code: string;
    label: string;
    minuteLabel: string | null;
    scoreLabel: string | null;
    tone: "finished" | "live" | "scheduled" | "stopped";
  };
  tendency: MatchTendency;
  timeLabel: string;
};

export type PredictionPointsBreakdown = {
  actualScoreLabel: string;
  points: number;
  predictionScoreLabel: string;
  reason: "Marcador exacto" | "No acertaste ganador/empate" | "Resultado correcto";
  shortLabel: "Exacto +3" | "Fallado +0" | "Resultado +1";
  tone: "exact" | "miss" | "outcome";
};

export type MatchDistribution = {
  away: number;
  draw: number;
  home: number;
};

export type SourcedMatchDistribution = MatchDistribution & {
  source: string;
};

export type MatchTendency = {
  distribution: MatchDistribution | null;
  status: "available" | "hidden-until-lock" | "unavailable";
};

const BUENOS_AIRES_TIME_ZONE = "America/Argentina/Buenos_Aires";

function isRecord(value: Json | undefined): value is Record<string, Json | undefined> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readNumber(value: Json | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readString(value: Json | undefined) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function readSourcedPercentBlock(
  rawJson: Json | null,
  key: "tendency",
): SourcedMatchDistribution | null {
  if (!isRecord(rawJson)) {
    return null;
  }

  const block = rawJson[key];

  if (!isRecord(block)) {
    return null;
  }

  const away = readNumber(block.away);
  const draw = readNumber(block.draw);
  const home = readNumber(block.home);
  const source = readString(block.source);

  if (
    away === null ||
    draw === null ||
    home === null ||
    source === null
  ) {
    return null;
  }

  return {
    away,
    draw,
    home,
    source,
  };
}

function canRevealTendency(match: MatchRow) {
  return (
    new Date(match.lock_at).getTime() <= Date.now() ||
    (match.status !== "SCHEDULED" && match.status !== "TIMED")
  );
}

function getTendency(match: MatchRow): MatchTendency {
  if (!canRevealTendency(match)) {
    return {
      distribution: null,
      status: "hidden-until-lock",
    };
  }

  const distribution = readSourcedPercentBlock(match.raw_json, "tendency");

  return {
    distribution,
    status: distribution ? "available" : "unavailable",
  };
}

function findFlagBySrc(src: string | null): StitchFlagAsset | undefined {
  if (!src) {
    return undefined;
  }

  return Object.values(stitchFlagAssets).find((asset) => asset.src === src);
}

function getTeamCode(team: TeamRow | null, fallback: string) {
  return (team?.tla ?? team?.short_name ?? fallback).slice(0, 3).toUpperCase();
}

function getProviderTeamPlaceholder(
  rawJson: Json | null,
  side: "awayTeam" | "homeTeam",
) {
  if (!isRecord(rawJson) || !isRecord(rawJson[side])) {
    return null;
  }

  return (
    readString(rawJson[side].name) ??
    readString(rawJson[side].shortName) ??
    readString(rawJson[side].tla)
  );
}

function formatPlaceholderTeamName(value: string | null) {
  if (!value) {
    return "Por definir";
  }

  const normalized = value.trim();
  const winnerMatch = normalized.match(/winner\s+match\s+(\d+)/i);

  if (winnerMatch) {
    return `Ganador Partido ${winnerMatch[1]}`;
  }

  if (/best\s+third/i.test(normalized)) {
    return "Mejor 3°";
  }

  if (/to\s+be\s+defined|tbd|undefined/i.test(normalized)) {
    return "Por definir";
  }

  return normalized;
}

function mapTeam(
  team: TeamRow | null,
  fallbackName: string,
  rawJson: Json | null,
  side: "awayTeam" | "homeTeam",
): PredictionMatchTeam {
  const placeholderName = formatPlaceholderTeamName(
    getProviderTeamPlaceholder(rawJson, side),
  );
  const isPlaceholder = !team;
  const name = isPlaceholder ? placeholderName : team.name_es ?? fallbackName;
  const code = isPlaceholder ? "P/D" : getTeamCode(team, fallbackName);
  const flag = findFlagBySrc(team?.flag_url ?? null);
  const detailFlag =
    code === "ARG" ? stitchFlagAssets["argentina-detalle"] : flag;

  return {
    badgeUrl: team?.badge_url ?? team?.logo_url ?? null,
    code,
    detailFlag,
    flag,
    id: team?.id ?? `${side}-por-definir`,
    name,
  };
}

function formatDashboardTime(kickoffAt: string) {
  const kickoff = new Date(kickoffAt);
  const today = new Date();
  const dayFormatter = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    timeZone: BUENOS_AIRES_TIME_ZONE,
    weekday: "short",
  });
  const timeFormatter = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: BUENOS_AIRES_TIME_ZONE,
  });
  const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: BUENOS_AIRES_TIME_ZONE,
    year: "numeric",
  });

  const kickoffKey = dateKeyFormatter.format(kickoff);
  const todayKey = dateKeyFormatter.format(today);

  if (kickoffKey === todayKey) {
    return `Hoy ${timeFormatter.format(kickoff)}`;
  }

  return `${dayFormatter.format(kickoff)} ${timeFormatter.format(kickoff)}`;
}

function formatDetailDateTime(kickoffAt: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "long",
    timeZone: BUENOS_AIRES_TIME_ZONE,
    weekday: "long",
    year: "numeric",
  }).format(new Date(kickoffAt));
}

function getTimerLabel(lockAt: string) {
  const diffMs = new Date(lockAt).getTime() - Date.now();

  if (diffMs <= 0) {
    return "Cerrado";
  }

  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `Cierra en ${days}d ${String(hours).padStart(2, "0")}h`;
  }

  return `Cierra en ${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )}`;
}

function getGroupLabel(match: MatchRow) {
  return getMatchStageLabel(match);
}

function getAvailability(match: MatchWithRelations): PredictionMatchAvailability {
  const editability = getMatchEditability(match);
  const statusByReason: Record<
    MatchEditabilityReason,
    PredictionMatchAvailability["status"]
  > = {
    available: "available",
    locked_by_time: "locked-by-time",
    missing_teams: "official-teams-pending",
    started_or_finished: "started-or-finished",
    stopped: "stopped",
  };

  if (!editability.canEdit) {
    return {
      canPredict: false,
      ctaHref: editability.reason === "missing_teams" ? "/mi-mundial" : null,
      ctaLabel: editability.reason === "missing_teams" ? "Ver Mi Mundial" : null,
      helper: editability.helper,
      notice: editability.notice,
      status: statusByReason[editability.reason],
    };
  }

  return {
    canPredict: true,
    ctaHref: null,
    ctaLabel: null,
    helper: null,
    notice: null,
    status: "available",
  };
}

function getLockLabel(match: MatchRow, locked: boolean) {
  if (locked) {
    return "Pronóstico cerrado";
  }

  const lockMinutes = Math.max(
    0,
    Math.round(
      (new Date(match.kickoff_at).getTime() - new Date(match.lock_at).getTime()) /
        60000,
    ),
  );

  return `Cierra ${lockMinutes} min antes`;
}

function getStatusLabel(status: string) {
  switch (status) {
    case "AWARDED":
      return "Asignado";
    case "CANCELLED":
      return "Cancelado";
    case "EXTRA_TIME":
      return "Alargue";
    case "FINISHED":
      return "Finalizado";
    case "IN_PLAY":
      return "En juego";
    case "PAUSED":
      return "Entretiempo";
    case "PENALTY_SHOOTOUT":
      return "Penales";
    case "POSTPONED":
      return "Postergado";
    case "SUSPENDED":
      return "Suspendido";
    case "TIMED":
    case "SCHEDULED":
    default:
      return "Programado";
  }
}

function getStatusTone(status: string): PredictionMatch["status"]["tone"] {
  if (status === "FINISHED") {
    return "finished";
  }

  if (
    status === "IN_PLAY" ||
    status === "PAUSED" ||
    status === "EXTRA_TIME" ||
    status === "PENALTY_SHOOTOUT"
  ) {
    return "live";
  }

  if (
    status === "AWARDED" ||
    status === "CANCELLED" ||
    status === "POSTPONED" ||
    status === "SUSPENDED"
  ) {
    return "stopped";
  }

  return "scheduled";
}

function getMinuteLabel(match: MatchRow) {
  if (typeof match.minute !== "number") {
    return null;
  }

  if (
    match.status !== "IN_PLAY" &&
    match.status !== "EXTRA_TIME" &&
    match.status !== "PENALTY_SHOOTOUT"
  ) {
    return null;
  }

  return `${match.minute}'`;
}

function getScoreLabel(
  match: MatchRow,
  homeTeam: PredictionMatchTeam,
  awayTeam: PredictionMatchTeam,
) {
  if (
    typeof match.home_score !== "number" ||
    typeof match.away_score !== "number"
  ) {
    return null;
  }

  return `${homeTeam.code} ${match.home_score} - ${match.away_score} ${awayTeam.code}`;
}

function getPointsBreakdown(
  match: MatchRow,
  prediction: PredictionRow | null,
  homeTeam: PredictionMatchTeam,
  awayTeam: PredictionMatchTeam,
): PredictionPointsBreakdown | null {
  if (
    match.status !== "FINISHED" ||
    !prediction ||
    typeof prediction.points !== "number" ||
    typeof match.home_score !== "number" ||
    typeof match.away_score !== "number"
  ) {
    return null;
  }

  const labelsByPoints = {
    0: {
      reason: "No acertaste ganador/empate",
      shortLabel: "Fallado +0",
      tone: "miss",
    },
    1: {
      reason: "Resultado correcto",
      shortLabel: "Resultado +1",
      tone: "outcome",
    },
    3: {
      reason: "Marcador exacto",
      shortLabel: "Exacto +3",
      tone: "exact",
    },
  } as const;
  const labels =
    labelsByPoints[prediction.points as keyof typeof labelsByPoints] ??
    labelsByPoints[0];

  return {
    actualScoreLabel: `${homeTeam.code} ${match.home_score} - ${match.away_score} ${awayTeam.code}`,
    points: prediction.points,
    predictionScoreLabel: `${homeTeam.code} ${prediction.predicted_home_score} - ${prediction.predicted_away_score} ${awayTeam.code}`,
    reason: labels.reason,
    shortLabel: labels.shortLabel,
    tone: labels.tone,
  };
}

export function mapSupabaseMatchToPredictionMatch(
  match: MatchWithRelations,
  prediction: PredictionRow | null,
): PredictionMatch {
  const availability = getAvailability(match);
  const locked =
    availability.status === "locked-by-time" ||
    availability.status === "started-or-finished";
  const tendency = getTendency(match);
  const homeTeam = mapTeam(
    match.home_team,
    "Por definir",
    match.raw_json,
    "homeTeam",
  );
  const awayTeam = mapTeam(
    match.away_team,
    "Por definir",
    match.raw_json,
    "awayTeam",
  );

  return {
    availability,
    away: awayTeam,
    detail: {
      metadata: {
        city: match.stadium
          ? [match.stadium.city, match.stadium.country]
              .filter(Boolean)
              .join(", ") || "Ciudad a confirmar"
          : "Ciudad a confirmar",
        dateTime: formatDetailDateTime(match.kickoff_at),
        groupPhase: getGroupLabel(match),
        stadium: match.stadium?.name ?? "Estadio a confirmar",
        venueStatus: match.stadium ? "official-fixture" : "pending",
      },
      timerLabel: locked ? "Cerrado" : getTimerLabel(match.lock_at),
    },
    groupLabel: getGroupLabel(match),
    home: homeTeam,
    id: match.id,
    initialPrediction: {
      away: prediction?.predicted_away_score ?? 0,
      home: prediction?.predicted_home_score ?? 0,
    },
    initialState: prediction ? "saved" : "empty",
    kickoffAt: match.kickoff_at,
    lockAt: match.lock_at,
    locked,
    lockLabel: getLockLabel(match, locked),
    pointsBreakdown: getPointsBreakdown(match, prediction, homeTeam, awayTeam),
    status: {
      code: match.status,
      label: getStatusLabel(match.status),
      minuteLabel: getMinuteLabel(match),
      scoreLabel: getScoreLabel(match, homeTeam, awayTeam),
      tone: getStatusTone(match.status),
    },
    tendency,
    timeLabel: formatDashboardTime(match.kickoff_at),
  };
}
