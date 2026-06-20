import { describe, expect, it } from "vitest";

import {
  getMatchAnchorId,
  getNextUnfinishedMatchId,
} from "@/lib/dashboard/fixture-jump";

describe("getNextUnfinishedMatchId", () => {
  it("returns the first non-finished match in list order", () => {
    expect(
      getNextUnfinishedMatchId([
        item("match-1", "finished"),
        item("match-2", "finished"),
        item("match-3", "live"),
        item("match-4", "scheduled"),
      ]),
    ).toBe("match-3");
  });

  it("returns null when every match is finished", () => {
    expect(
      getNextUnfinishedMatchId([
        item("match-1", "finished"),
        item("match-2", "finished"),
      ]),
    ).toBeNull();
  });

  it("includes stopped matches as unfinished", () => {
    expect(
      getNextUnfinishedMatchId([
        item("match-1", "finished"),
        item("match-2", "stopped"),
      ]),
    ).toBe("match-2");
  });
});

describe("getMatchAnchorId", () => {
  it("builds a stable match anchor", () => {
    expect(getMatchAnchorId("match-3")).toBe("prediction-match-match-3");
  });
});

function item(
  id: string,
  tone: "finished" | "live" | "scheduled" | "stopped",
) {
  return {
    match: {
      id,
      status: { tone },
    },
  };
}
