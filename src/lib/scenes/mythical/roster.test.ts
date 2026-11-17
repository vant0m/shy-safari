import { describe, expect, it } from "bun:test";
import { MOTION_PROFILES } from "../motion";
import { MYTHICAL_ROSTER } from "./roster";

// The files themselves are checked with every other Scene's, in
// `scenes/artwork.test.ts`.
describe("the mythical Roster", () => {
  it("has the savanna's shape, plus its Legendary: 8, 6, 3 and 1", () => {
    const count = (tier: string) =>
      MYTHICAL_ROSTER.filter((def) => def.tier === tier).length;
    expect([
      count("common"),
      count("uncommon"),
      count("rare"),
      count("legendary"),
    ]).toEqual([8, 6, 3, 1]);
  });

  it("puts creatures in the meadow, on the lake and in the air", () => {
    const places = new Set(
      MYTHICAL_ROSTER.map(({ motion }) =>
        motion === "paddle"
          ? "lake"
          : MOTION_PROFILES[motion].ground
            ? "meadow"
            : "air",
      ),
    );
    expect([...places].sort()).toEqual(["air", "lake", "meadow"]);
  });

  it("keeps the swimmers drawn from the waterline up to the lake", () => {
    const swimmers = MYTHICAL_ROSTER.filter((def) => def.motion === "paddle");
    expect(swimmers.map((def) => def.slug).sort()).toEqual([
      "bakunawa",
      "boto",
      "mermaid",
    ]);
  });
});
