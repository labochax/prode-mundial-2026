import { describe, expect, it } from "vitest";

import { getTournamentLockState } from "@/lib/tournament/tournament-lock";

const beforeKickoff = new Date("2026-06-10T12:00:00Z");
const firstKickoff = "2026-06-11T19:00:00Z";

describe("getTournamentLockState", () => {
  it("is not locked before first kickoff when official matches are scheduled", () => {
    expect(
      getTournamentLockState({
        lockAt: firstKickoff,
        matches: [
          {
            football_data_id: 1,
            raw_json: null,
            status: "TIMED",
          },
        ],
        now: beforeKickoff,
      }),
    ).toMatchObject({
      isLocked: false,
      reason: "none",
      startedMatchCount: 0,
    });
  });

  it("locks by time when now is greater than or equal to first kickoff", () => {
    expect(
      getTournamentLockState({
        lockAt: firstKickoff,
        matches: [
          {
            football_data_id: 1,
            raw_json: null,
            status: "TIMED",
          },
        ],
        now: new Date(firstKickoff),
      }),
    ).toMatchObject({
      isLocked: true,
      reason: "time",
    });
  });

  it("locks by official match status even before first kickoff time", () => {
    expect(
      getTournamentLockState({
        lockAt: firstKickoff,
        matches: [
          {
            football_data_id: 1,
            raw_json: null,
            status: "FINISHED",
          },
          {
            football_data_id: 2,
            raw_json: null,
            status: "TIMED",
          },
        ],
        now: beforeKickoff,
      }),
    ).toMatchObject({
      isLocked: true,
      reason: "match_status",
      startedMatchCount: 1,
    });
  });
});
