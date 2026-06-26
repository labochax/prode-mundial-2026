import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LeaderboardRow } from "@/components/leaderboard/leaderboard-row";
import type { LeaderboardPlayer } from "@/lib/leaderboard/leaderboard-types";

const player = {
  avatar: {
    alt: "Avatar",
    height: 64,
    kind: "stitch",
    src: "/stitch/avatars/messi.png",
    width: 64,
  },
  exactHits: 1,
  groupName: "Amigos",
  groups: {
    age: null,
    city: null,
    country: null,
    favoriteTeam: null,
    province: null,
    school: null,
    subgroups: [],
  },
  id: "00000000-0000-4000-8000-000000000001",
  isCurrentPlayer: true,
  lastFive: ["exact", "outcome", "miss", "miss", "miss"],
  matchPoints: 12,
  miMundialBonusPoints: 5,
  name: "Jose",
  outcomeHits: 2,
  predictedMatchesCount: 4,
  rank: 2,
  totalPoints: 17,
  trend: { direction: "same", value: 0 },
} satisfies LeaderboardPlayer;

describe("LeaderboardRow", () => {
  it("links the complete row to the player's read-only Mi Mundial", () => {
    const html = renderToStaticMarkup(
      createElement(LeaderboardRow, {
        player,
        reduceMotion: true,
      }),
    );

    expect(html).toContain(
      'href="/jugadores/00000000-0000-4000-8000-000000000001/mi-mundial"',
    );
    expect(html).toContain("Ver Mi Mundial de Jose");
    expect(html).toContain("Tú");
    expect(html).toContain(
      "grid-cols-[2.25rem_minmax(0,1fr)_3.75rem]",
    );
    expect(html).toContain("bg-prode-yellow text-prode-black");
    expect(html).not.toContain("bg-prode-yellow outline");
    expect(html).not.toContain("grayscale");
  });

  it("renders neutral recent-result slots as dashes", () => {
    const html = renderToStaticMarkup(
      createElement(LeaderboardRow, {
        player: {
          ...player,
          lastFive: ["empty", "empty", "empty", "empty", "empty"],
        },
        reduceMotion: true,
      }),
    );

    expect(html).toContain("Sin resultado puntuado");
    expect(html).not.toContain("Pronóstico errado");
  });

  it("uses the same outcome marker color and avatar treatment for every player", () => {
    const currentPlayerHtml = renderToStaticMarkup(
      createElement(LeaderboardRow, {
        player,
        reduceMotion: true,
      }),
    );
    const otherPlayerHtml = renderToStaticMarkup(
      createElement(LeaderboardRow, {
        player: {
          ...player,
          id: "00000000-0000-4000-8000-000000000002",
          isCurrentPlayer: false,
        },
        reduceMotion: true,
      }),
    );

    expect(currentPlayerHtml).toContain("bg-prode-yellow text-prode-black");
    expect(otherPlayerHtml).toContain("bg-prode-yellow text-prode-black");
    expect(currentPlayerHtml).not.toContain("grayscale");
    expect(otherPlayerHtml).not.toContain("grayscale");
  });
});
