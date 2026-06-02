export type MatchEditabilityReason =
  | "available"
  | "locked_by_time"
  | "missing_teams"
  | "started_or_finished"
  | "stopped";

export type MatchEditabilityInput = {
  away_team_id?: string | null;
  home_team_id?: string | null;
  lock_at?: string | null;
  status?: string | null;
};

export type MatchEditability = {
  canEdit: boolean;
  helper: string | null;
  notice: string | null;
  reason: MatchEditabilityReason;
};

const liveOrFinalStatuses = new Set([
  "AWARDED",
  "EXTRA_TIME",
  "FINISHED",
  "IN_PLAY",
  "LIVE",
  "PAUSED",
  "PENALTY_SHOOTOUT",
]);

const stoppedStatuses = new Set(["CANCELLED", "POSTPONED", "SUSPENDED"]);

function normalizeStatus(status: string | null | undefined) {
  return (status ?? "").trim().toUpperCase();
}

export function getMatchEditability(
  match: MatchEditabilityInput,
  now = new Date(),
): MatchEditability {
  if (!match.home_team_id || !match.away_team_id) {
    return {
      canEdit: false,
      helper: "Mientras tanto, podés armar tu llave bonus en Mi Mundial.",
      notice:
        "Este partido se habilita cuando FIFA confirme los equipos clasificados.",
      reason: "missing_teams",
    };
  }

  const status = normalizeStatus(match.status);

  if (liveOrFinalStatuses.has(status)) {
    return {
      canEdit: false,
      helper: null,
      notice: "Este partido ya empezó o fue finalizado.",
      reason: "started_or_finished",
    };
  }

  if (stoppedStatuses.has(status)) {
    return {
      canEdit: false,
      helper: null,
      notice: "Este partido no está disponible para editar por su estado oficial.",
      reason: "stopped",
    };
  }

  if (match.lock_at && new Date(match.lock_at).getTime() <= now.getTime()) {
    return {
      canEdit: false,
      helper: null,
      notice: "Este partido ya está bloqueado.",
      reason: "locked_by_time",
    };
  }

  return {
    canEdit: true,
    helper: null,
    notice: null,
    reason: "available",
  };
}
