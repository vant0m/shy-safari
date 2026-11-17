/**
 * The mythical Roster: creatures from the world's stories, in an enchanted
 * valley — a flowery meadow, a lake fed by a waterfall, a castle on a far
 * hill (`ambient/backdrop.svg`). They come from many places on purpose: a
 * kitsune and a qilin from East Asia, a bakunawa from the Philippines, a boto
 * from the Amazon, an impundulu from southern Africa, a griffin and a centaur
 * from ancient Greece and the Near East, and the fairy, the unicorn and the
 * will-o'-the-wisp of European folk tales.
 *
 * Slugs match the SVG filenames in `./creatures/`; `width` is the intended
 * on-screen width against a 1920px-wide Scene. The backdrop was drawn for
 * the shared bands of `scenes/motion.ts`: the meadow is the savanna's plain,
 * and the lake is the Arctic's open water, so the swimmers (`paddle`) are
 * drawn from the waterline up, as the whales are there.
 */

import type { CreatureDef } from "$lib/scenes/types";

export const MYTHICAL_ROSTER: CreatureDef[] = [
  // Common
  {
    slug: "fairy",
    tier: "common",
    width: 44,
    motion: "hover",
    parts: ["part-wings"],
  },
  {
    slug: "moon-rabbit",
    tier: "common",
    width: 42,
    motion: "hop",
    parts: ["part-arms", "part-ears"],
  },
  {
    slug: "carbunclo",
    tier: "common",
    width: 46,
    motion: "trot",
    parts: ["part-ears", "part-pulse"],
  },
  {
    slug: "fire-salamander",
    tier: "common",
    width: 70,
    motion: "creep",
    // Drawn side-on, so it must turn to face the way it walks.
    flips: true,
    parts: ["part-pulse", "part-tail"],
  },
  {
    slug: "will-o-the-wisp",
    tier: "common",
    width: 34,
    motion: "drift",
    // A light, not an animal: it fades away rather than running.
    departure: "fade",
    parts: ["part-pulse"],
  },
  {
    slug: "boto",
    tier: "common",
    width: 120,
    motion: "paddle",
    parts: ["part-tail"],
  },
  {
    slug: "baby-dragon",
    tier: "common",
    width: 80,
    motion: "trot",
    parts: ["part-tail", "part-wings"],
  },
  {
    slug: "kitsune",
    tier: "common",
    width: 100,
    motion: "trot",
    parts: ["part-ears", "part-tail"],
  },

  // Uncommon
  {
    slug: "mermaid",
    tier: "uncommon",
    width: 110,
    motion: "paddle",
    parts: ["part-arms", "part-tail"],
  },
  {
    slug: "impundulu",
    tier: "uncommon",
    width: 110,
    motion: "soar",
    parts: ["part-tail", "part-wings"],
  },
  {
    slug: "griffin",
    tier: "uncommon",
    width: 150,
    motion: "soar",
    parts: ["part-tail", "part-wings"],
  },
  {
    slug: "centaur",
    tier: "uncommon",
    width: 130,
    motion: "trot",
    parts: ["part-arms", "part-tail"],
  },
  {
    slug: "unicorn",
    tier: "uncommon",
    width: 140,
    motion: "graze",
    parts: ["part-head", "part-tail"],
  },
  {
    slug: "qilin",
    tier: "uncommon",
    width: 140,
    motion: "graze",
    parts: ["part-head", "part-tail"],
  },

  // Rare — the jackpot. One each per Session, at most.
  {
    slug: "phoenix",
    tier: "rare",
    width: 180,
    motion: "soar",
    parts: ["part-pulse", "part-tail", "part-wings"],
  },
  {
    slug: "bakunawa",
    tier: "rare",
    width: 320,
    motion: "paddle",
    parts: ["part-body", "part-head"],
  },
  {
    slug: "dragon",
    tier: "rare",
    width: 300,
    motion: "soar",
    parts: ["part-tail", "part-wings"],
  },

  // Legendary: about one arrival in two hundred, and at most once a Session
  // (docs/adr/0012-legendary-tier.md). Pegasus, the winged horse.
  {
    slug: "pegasus",
    tier: "legendary",
    width: 170,
    motion: "graze",
    parts: ["part-head", "part-tail", "part-wings"],
  },
];
