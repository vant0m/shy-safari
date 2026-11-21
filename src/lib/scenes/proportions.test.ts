/**
 * One scale for every Creature (docs/svg-art-brief.md, "One scale"): a person
 * is about 100px tall against the 1920px-wide reference Scene, about 55px a
 * metre, as on the savanna and as the Christmas chalet's door is drawn. Big
 * things keep to it; small things are drawn bigger than life so they stay
 * readable, but never taller than an elf. Checked for the limited-time Scenes,
 * whose sizes were once far off (a Jack O. Lantern half the screen high).
 *
 * A Creature's height is its Roster width times its viewBox's height over its
 * width; on screen it is then drawn at 0.7 (far) to 1.4 (near) of that
 * (`components/Creature.svelte`).
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CHRISTMAS_ROSTER } from "./christmas/roster";
import { HALLOWEEN_ROSTER } from "./halloween/roster";
import type { CreatureDef } from "./types";

function height(scene: string, def: CreatureDef): number {
  const svg = readFileSync(
    join(import.meta.dir, scene, "creatures", `${def.slug}.svg`),
    "utf8",
  );
  const [, , w, h] = svg
    .match(/viewBox="([^"]*)"/)![1]
    .split(/\s+/)
    .map(Number);
  return (def.width * h) / w;
}

const SCENES: [string, CreatureDef[]][] = [
  ["halloween", HALLOWEEN_ROSTER],
  ["christmas", CHRISTMAS_ROSTER],
];

/** People, and Creatures the size of one. */
const PERSON_SIZED = [
  "vampire",
  "scarecrow",
  "mummy",
  "jack-o-lantern",
  "santa",
  "mrs-claus",
];

/** Things smaller than an elf in life, drawn bigger to be seen. */
const SMALL = [
  "harvest-mouse",
  "garden-spider",
  "toad",
  "crow",
  "black-cat",
  "european-robin",
  "gingerbread",
  "candle",
  "candy-cane",
  "bauble",
  "stocking",
  "cracker",
];

describe("one scale", () => {
  for (const [scene, roster] of SCENES) {
    const elf = Math.min(
      ...roster
        .filter((def) => def.slug.startsWith("elf-"))
        .map((def) => height(scene, def)),
    );

    for (const def of roster) {
      const h = height(scene, def);

      it(`keeps ${def.slug} readable and below a giant's size`, () => {
        expect(h).toBeGreaterThanOrEqual(20);
        expect(h).toBeLessThanOrEqual(130);
      });

      if (PERSON_SIZED.includes(def.slug)) {
        it(`draws ${def.slug} about the height of a person`, () => {
          expect(h).toBeGreaterThanOrEqual(85);
          expect(h).toBeLessThanOrEqual(115);
        });
      }

      if (SMALL.includes(def.slug)) {
        it(`never draws ${def.slug} as tall as a person`, () => {
          expect(h).toBeLessThanOrEqual(Number.isFinite(elf) ? elf : 50);
        });
      }
    }
  }
});
