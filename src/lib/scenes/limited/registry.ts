/**
 * The limited-time Scenes, and what each needs beyond the shared rules: its
 * calendar and the words on its sign. Kept apart from `scenes/index.ts` so the
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
  /** Its hint in the menus while the calendar is unlocking. */
  daily: UiKey;
  /** What the Scene's sign says: a Newcomer today, days left, last day. */
  sign: { newToday: UiKey; closesIn: UiKey; lastDay: UiKey };
  /** The Settings button that lines up every character before the class sees them. */
  preview: UiKey;
  /** The title over that line-up. */
  previewTitle: UiKey;
}

export const LIMITED: Partial<Record<SceneId, LimitedConfig>> = {
  halloween: {
    calendar: HALLOWEEN_CALENDAR,
    daily: "hollow.daily",
    sign: {
      newToday: "hollow.newToday",
      closesIn: "hollow.signClosesIn",
      lastDay: "hollow.signLastDay",
    },
    preview: "settings.previewHalloween",
    previewTitle: "preview.title",
  },
  christmas: {
    calendar: CHRISTMAS_CALENDAR,
    daily: "chalet.daily",
    sign: {
      newToday: "chalet.newToday",
      closesIn: "chalet.signClosesIn",
      lastDay: "chalet.signLastDay",
    },
    preview: "settings.previewChristmas",
    previewTitle: "preview.titleChristmas",
  },
};

/** A Scene's limited-time setup, or undefined for an always-on Scene. */
export function limitedOf(id: SceneId): LimitedConfig | undefined {
  return LIMITED[id];
}
