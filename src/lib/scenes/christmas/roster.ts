/**
 * The Christmas chalet Roster: every Creature that can appear in this
 * Scene, all of them from the first day it is open (`christmas/calendar.ts`).
 *
 * A snowy Christmas village at night under the northern lights: winter
 * animals and Christmas decorations come to life as Commons; elves, six of
 * Father Christmas's reindeer (each told apart by one mark) and Mrs Claus as
 * Uncommons; the sleigh, Rudolph and Father Christmas himself as Rares. When
 * all three are here at once they become the Legendary, Father Christmas's
 * sleigh pulled by Rudolph.
 * Cosy and gentle; nothing in it is religious.
 *
 * Slugs match the SVG filenames in `./creatures/`, and are unique across every
 * Scene, since names and facts are filed by slug. `width` is against a
 * 1920px-wide Scene, on the one scale every Scene shares (a person about
 * 100px tall, docs/svg-art-brief.md): small things are drawn bigger than life
 * to stay readable, never bigger than an elf. Ground Creatures walk the
 * savanna's band, the bauble, the stocking and the cracker float, and
 * Rudolph and the sleigh fly high over the rooftops (`flyover`).
 */

import type { CreatureDef } from "$lib/scenes/types";

export const CHRISTMAS_ROSTER: CreatureDef[] = [
  // Common: winter animals and decorations come to life.
  {
    slug: "european-robin",
    tier: "common",
    width: 31,
    motion: "hop",
    parts: ["part-tail"],
  },
  {
    slug: "snowman",
    tier: "common",
    width: 72,
    // Long stops between short shuffles.
    motion: "graze",
    parts: ["part-arms"],
  },
  {
    slug: "gingerbread",
    tier: "common",
    width: 31,
    motion: "trot",
    parts: ["part-arms"],
  },
  {
    slug: "candle",
    tier: "common",
    width: 22,
    motion: "graze",
    departure: "fade",
    parts: ["part-pulse"],
  },
  {
    slug: "candy-cane",
    tier: "common",
    width: 24,
    motion: "hop",
    departure: "fade",
    parts: [],
  },
  {
    slug: "bauble",
    tier: "common",
    width: 29,
    motion: "hover",
    departure: "fade",
    parts: ["part-fin"],
  },
  {
    slug: "cracker",
    tier: "common",
    width: 56,
    motion: "hover",
    departure: "fade",
    parts: ["part-body"],
  },
  {
    slug: "stocking",
    tier: "common",
    width: 30,
    motion: "hover",
    departure: "fade",
    parts: ["part-fin"],
  },
  // Uncommon: elves, reindeer and Mrs Claus.
  {
    slug: "elf-gift",
    tier: "uncommon",
    width: 43,
    motion: "trot",
    parts: ["part-head"],
  },
  {
    slug: "reindeer-comet",
    tier: "uncommon",
    width: 99,
    motion: "graze",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "elf-list",
    tier: "uncommon",
    width: 43,
    motion: "trot",
    parts: ["part-head"],
  },
  {
    slug: "reindeer-cupid",
    tier: "uncommon",
    width: 99,
    motion: "graze",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "mrs-claus",
    tier: "uncommon",
    width: 68,
    motion: "graze",
    parts: ["part-head"],
  },
  {
    slug: "reindeer-blitzen",
    tier: "uncommon",
    width: 99,
    motion: "trot",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "reindeer-dasher",
    tier: "uncommon",
    width: 99,
    motion: "trot",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "reindeer-dancer",
    tier: "uncommon",
    width: 99,
    motion: "trot",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "reindeer-donner",
    tier: "uncommon",
    width: 99,
    motion: "graze",
    parts: ["part-tail", "part-ears"],
  },
  // Rare: one each per Session at most.
  {
    slug: "sleigh",
    tier: "rare",
    width: 150,
    motion: "flyover",
    departure: "fade",
    parts: [],
  },
  {
    slug: "rudolph",
    tier: "rare",
    width: 111,
    motion: "flyover",
    parts: ["part-ears", "part-pulse"],
  },
  {
    slug: "santa",
    tier: "rare",
    width: 88,
    // Long stops to wave, at whatever depth he is: no giant's lane.
    motion: "graze",
    departure: "fade",
    parts: ["part-arms"],
  },
  // Legendary: never rolled. Forms when Rudolph, Father Christmas and the
  // sleigh are all here at once, and they leave in its place
  // (`session/combos.ts`); the Scene celebrates with the sleigh ride.
  {
    slug: "santa-sleigh",
    tier: "legendary",
    width: 262,
    motion: "flyover",
    departure: "fade",
    parts: ["part-arms", "part-ears", "part-pulse"],
    formedFrom: ["rudolph", "santa", "sleigh"],
  },
];
