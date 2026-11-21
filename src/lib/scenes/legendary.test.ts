/**
 * Every always-on Scene has exactly one Legendary Creature
 * (docs/adr/0012-legendary-tier.md). Pumpkin Hollow has none; the Christmas
 * chalet's only forms, from its three Rares (docs/adr/0016-christmas-chalet.md).
 */

import { describe, expect, it } from "bun:test";
import { ARCTIC_ROSTER } from "./arctic/roster";
import { FOREST_ROSTER } from "./forest/roster";
import { CHRISTMAS_ROSTER } from "./christmas/roster";
import { HALLOWEEN_ROSTER } from "./halloween/roster";
import { JUNGLE_ROSTER } from "./jungle/roster";
import { MYTHICAL_ROSTER } from "./mythical/roster";
import { PREHISTORIC_ROSTER } from "./prehistoric/roster";
import { REEF_ROSTER } from "./reef/roster";
import { SAVANNA_ROSTER } from "./savanna/roster";
import { SPACE_ROSTER } from "./space/roster";
import type { CreatureDef } from "./types";

const ALWAYS_ON: Record<string, CreatureDef[]> = {
  savanna: SAVANNA_ROSTER,
  reef: REEF_ROSTER,
  space: SPACE_ROSTER,
  prehistoric: PREHISTORIC_ROSTER,
  forest: FOREST_ROSTER,
  jungle: JUNGLE_ROSTER,
  arctic: ARCTIC_ROSTER,
  mythical: MYTHICAL_ROSTER,
};

const legends = (roster: CreatureDef[]) =>
  roster.filter((def) => def.tier === "legendary");

describe("Legendary Creatures", () => {
  for (const [id, roster] of Object.entries(ALWAYS_ON)) {
    it(`gives ${id} exactly one`, () => {
      expect(legends(roster)).toHaveLength(1);
    });
  }

  it("leaves Pumpkin Hollow without one", () => {
    expect(legends(HALLOWEEN_ROSTER)).toHaveLength(0);
  });

  it("gives the Christmas chalet one that forms rather than arrives", () => {
    const found = legends(CHRISTMAS_ROSTER);
    expect(found).toHaveLength(1);
    expect(found[0].formedFrom?.length).toBe(3);
  });
});
