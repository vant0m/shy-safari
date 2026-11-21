import { describe, expect, it } from "bun:test";
import { CHRISTMAS_ROSTER } from "$lib/scenes/christmas/roster";
import type { CreatureDef } from "$lib/scenes/types";
import { findCombo, isFormed, partsOnScreen } from "./combos";
import { rollCreature } from "./roll";

const here = (...slugs: string[]) =>
  slugs.map((slug, i) => ({ id: i + 1, def: { slug } }));

describe("formed Creatures", () => {
  it("forms Father Christmas's sleigh from Rudolph, Father Christmas and the sleigh", () => {
    const combo = findCombo(
      CHRISTMAS_ROSTER,
      here("snowman", "rudolph", "santa", "sleigh"),
      [],
      [],
    );
    expect(combo?.def.slug).toBe("santa-sleigh");
    expect(combo?.def.tier).toBe("legendary");
    expect(combo?.ids.sort()).toEqual([2, 3, 4]);
  });

  it("needs all three", () => {
    expect(
      findCombo(CHRISTMAS_ROSTER, here("rudolph", "santa"), [], []),
    ).toBeNull();
    expect(
      findCombo(CHRISTMAS_ROSTER, here("santa", "sleigh"), [], []),
    ).toBeNull();
  });

  it("does not count one that is running away", () => {
    expect(
      findCombo(CHRISTMAS_ROSTER, here("rudolph", "santa", "sleigh"), [2], []),
    ).toBeNull();
  });

  it("forms at most once a Session", () => {
    expect(
      findCombo(
        CHRISTMAS_ROSTER,
        here("rudolph", "santa", "sleigh"),
        [],
        ["santa-sleigh"],
      ),
    ).toBeNull();
  });

  it("keeps Rudolph, Father Christmas and the sleigh from coming again beside it", () => {
    const parts = partsOnScreen(
      CHRISTMAS_ROSTER,
      here("snowman", "santa-sleigh"),
    );
    expect(parts.sort()).toEqual(["rudolph", "santa", "sleigh"]);
    const rares = CHRISTMAS_ROSTER.filter(
      (def) => def.tier === "rare" && !isFormed(def),
    );
    for (let i = 0; i < 200; i++) {
      expect(rollCreature(rares, parts, Math.random)).toBeNull();
    }
  });

  it("is never brought by the roll", () => {
    const rollable = CHRISTMAS_ROSTER.filter((def) => !isFormed(def));
    for (let i = 0; i < 2000; i++) {
      const def = rollCreature(rollable, [], Math.random) as CreatureDef;
      expect(def.slug).not.toBe("santa-sleigh");
    }
  });
});
