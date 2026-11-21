/**
 * The limited-time Scenes, and what each needs beyond the shared rules: its
 * dates and the words on its sign. Kept apart from `scenes/index.ts` so the
 * menus, the Collection and the sign can ask "is this Scene limited, and
 * how?" without importing every Scene's artwork.
 */

import type { UiKey } from "$lib/i18n/index.svelte";
import type { SceneId } from "../types";
import { CHRISTMAS_CALENDAR } from "../christmas/calendar";
import { HALLOWEEN_CALENDAR } from "../halloween/calendar";
import type { LimitedCalendar } from "./calendar";

export interface LimitedConfig {
  calendar: LimitedCalendar;
  /** What the Scene's sign says after its big day: days left, last day. */
  sign: { closesIn: UiKey; lastDay: UiKey };
}

export const LIMITED: Partial<Record<SceneId, LimitedConfig>> = {
  halloween: {
    calendar: HALLOWEEN_CALENDAR,
    sign: { closesIn: "hollow.signClosesIn", lastDay: "hollow.signLastDay" },
  },
  christmas: {
    calendar: CHRISTMAS_CALENDAR,
    sign: { closesIn: "chalet.signClosesIn", lastDay: "chalet.signLastDay" },
  },
};

/** A Scene's limited-time setup, or undefined for an always-on Scene. */
export function limitedOf(id: SceneId): LimitedConfig | undefined {
  return LIMITED[id];
}
