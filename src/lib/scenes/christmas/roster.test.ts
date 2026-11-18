import { describe, expect, it } from "bun:test";
import { NEWCOMERS, OPENING } from "./calendar";
import { CHRISTMAS_ROSTER } from "./roster";

// The files themselves are checked with every other Scene's, in
// `scenes/artwork.test.ts`.
describe("the Christmas chalet Roster", () => {
  it("has 8 Common, 6 Uncommon and 3 Rare, and no Legendary", () => {
    const count = (tier: string) =>
      CHRISTMAS_ROSTER.filter((def) => def.tier === tier).length;
    expect([
      count("common"),
      count("uncommon"),
      count("rare"),
      count("legendary"),
    ]).toEqual([8, 6, 3, 0]);
  });

  it("is exactly what the calendar unlocks", () => {
    const scheduled = [...OPENING, ...NEWCOMERS.map(({ slug }) => slug)];
    expect(CHRISTMAS_ROSTER.map((def) => def.slug).sort()).toEqual(
      scheduled.sort(),
    );
  });

  it("opens with Commons, and only grows rarer", () => {
    for (const slug of OPENING) {
      expect(CHRISTMAS_ROSTER.find((def) => def.slug === slug)?.tier).toBe(
        "common",
      );
    }
    const order = { common: 0, uncommon: 1, rare: 2, legendary: 3 };
    const tiers = NEWCOMERS.map(
      ({ slug }) =>
        order[CHRISTMAS_ROSTER.find((def) => def.slug === slug)!.tier],
    );
    expect(tiers).toEqual([...tiers].sort());
  });

  it("ends on the biggest Creature in the Scene", () => {
    const finale = CHRISTMAS_ROSTER.find((def) => def.slug === "santa")!;
    for (const def of CHRISTMAS_ROSTER) {
      expect(def.width).toBeLessThanOrEqual(finale.width);
    }
  });

  it("hangs only decorations from the garland", () => {
    expect(
      CHRISTMAS_ROSTER.filter((def) => def.motion === "dangle")
        .map((def) => def.slug)
        .sort(),
    ).toEqual(["bauble", "stocking"]);
  });
});
