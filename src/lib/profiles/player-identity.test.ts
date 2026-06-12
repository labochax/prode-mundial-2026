import { describe, expect, it } from "vitest";

import { getShellPlayerIdentity } from "@/lib/profiles/player-identity";

function profile(overrides: Record<string, unknown> = {}) {
  return {
    avatar_kind: "stitch",
    avatar_value: null,
    display_name: "Jose",
    email: "jose@example.com",
    full_name: "Jose",
    google_avatar_url: null,
    prode_subgroup: "Amigos",
    prode_subgroups: ["Familia", "Amigos"],
    school_group: null,
    ...overrides,
  } as never;
}

describe("getShellPlayerIdentity", () => {
  it("formats zero points and a global rank", () => {
    expect(
      getShellPlayerIdentity(profile(), { rank: 12, totalPoints: 0 }),
    ).toMatchObject({
      compactScoreSummaryLabel: "0 pts · #12",
      scoreSummaryLabel: "0 puntos · Puesto #12",
    });
  });

  it("formats singular points and a global rank", () => {
    expect(
      getShellPlayerIdentity(profile(), { rank: 2, totalPoints: 1 }),
    ).toMatchObject({
      compactScoreSummaryLabel: "1 pt · #2",
      scoreSummaryLabel: "1 punto · Puesto #2",
    });
  });

  it("shows only points when global rank is unavailable", () => {
    expect(
      getShellPlayerIdentity(profile(), { rank: null, totalPoints: 37 }),
    ).toMatchObject({
      compactScoreSummaryLabel: "37 pts",
      scoreSummaryLabel: "37 puntos",
    });
  });

  it("preserves score labels with a Google avatar", () => {
    expect(
      getShellPlayerIdentity(
        profile({
          avatar_kind: "google",
          google_avatar_url: "https://example.com/avatar.png",
        }),
        { rank: 4, totalPoints: 12 },
      ),
    ).toMatchObject({
      avatar: {
        kind: "google",
        src: "https://example.com/avatar.png",
      },
      compactScoreSummaryLabel: "12 pts · #4",
      scoreSummaryLabel: "12 puntos · Puesto #4",
    });
  });

  it("preserves score labels with a Stitch avatar and prefers the first subgroup", () => {
    expect(
      getShellPlayerIdentity(profile(), { rank: 7, totalPoints: 8 }),
    ).toMatchObject({
      avatar: {
        kind: "stitch",
      },
      compactScoreSummaryLabel: "8 pts · #7",
      groupLabel: "Familia",
      scoreSummaryLabel: "8 puntos · Puesto #7",
    });
  });
});
