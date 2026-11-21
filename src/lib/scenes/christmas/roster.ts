/**
 * The Christmas chalet Roster: every Creature that can appear in this
 * Scene, all of them from the first day it is open (`christmas/calendar.ts`).
 *
 * A snowy Christmas village at night under the northern lights: winter
 * animals and Christmas decorations come to life as Commons; elves, three of
 * Father Christmas's reindeer (each told apart by one mark) and Mrs Claus as
 * Uncommons; the sleigh, Rudolph and Father Christmas himself as Rares.
 * Cosy and gentle; nothing in it is religious.
 *
 * Slugs match the SVG filenames in `./creatures/`, and are unique across every
 * Scene, since names and facts are filed by slug. `width` is against a
 * 1920px-wide Scene. Ground Creatures walk the savanna's band across the
 * clearing, the bauble and the stocking hang from the garland across the top
 * (`dangle`), the cracker floats, and Rudolph and the sleigh fly over.
 */

import type { CreatureDef } from "$lib/scenes/types";

export const CHRISTMAS_ROSTER: CreatureDef[] = [
  // Common: winter animals and decorations come to life.
  {
    slug: "european-robin",
    tier: "common",
    width: 34,
    motion: "hop",
    parts: ["part-tail"],
  },
  {
    slug: "snowman",
    tier: "common",
    width: 62,
    // Long stops between short shuffles.
    motion: "graze",
    parts: ["part-arms"],
  },
  {
    slug: "gingerbread",
    tier: "common",
    width: 44,
    motion: "trot",
    parts: ["part-arms"],
  },
  {
    slug: "candle",
    tier: "common",
    width: 30,
    motion: "graze",
    departure: "fade",
    parts: ["part-pulse"],
  },
  {
    slug: "candy-cane",
    tier: "common",
    width: 34,
    motion: "hop",
    departure: "fade",
    parts: [],
  },
  {
    slug: "bauble",
    tier: "common",
    width: 46,
    motion: "dangle",
    departure: "fade",
    parts: ["part-fin"],
  },
  {
    slug: "cracker",
    tier: "common",
    width: 76,
    motion: "hover",
    departure: "fade",
    parts: ["part-body"],
  },
  {
    slug: "stocking",
    tier: "common",
    width: 44,
    motion: "dangle",
    departure: "fade",
    parts: ["part-fin"],
  },
  // Uncommon: elves, reindeer and Mrs Claus.
  {
    slug: "elf-gift",
    tier: "uncommon",
    width: 58,
    motion: "trot",
    parts: ["part-head"],
  },
  {
    slug: "reindeer-comet",
    tier: "uncommon",
    width: 112,
    motion: "graze",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "elf-list",
    tier: "uncommon",
    width: 62,
    motion: "trot",
    parts: ["part-head"],
  },
  {
    slug: "reindeer-cupid",
    tier: "uncommon",
    width: 112,
    motion: "graze",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "mrs-claus",
    tier: "uncommon",
    width: 76,
    motion: "graze",
    parts: ["part-head"],
  },
  {
    slug: "reindeer-blitzen",
    tier: "uncommon",
    width: 112,
    motion: "trot",
    parts: ["part-tail", "part-ears"],
  },
  // Rare: one each per Session at most.
  {
    slug: "sleigh",
    tier: "rare",
    width: 170,
    motion: "glide",
    departure: "fade",
    parts: [],
  },
  {
    slug: "rudolph",
    tier: "rare",
    width: 124,
    motion: "soar",
    parts: ["part-ears", "part-pulse"],
  },
  {
    slug: "santa",
    tier: "rare",
    width: 190,
    // At the back of the clearing, with long stops to wave.
    motion: "stride",
    departure: "fade",
    parts: ["part-arms"],
  },
];
