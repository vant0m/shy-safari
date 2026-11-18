/**
 * What the menus and the Collection say about a limited-time Scene on a
 * given day: that something new comes every school day, how long is left,
 * or when a Newcomer unlocks.
 */

import { t, type UiKey } from "$lib/i18n/index.svelte";
import type { SceneId } from "$lib/scenes/types";
import { daysLeft, phase, untilUnlock } from "./calendar";
import { limitedOf } from "./registry";

/** A Scene's hint in a menu, under its name. */
export function sceneHint(id: SceneId, day: string | null): string {
  const limited = limitedOf(id);
  if (limited) {
    const now = phase(limited.calendar, day);
    if (now === "unlocking") return t(limited.daily);
    if (now === "countdown") {
      const days = daysLeft(limited.calendar, day!);
      return days === 1 ? t("hollow.lastDay") : t("hollow.closesIn", { days });
    }
  }
  return t(`scene.${id}.hint` as UiKey);
}

/** Whether a Scene is only on offer for a while, for a badge in the menus. */
export function isLimited(id: SceneId): boolean {
  return limitedOf(id) !== undefined;
}

/**
 * When a Newcomer unlocks, on its card in the Collection: "Unlocks in 3
 * days", or, on the day before, a countdown, "Unlocks in 04:12:09".
 */
export function unlocksIn(unlocks: string, day: string, now: Date): string {
  const left = untilUnlock(unlocks, day, now);
  if ("days" in left) return t("collection.unlocksInDays", { days: left.days });
  const pad = (n: number) => String(n).padStart(2, "0");
  const { seconds } = left;
  const time = `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}`;
  return t("collection.unlocksIn", { time });
}
