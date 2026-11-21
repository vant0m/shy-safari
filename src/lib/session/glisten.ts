/**
 * How long a Creature glistens after it arrives: an Uncommon or Rare for its
 * first minute, so the class notices it, a Legendary (rainbow halo and all)
 * for three, then each settles down to look like everyone else.
 *
 * Counted from when it arrived, not from when it was last drawn, so leaving
 * the Scene and coming back, or a refresh, never cuts the effect short; it
 * just carries on for whatever time it had left.
 *
 * Pure: the caller says when it arrived and what time it is now.
 */

import type { RarityTier } from "$lib/scenes/types";

export const GLISTEN_MS = 60_000;
/** A Legendary is a once-in-many-Sessions event: it shimmers for longer. */
export const LEGEND_GLISTEN_MS = 180_000;

/** How long it glistens in all; 0 for a Common, which never does. */
export function glistenFor(tier: RarityTier): number {
  if (tier === "legendary") return LEGEND_GLISTEN_MS;
  if (tier === "rare" || tier === "uncommon") return GLISTEN_MS;
  return 0;
}

/**
 * Milliseconds of glistening left. A Creature saved before arrival times
 * were kept (`arrivedAt` unknown) has had its turn.
 */
export function glistenLeft(
  tier: RarityTier,
  arrivedAt: number | undefined,
  now: number,
): number {
  if (arrivedAt === undefined) return 0;
  return Math.max(0, glistenFor(tier) - Math.max(0, now - arrivedAt));
}
