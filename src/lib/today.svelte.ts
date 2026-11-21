/**
 * What day it is on this computer, for the Scenes that care: the
 * limited-time ones, Pumpkin Hollow and the Christmas chalet, which are only
 * open for a few weeks a year (`scenes/limited/calendar.ts`).
 *
 * Unknown (null) until the page is running in a browser: the page is
 * prerendered with no idea of the date, and hydration must find exactly the
 * Scenes it was rendered with. Checked again every second, so a tab left open
 * overnight moves on to the next day right at midnight.
 *
 * In development `?today=2026-10-30`, or the day set in the debug menu
 * (`debug/debug.svelte.ts`), pretends it is that day, for walking the
 * calendar without waiting for it.
 */

import { browser, dev } from "$app/environment";
import { debug } from "$lib/debug/debug.svelte";
import { isDay, localDay } from "$lib/scenes/limited/calendar";

function override(): string | null {
  if (!dev) return null;
  const asked = new URLSearchParams(location.search).get("today");
  return asked && isDay(asked) ? asked : debug.dayOverride;
}

class Today {
  day = $state<string | null>(null);
  /** The time on this computer's clock, in its own time zone. */
  now = $state<Date | null>(null);
  #timeout: ReturnType<typeof setTimeout> | undefined;

  /** Start keeping track. Returns a teardown. */
  start() {
    if (!browser) return () => {};
    const check = () => {
      const now = new Date();
      this.now = now;
      this.day = override() ?? localDay(now);
      // Just after the next second turns over, so a countdown never skips one.
      this.#timeout = setTimeout(check, 1_005 - (now.getTime() % 1_000));
    };
    clearTimeout(this.#timeout);
    check();
    return () => clearTimeout(this.#timeout);
  }
}

export const today = new Today();
