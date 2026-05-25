import { describe, expect, it } from "vitest";

import {
  FIFA_ANNEX_C_COMBINATIONS,
  findFifaAnnexCCombination,
} from "@/lib/tournament/third-place-combinations";

describe("findFifaAnnexCCombination", () => {
  it("finds the official option for an exact set of eight third-placed groups", () => {
    const combination = findFifaAnnexCCombination([
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
    ]);

    expect(combination).toMatchObject({
      groups: ["E", "F", "G", "H", "I", "J", "K", "L"],
      option: 1,
      slots: {
        "1A": "E",
        "1B": "J",
        "1D": "I",
        "1E": "F",
        "1G": "H",
        "1I": "G",
        "1K": "L",
        "1L": "K",
      },
    });
  });

  it("normalizes input order and casing before lookup", () => {
    const combination = findFifaAnnexCCombination([
      "l",
      "j",
      "i",
      "h",
      "g",
      "f",
      "e",
      "k",
    ]);

    expect(combination?.option).toBe(1);
  });

  it("returns null for a group set that does not exist in Annex C", () => {
    expect(
      findFifaAnnexCCombination(["A", "B", "C", "D", "E", "F", "G", "Z"]),
    ).toBeNull();
  });

  it("encodes all 495 unique Annex C combinations", () => {
    const uniqueGroupSets = new Set(
      FIFA_ANNEX_C_COMBINATIONS.map((combination) =>
        combination.groups.join(""),
      ),
    );

    expect(FIFA_ANNEX_C_COMBINATIONS).toHaveLength(495);
    expect(uniqueGroupSets.size).toBe(495);
  });
});
