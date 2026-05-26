import { describe, expect, it } from "vitest";

import { getMatchEditability } from "@/lib/matches/match-editability";

const now = new Date("2026-06-01T12:00:00Z");

function editableMatch(overrides: Parameters<typeof getMatchEditability>[0] = {}) {
  return {
    away_team_id: "away",
    home_team_id: "home",
    lock_at: "2026-06-11T18:50:00Z",
    status: "TIMED",
    ...overrides,
  };
}

describe("getMatchEditability", () => {
  it("allows a scheduled match with official teams before lock", () => {
    expect(getMatchEditability(editableMatch(), now)).toMatchObject({
      canEdit: true,
      reason: "available",
    });
  });

  it("blocks matches without official teams", () => {
    expect(
      getMatchEditability(
        editableMatch({
          away_team_id: null,
        }),
        now,
      ),
    ).toMatchObject({
      canEdit: false,
      reason: "missing_teams",
    });
  });

  it("blocks matches when lock_at has passed", () => {
    expect(
      getMatchEditability(
        editableMatch({
          lock_at: "2026-05-31T18:50:00Z",
        }),
        now,
      ),
    ).toMatchObject({
      canEdit: false,
      reason: "locked_by_time",
    });
  });

  it("blocks live or finished matches even if lock_at is still in the future", () => {
    expect(
      getMatchEditability(
        editableMatch({
          status: "FINISHED",
        }),
        now,
      ),
    ).toMatchObject({
      canEdit: false,
      reason: "started_or_finished",
    });

    expect(
      getMatchEditability(
        editableMatch({
          status: "IN_PLAY",
        }),
        now,
      ),
    ).toMatchObject({
      canEdit: false,
      reason: "started_or_finished",
    });
  });
});
