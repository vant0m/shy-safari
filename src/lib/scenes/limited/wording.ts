/**
 * What the menus say about a limited-time Scene on a given day: its own hint
 * while it is open, then how long is left.
 */

import { t, type UiKey } from "$lib/i18n/index.svelte";
import type { SceneId } from "$lib/scenes/types";
import { daysLeft, phase } from "./calendar";
import { limitedOf } from "./registry";

/** A Scene's hint in a menu, under its name. */
export function sceneHint(id: SceneId, day: string | null): string {
  const limited = limitedOf(id);
  if (limited && phase(limited.calendar, day) === "countdown") {
    const days = daysLeft(limited.calendar, day!);
    return days === 1 ? t("hollow.lastDay") : t("hollow.closesIn", { days });
  }
  return t(`scene.${id}.hint` as UiKey);
}

/** Whether a Scene is only on offer for a while, for a badge in the menus. */
export function isLimited(id: SceneId): boolean {
  return limitedOf(id) !== undefined;
}
