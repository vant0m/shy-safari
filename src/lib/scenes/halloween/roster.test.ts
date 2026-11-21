import { describe, expect, it } from "bun:test";
import { HALLOWEEN_ROSTER } from "./roster";

// The files themselves are checked with every other Scene's, in
// `scenes/artwork.test.ts`.
describe("the Pumpkin Hollow Roster", () => {
  it("has 7 Common, 5 Uncommon and 5 Rare", () => {
    const count = (tier: string) =>
      HALLOWEEN_ROSTER.filter((def) => def.tier === tier).length;
    expect([count("common"), count("uncommon"), count("rare")]).toEqual([
      7, 5, 5,
    ]);
  });
});
