/**
 * How Creatures arrive in a limited-time Scene: only those its calendar has
 * unlocked, and each day's Newcomer guaranteed within the Class's first six
 * arrivals there (`session/newcomer.ts`).
 *
 * The Newcomer state is kept per Class and per Scene, so second period
 * meeting Monday's Newcomer does nothing for third period. It survives Reset
 * and a refresh: the window counts the day's arrivals, not the Session's.
 */

import { browser } from "$app/environment";
import { classes } from "$lib/classes/classes.svelte";
import type { Arrivals, CreatureDef, SceneId } from "$lib/scenes/types";
import { drawArrival, type NewcomerState } from "$lib/session/newcomer";
import { sightings } from "$lib/session/sightings.svelte";
import { today } from "$lib/today.svelte";
import {
  newcomersSoFar,
  unlockedSlugs,
  type LimitedCalendar,
} from "./calendar";

export function limitedArrivals(
  sceneId: SceneId,
  calendar: LimitedCalendar,
  creatureArt: Record<string, string>,
): Arrivals {
  const storageKey = () => classes.storageKey(`${sceneId}-newcomer`);

  function load(): NewcomerState | null {
    if (!browser) return null;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey()) ?? "null");
      return saved && typeof saved.day === "string" ? saved : null;
    } catch {
      return null;
    }
  }

  function save(state: NewcomerState) {
    if (!browser) return;
    try {
      localStorage.setItem(storageKey(), JSON.stringify(state));
    } catch {
      // Browsing privately: the guarantee still holds until a refresh.
    }
  }

  return {
    /**
     * Who can arrive today. A Creature whose artwork has not been drawn yet
     * waits, rather than arriving as nothing.
     */
    available(roster: CreatureDef[]): CreatureDef[] {
      const unlocked = unlockedSlugs(calendar, today.day);
      return roster.filter(
        (def) => unlocked.includes(def.slug) && def.slug in creatureArt,
      );
    },

    draw(available, present, random) {
      const day = today.day;
      if (day === null) return null;
      const draw = drawArrival({
        available,
        present,
        newcomers: newcomersSoFar(calendar, day),
        spotted: (slug) => sightings.count(sceneId, slug) > 0,
        state: load(),
        day,
        random,
      });
      save(draw.state);
      return draw.def;
    },
  };
}
