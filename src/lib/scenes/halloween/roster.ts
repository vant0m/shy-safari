/**
 * The Pumpkin Hollow Roster: every Creature that can appear in this Scene,
 * all of them from the first day it is open (`halloween/calendar.ts`).
 *
 * A hillside pumpkin patch on Halloween eve: real animals people link with
 * Halloween as Commons, magical critters as Uncommons, and big friendly
 * monsters as Rares, Jack O. Lantern among them. Spooky-cute, never scary.
 *
 * Slugs match the SVG filenames in `./creatures/`, and are unique across every
 * Scene, since names and facts are filed by slug. `width` is against a
 * 1920px-wide Scene, on the one scale every Scene shares (a person about
 * 100px tall, docs/svg-art-brief.md): small animals are drawn bigger than
 * life to stay readable, and Jack O. Lantern is the size of a person. Ground
 * animals walk the savanna's band among the
 * pumpkins, as in the forest, and the bat and the owl fly over the patch.
 */

import type { CreatureDef } from "$lib/scenes/types";

export const HALLOWEEN_ROSTER: CreatureDef[] = [
  // Common: the opening seven.
  {
    slug: "harvest-mouse",
    tier: "common",
    width: 38,
    motion: "trot",
    parts: ["part-tail", "part-ears"],
  },
  {
    slug: "garden-spider",
    tier: "common",
    width: 36,
    motion: "scuttle",
    parts: ["part-body"],
  },
  { slug: "toad", tier: "common", width: 39, motion: "hop", parts: [] },
  {
    slug: "brown-bat",
    tier: "common",
    width: 58,
    motion: "soar",
    parts: ["part-wings"],
  },
  {
    slug: "crow",
    tier: "common",
    width: 50,
    motion: "hop",
    parts: ["part-tail", "part-head"],
  },
  {
    slug: "barn-owl",
    tier: "common",
    width: 63,
    motion: "soar",
    parts: ["part-wings"],
  },
  {
    slug: "black-cat",
    tier: "common",
    width: 47,
    motion: "trot",
    parts: ["part-tail", "part-ears"],
  },

  // Uncommon: magical critters.
  {
    slug: "little-ghost",
    tier: "uncommon",
    width: 57,
    motion: "hover",
    departure: "fade",
    parts: ["part-body"],
  },
  {
    slug: "cloudy-moon",
    tier: "uncommon",
    width: 66,
    motion: "drift",
    departure: "fade",
    parts: ["part-body"],
  },
  {
    slug: "gourdling",
    tier: "uncommon",
    width: 52,
    motion: "trot",
    parts: ["part-head", "part-ears", "part-tail"],
  },
  {
    slug: "scarecrow",
    tier: "uncommon",
    width: 93,
    motion: "graze",
    parts: ["part-arms", "part-head"],
  },
  {
    slug: "mummy",
    tier: "uncommon",
    width: 108,
    motion: "creep",
    parts: ["part-arms", "part-tail"],
  },

  // Rare: one each per Session at most.
  {
    slug: "vampire",
    tier: "rare",
    width: 65,
    motion: "trot",
    parts: ["part-wings"],
  },
  {
    slug: "gargoyle",
    tier: "rare",
    width: 77,
    // Long stops between short walks: it holds still like a statue.
    motion: "graze",
    parts: ["part-tail", "part-wings"],
  },
  {
    slug: "howling-wolf",
    tier: "rare",
    width: 72,
    motion: "graze",
    parts: ["part-head", "part-ears", "part-tail"],
  },
  {
    slug: "great-boo",
    tier: "rare",
    width: 154,
    motion: "glide",
    departure: "fade",
    parts: ["part-body", "part-arms"],
  },
  {
    slug: "jack-o-lantern",
    tier: "rare",
    width: 83,
    motion: "graze",
    departure: "fade",
    parts: ["part-head", "part-arms", "part-pulse"],
  },
];
