/**
 * Formed Creatures: a Creature that never arrives by the roll, and instead
 * forms when every Creature it is made of is on screen at once
 * (`CreatureDef.formedFrom`). At the Christmas chalet, Rudolph, Father
 * Christmas and the sleigh together become the Legendary "Father Christmas's
 * sleigh" (docs/adr/0016-christmas-chalet.md).
 *
 * Pure: the Session says who is here, who is running away and which
 * Legendaries have already come this Session.
 */

import type { CreatureDef } from "$lib/scenes/types";

export interface Combo {
  /** The Creature that forms. */
  def: CreatureDef;
  /** The ids of the Creatures it is made of, one of each, which leave. */
  ids: number[];
}

/** Whether a Creature only ever forms, rather than arriving by the roll. */
export function isFormed(def: CreatureDef): boolean {
  return (def.formedFrom?.length ?? 0) > 0;
}

/**
 * The first Creature that can form now, if any. A Creature running away
 * does not count as here, and a Legendary forms at most once a Session, as
 * it arrives at most once.
 */
export function findCombo(
  roster: readonly CreatureDef[],
  creatures: readonly { id: number; def: { slug: string } }[],
  fleeing: readonly number[],
  legends: readonly string[],
): Combo | null {
  const staying = creatures.filter(
    (creature) => !fleeing.includes(creature.id),
  );
  for (const def of roster) {
    if (!isFormed(def)) continue;
    if (def.tier === "legendary" && legends.includes(def.slug)) continue;
    if (staying.some((creature) => creature.def.slug === def.slug)) continue;
    const ids: number[] = [];
    for (const slug of def.formedFrom!) {
      const part = staying.find(
        (creature) => creature.def.slug === slug && !ids.includes(creature.id),
      );
      if (!part) break;
      ids.push(part.id);
    }
    if (ids.length === def.formedFrom!.length) return { def, ids };
  }
  return null;
}
