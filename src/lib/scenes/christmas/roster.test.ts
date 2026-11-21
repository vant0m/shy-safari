import { describe, expect, it } from "bun:test";
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
});
