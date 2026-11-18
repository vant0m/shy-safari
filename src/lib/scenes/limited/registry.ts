/**
 * The limited-time Scenes, and what each needs beyond the shared rules: its
 * calendar and the words on its sign. Kept apart from `scenes/index.ts` so the
 * menus, the Collection and the sign can ask "is this Scene limited, and
 * how?" without importing every Scene's artwork.
 */

import type { UiKey } from "$lib/i18n/index.svelte";
import type { SceneId } from "../types";
import { HALLOWEEN_CALENDAR } from "../halloween/calendar";
import type { LimitedCalendar } from "./calendar";

export interface LimitedConfig {
  calendar: LimitedCalendar;
  /** What the Scene's sign says: a Newcomer today, days left, last day. */
  sign: { newToday: UiKey; closesIn: UiKey; lastDay: UiKey };
  /** The Settings button that lines up every character before the class sees them. */
  preview: UiKey;
}

export const LIMITED: Partial<Record<SceneId, LimitedConfig>> = {
  halloween: {
    calendar: HALLOWEEN_CALENDAR,
    sign: {
      newToday: "hollow.newToday",
      closesIn: "hollow.signClosesIn",
      lastDay: "hollow.signLastDay",
    },
    preview: "settings.previewHalloween",
  },
};

/** A Scene's limited-time setup, or undefined for an always-on Scene. */
export function limitedOf(id: SceneId): LimitedConfig | undefined {
  return LIMITED[id];
}
