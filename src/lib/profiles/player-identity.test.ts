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
  it.each([
    [0, "0 puntos"],
    [1, "1 punto"],
    [37, "37 puntos"],
  ] as const)("formats %i total points as %s", (totalPoints, pointsLabel) => {
    expect(getShellPlayerIdentity(profile(), totalPoints).pointsLabel).toBe(
      pointsLabel,
    );
  });

  it("preserves real points with a Google avatar", () => {
    expect(
      getShellPlayerIdentity(
        profile({
          avatar_kind: "google",
          google_avatar_url: "https://example.com/avatar.png",
        }),
        12,
      ),
    ).toMatchObject({
      avatar: {
        kind: "google",
        src: "https://example.com/avatar.png",
      },
      pointsLabel: "12 puntos",
    });
  });

  it("preserves real points with a Stitch avatar and prefers the first subgroup", () => {
    expect(getShellPlayerIdentity(profile(), 8)).toMatchObject({
      avatar: {
        kind: "stitch",
      },
      groupLabel: "Familia",
      pointsLabel: "8 puntos",
    });
  });
});
