/**
 * Choosing which Creature arrives.
 *
 * Rarity is a weighted roll rather than a schedule, so a whale shark is a
 * genuine event that many Sessions will not see at all. Common and Uncommon
 * species may arrive more than once — that is what keeps a long work period
 * producing visible arrivals after every species has been seen. Rare species
 * appear at most once each while present. A Legendary one is rarer still,
 * about one arrival in two hundred, and the caller lists it in `present` for
 * the rest of the Session once it has come, so it never comes twice.
 *
 * Pure: the caller supplies the random source, so the distribution is testable.
 */

import type { CreatureDef, RarityTier } from "$lib/scenes/types";

export const TIER_WEIGHTS: Record<RarityTier, number> = {
  common: 60,
  uncommon: 30,
  rare: 10,
  // Half a percent of every arrival: a Session of an hour at the Normal rate
  // has about a one-in-twenty chance of seeing it.
  legendary: 0.5,
};

/** The tiers that arrive at most once while present. */
export function isUnique(tier: RarityTier): boolean {
  return tier === "rare" || tier === "legendary";
}

function isEligible(creature: CreatureDef, present: string[]): boolean {
  return !isUnique(creature.tier) || !present.includes(creature.slug);
}

export function rollCreature(
  roster: CreatureDef[],
  present: string[],
  random: () => number,
): CreatureDef | null {
  const eligible = roster.filter((creature) => isEligible(creature, present));
  if (eligible.length === 0) return null;

  // Only tiers that still have something to give take part, and their weights
  // are renormalised — once all three Rares have been seen, their 10% goes back
  // to the tiers that can still deliver rather than producing empty rolls.
  const tiers = [...new Set(eligible.map((creature) => creature.tier))];
  const totalWeight = tiers.reduce((sum, tier) => sum + TIER_WEIGHTS[tier], 0);

  let ticket = random() * totalWeight;
  let chosenTier = tiers[tiers.length - 1];
  for (const tier of tiers) {
    ticket -= TIER_WEIGHTS[tier];
    if (ticket < 0) {
      chosenTier = tier;
      break;
    }
  }

  const withinTier = eligible.filter(
    (creature) => creature.tier === chosenTier,
  );
  return withinTier[Math.floor(random() * withinTier.length)] ?? withinTier[0];
}
