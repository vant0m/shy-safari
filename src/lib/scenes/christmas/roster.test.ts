import { describe, expect, it } from "bun:test";
import { CHRISTMAS_ROSTER } from "./roster";

// The files themselves are checked with every other Scene's, in
// `scenes/artwork.test.ts`.
describe("the Christmas chalet Roster", () => {
  it("has 8 Common, 9 Uncommon, 3 Rare and 1 Legendary", () => {
    const count = (tier: string) =>
      CHRISTMAS_ROSTER.filter((def) => def.tier === tier).length;
    expect([
      count("common"),
      count("uncommon"),
      count("rare"),
      count("legendary"),
    ]).toEqual([8, 9, 3, 1]);
  });

  it("forms its Legendary from the three Rares, and never rolls it", () => {
    const legend = CHRISTMAS_ROSTER.find((def) => def.tier === "legendary")!;
    expect(legend.slug).toBe("santa-sleigh");
    expect(legend.formedFrom?.sort()).toEqual(
      CHRISTMAS_ROSTER.filter((def) => def.tier === "rare")
        .map((def) => def.slug)
        .sort(),
    );
  });
});
