import type { Json } from "@/lib/supabase/database.types";

export type TournamentLockReason = "match_status" | "none" | "time";

export type TournamentLockMatch = {
  football_data_id: number | null;
  raw_json?: Json | null;
  status: string;
};

export type TournamentLockState = {
  isLocked: boolean;
  lockAt: string | null;
  reason: TournamentLockReason;
  startedMatchCount: number;
};

const tournamentStartedStatuses = new Set([
  "AWARDED",
  "EXTRA_TIME",
  "FINISHED",
  "IN_PLAY",
  "LIVE",
  "PAUSED",
  "PENALTY_SHOOTOUT",
  "SUSPENDED",
]);

function isRecord(value: Json | null | undefined): value is Record<string, Json> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSeedFixture(match: TournamentLockMatch) {
  return (
    match.football_data_id === null ||
    (isRecord(match.raw_json) && typeof match.raw_json.seed_note === "string")
  );
}

function isOfficialFixture(match: TournamentLockMatch) {
  return match.football_data_id !== null && !isSeedFixture(match);
}

function hasTournamentStartedStatus(status: string) {
  return tournamentStartedStatuses.has(status.trim().toUpperCase());
}

export function getTournamentLockState({
  lockAt,
  matches,
  now = new Date(),
}: {
  lockAt: string | null;
  matches: readonly TournamentLockMatch[];
  now?: Date;
}): TournamentLockState {
  const startedMatchCount = matches.filter(
    (match) => isOfficialFixture(match) && hasTournamentStartedStatus(match.status),
  ).length;

  if (startedMatchCount > 0) {
    return {
      isLocked: true,
      lockAt,
      reason: "match_status",
      startedMatchCount,
    };
  }

  if (lockAt && new Date(lockAt).getTime() <= now.getTime()) {
    return {
      isLocked: true,
      lockAt,
      reason: "time",
      startedMatchCount,
    };
  }

  return {
    isLocked: false,
    lockAt,
    reason: "none",
    startedMatchCount,
  };
}
