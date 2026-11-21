/**
 * What every Scene's Roster is made of. Shared so the Session, the roll and
 * the animation layer never care which Scene is on screen.
 */

import type { DepartureStyle, MotionStyle } from "./motion";

/** Which Scene is on screen. See `scenes/index.ts`. */
export type SceneId =
  | "reef"
  | "savanna"
  | "space"
  | "prehistoric"
  | "forest"
  | "jungle"
  | "arctic"
  | "mythical"
  | "halloween"
  | "christmas";

export const SCENE_IDS: SceneId[] = [
  "savanna",
  "reef",
  "space",
  "prehistoric",
  "forest",
  "jungle",
  "arctic",
  "mythical",
  // Only on offer for a few weeks a year (`scenes/limited/calendar.ts`).
  "halloween",
  "christmas",
];

/** What a first visit, and the prerendered page, shows. */
export const DEFAULT_SCENE: SceneId = "savanna";

/**
 * Legendary is the rarest of all: one Creature per Scene, about one arrival
 * in two hundred, and at most once per Session (docs/adr/0012-legendary-tier.md).
 */
export type RarityTier = "common" | "uncommon" | "rare" | "legendary";

/** Every tier, commonest first, for lists that show them in order. */
export const RARITY_TIERS: RarityTier[] = [
  "common",
  "uncommon",
  "rare",
  "legendary",
];

/** The part group classes the animation layer knows how to move. */
export const ANIMATABLE_PARTS = [
  "part-tail",
  "part-fin",
  "part-body",
  "part-tentacles",
  "part-arms",
  // Savanna additions; their keyframes live in scenes/savanna/creatures.css.
  "part-ears",
  "part-wings",
  "part-head",
  // Deep space additions; their keyframes live in scenes/space/creatures.css.
  "part-spin",
  "part-pulse",
] as const;

export type AnimatablePart = (typeof ANIMATABLE_PARTS)[number];

export interface CreatureDef {
  /** Matches the SVG filename, kebab-case. */
  slug: string;
  tier: RarityTier;
  /** Intended px width against a 1920px-wide Scene. */
  width: number;
  /** How it moves around the Scene once it has arrived. */
  motion: MotionStyle;
  /** Overrides whether it faces its direction of travel (`motion`'s `flips`). */
  flips?: boolean;
  /**
   * Overrides how its Scene's Creatures leave when they Run Away: in Pumpkin
   * Hollow the animals run, but a ghost fades away.
   */
  departure?: DepartureStyle;
  /** The part-* classes actually present in the artwork. */
  parts: AnimatablePart[];
}
